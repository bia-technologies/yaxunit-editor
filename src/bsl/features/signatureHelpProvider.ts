import { editor, languages, Position, CancellationToken } from 'monaco-editor-core'
import { scopeProvider } from '../scopeProvider'
import { Symbol, SymbolType, MethodSymbol, MethodSignature, isPlatformMethod, EditorScope, GlobalScope } from '@/scope'
import { parameterDocumentation, signatureDocumentation, signatureLabel } from './documentationRender'
import { ArgumentInfo, ArgumentsOwner, Constructor, ExpressionType, MethodCall, isArgumentsOwner, resolveMethodSymbol } from '@/tree-sitter/symbols'
import { getTreeSitterPosition } from '@/monaco/utils'

const signatureHelpProvider: languages.SignatureHelpProvider = {
    signatureHelpTriggerCharacters: ['(', ','],
    signatureHelpRetriggerCharacters: [')'],

    async provideSignatureHelp(model: editor.ITextModel, position: Position, _: CancellationToken, context: languages.SignatureHelpContext): Promise<languages.SignatureHelpResult | undefined> {
        console.debug('Method context', context)
        
        const positionOffset = getTreeSitterPosition(model, position)
        const symbol = currentSymbol(model, positionOffset)

        if (context.isRetrigger && context.activeSignatureHelp) {
            if (symbol && isArgumentsOwner(symbol)) {
                setActiveParameter(context.activeSignatureHelp, (symbol as ArgumentsOwner).arguments, positionOffset)
            }
            return {
                value: context.activeSignatureHelp,
                dispose: () => { }
            }
        }

        if (!symbol) {
            return undefined
        }
        let signatures: languages.SignatureHelp | undefined
        if (symbol.type === ExpressionType.ctor) {
            signatures = await createConstructorSignatures(symbol as Constructor)
        } else if (symbol.type === ExpressionType.methodCall) {
            signatures = await createMethodSignatures(model, symbol as MethodCall)
        }

        if (signatures) {
            setActiveSignature(signatures, symbol.arguments)
            setActiveParameter(signatures, symbol.arguments, positionOffset)
            return {
                value: signatures,
                dispose: () => { }
            }
        }
        return undefined
    },
}

function currentSymbol(model: editor.ITextModel, position: number): Constructor | MethodCall | undefined {
    const scope = EditorScope.getScope(model)
    const node = scope.getAst().getCurrentNode(position)
    if (node) {
        return resolveMethodSymbol(node)
    }
}

async function createConstructorSignatures(symbol: Constructor): Promise<languages.SignatureHelp | undefined> {
    const typeId = await symbol.getResultTypeId()
    if (typeId) {
        const ctor = GlobalScope.getConstructor(typeId)

        if (ctor) {
            const sign = {
                signatures: ctor.signatures.map(sign => {
                    return {
                        label: signatureLabel(ctor.name, sign),
                        documentation: sign.description ?? ctor.name,
                        parameters: sign.params.map(p => {
                            return {
                                label: p.name,
                                documentation: parameterDocumentation(p)
                            }
                        })
                    }
                }),
                activeParameter: 0,
                activeSignature: 0,
            }
            return sign
        }
    }
    return undefined
}

async function createMethodSignatures(model: editor.ITextModel, symbol: MethodCall): Promise<languages.SignatureHelp | undefined> {
    const method = await scopeProvider.currentMethod(model, symbol as MethodCall)
    if (!method) {
        return undefined
    }

    const isMethod = method.kind === SymbolType.function || method.kind === SymbolType.procedure
    const sign = {
        signatures: isMethod ? methodSignature(method) : [],
        activeParameter: 0,
        activeSignature: 0,
    }
    return sign
}

function setActiveSignature(signature: languages.SignatureHelp, args: ArgumentInfo[]) {
    if (signature.signatures.length <= 1) {
        return
    }

    for (let index = 0; index < signature.signatures.length; index++) {
        const sign = signature.signatures[index];
        if (sign.parameters.length >= args.length) {
            signature.activeSignature = index
            return
        }
    }

    // Если нет подходящей сигнатуры, то возьмем самую длинную
    for (let index = 0; index < signature.signatures.length; index++) {
        const sign = signature.signatures[index];
        if (sign.parameters.length > signature.signatures[signature.activeSignature].parameters.length) {
            signature.activeSignature = index
        }
    }
}

function setActiveParameter(signature: languages.SignatureHelp, args: ArgumentInfo[], position: number) {
    for (let index = args.length - 1; index >= 0; index--) {
        const arg = args[index];
        if (arg.startIndex <= position) {
            signature.activeParameter = index
            return
        }
    }
}

function methodSignature(symbol: Symbol): languages.SignatureInformation[] {
    if (isPlatformMethod(symbol)) {
        return symbol.signatures.map(s => createSignature(symbol, s))
    } else {
        const methodSymbol = symbol as MethodSymbol;
        return [createSignature(methodSymbol, methodSymbol)]
    }
}

function createSignature(method: Symbol, sign: MethodSignature): languages.SignatureInformation {
    return {
        label: signatureLabel(method, sign),
        documentation: signatureDocumentation(method, sign),
        parameters: sign.params.map(p => {
            return {
                label: p.name,
                documentation: parameterDocumentation(p)
            }
        })
    }
}

export {
    signatureHelpProvider
}
