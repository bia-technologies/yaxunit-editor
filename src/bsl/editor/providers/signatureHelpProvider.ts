import { editor, languages, IPosition, CancellationToken } from 'monaco-editor-core'
import { scopeProvider } from '@/bsl/scopeProvider'
import { Member, MemberType, MethodMember, Signature, isPlatformMethod, GlobalScope } from '@/common/scope'
import { parameterDocumentation, signatureDocumentation, signatureLabel } from './documentationRender'
import { getEditedPositionOffset } from '@/monaco/utils'
import { ModuleModel } from '../../moduleModel'
import { BaseExpressionSymbol, ConstructorSymbol, MethodCallSymbol } from '@/bsl/codeModel'
import { BaseSymbol } from '@/common/codeModel'
import { currentAccessSequence } from '@/bsl/codeModel/utils'
import { getParentMethodDefinition } from '@/bsl/chevrotain/utils'

const signatureHelpProvider: languages.SignatureHelpProvider = {
    signatureHelpTriggerCharacters: ['(', ','],
    signatureHelpRetriggerCharacters: [')'],

    async provideSignatureHelp(model: editor.ITextModel, position: IPosition, _: CancellationToken, context: languages.SignatureHelpContext): Promise<languages.SignatureHelpResult | undefined> {
        const positionOffset = getEditedPositionOffset(model, position)
        const moduleModel = model as ModuleModel
        const symbol = moduleModel.getEditingMethod(positionOffset)

        let args = symbol?.arguments as BaseExpressionSymbol[]

        if (context.isRetrigger && context.activeSignatureHelp && (context.activeSignatureHelp as SignatureHelp).symbol === symbol) {
            if (args) {
                setActiveParameter(context.activeSignatureHelp, args, positionOffset)
            }
            return {
                value: context.activeSignatureHelp,
                dispose: () => { }
            }
        }

        if (!symbol) {
            return undefined
        }
        let signatures: SignatureHelp | undefined
        if (symbol instanceof ConstructorSymbol) {
            signatures = await createConstructorSignatures(symbol)
        } else if (symbol instanceof MethodCallSymbol) {
            signatures = await createMethodSignatures(model, symbol)
        }

        if (signatures) {
            setActiveSignature(signatures, args)
            setActiveParameter(signatures, args, positionOffset)
            signatures.symbol = symbol

            return {
                value: signatures,
                dispose: () => { }
            }
        }
        return undefined
    },
}

interface SignatureHelp extends languages.SignatureHelp {
    symbol?: BaseSymbol
}

async function createConstructorSignatures(symbol: ConstructorSymbol): Promise<languages.SignatureHelp | undefined> {
    if (symbol.type) {
        const ctor = GlobalScope.getConstructor(symbol.type)

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

async function createMethodSignatures(model: editor.ITextModel, symbol: MethodCallSymbol): Promise<languages.SignatureHelp | undefined> {
    const seq = currentAccessSequence(symbol) ?? symbol
    const method = await scopeProvider.resolveSymbolMember(model, seq)
    if (!method) {
        return undefined
    }

    const isMethod = method.kind === MemberType.function || method.kind === MemberType.procedure
    const sign = {
        signatures: isMethod ? methodSignature(method) : [],
        activeParameter: 0,
        activeSignature: 0,
    }
    return sign
}

function setActiveSignature(signature: languages.SignatureHelp, args: BaseSymbol[] | undefined) {
    if (signature.signatures.length <= 1 || !args) {
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

function setActiveParameter(signature: languages.SignatureHelp, args: BaseSymbol[] | undefined, position: number) {
    if (!args) {
        return
    }
    const methodOffset = getParentMethodDefinition(args[0])?.position.startOffset ?? 0
    position -= methodOffset

    for (let index = args.length - 1; index >= 0; index--) {
        const arg = args[index];
        if (arg && arg.startOffset <= position) { // TODO empty args support
            signature.activeParameter = index
            return
        }
    }
}

function methodSignature(symbol: Member): languages.SignatureInformation[] {
    if (isPlatformMethod(symbol)) {
        return symbol.signatures.map(s => createSignature(symbol, s))
    } else {
        const methodSymbol = symbol as MethodMember;
        return [createSignature(methodSymbol, methodSymbol)]
    }
}

function createSignature(method: Member, sign: Signature): languages.SignatureInformation {
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
