import { editor, IPosition, languages, Range } from 'monaco-editor-core'
import { AccessSequenceSymbol, BslVariable, ConstructorSymbol, ConstSymbol, isMemberRef, MethodCallSymbol } from '@/bsl/codeModel'
import { currentAccessSequence, getParentMethodDefinition, symbolRange } from '@/bsl/codeModel/utils'
import { scopeProvider } from '@/bsl/scopeProvider'
import { ModuleModel } from './moduleModel'
import { EditorScope } from './scope/editorScope'
import { BaseExpressionSymbol } from './codeModel'
import { BaseSymbol } from '@/common/codeModel'
import {
    GlobalScope,
    isMethod,
    isPlatformMethod,
    Member,
    MemberType,
    MethodMember,
    Scope,
    UnionScope,
    Signature
} from '@/common/scope'
import { appendKeywords, appendSnippets } from './editor/snippets'
import { hoverSymbolDescription, parameterDocumentation, signatureDocumentation, signatureLabel } from './editor/providers/documentationRender'

export async function getBslCompletions(model: ModuleModel, position: IPosition): Promise<languages.CompletionList | undefined> {
    const symbol = model.getEditingExpression(position)
    let scope: Scope | undefined

    const word = model.getWordAtPosition(position)
    const range = new Range(position.lineNumber, word?.startColumn ?? position.column, position.lineNumber, word?.endColumn ?? position.column)
    const editorScope = EditorScope.getScope(model)
    const activeScope = new UnionScope(editorScope.getScopesAtPosition(position))

    if (symbol instanceof ConstSymbol) {
        return { suggestions: [], incomplete: true }
    }

    if (symbol instanceof ConstructorSymbol) {
        return {
            suggestions: GlobalScope.getConstructors().map(c => ({
                kind: languages.CompletionItemKind.Constructor,
                label: c.name,
                insertText: c.name,
                range
            }))
        }
    }

    if (symbol instanceof AccessSequenceSymbol) {
        scope = await scopeProvider.resolveSymbolParentScope(activeScope, symbol)
    } else {
        scope = activeScope
    }

    if (!scope) {
        return undefined
    }

    const suggestions: languages.CompletionItem[] = []
    if (scope === activeScope) {
        appendKeywords(suggestions, range)
        appendSnippets(suggestions, range)
        editorScope.appendSnippets(suggestions, range)
    }
    scope.forEachMembers(m => suggestions.push(newCompletionItem(m, range)))

    return { suggestions }
}

export async function getBslHover(model: ModuleModel, position: IPosition): Promise<languages.Hover | undefined> {
    const symbol = model.getCurrentExpression(position)
    const content = symbol ? await hoverSymbolDescription(symbol, model) : undefined
    return content ? { contents: content } : undefined
}

export function getBslDefinition(model: ModuleModel, position: IPosition): languages.Definition | undefined {
    const symbol = model.getCurrentSymbol(position)

    if (symbol && isMemberRef(symbol)) {
        if (symbol.member instanceof BslVariable) {
            return symbol.member.definitions.map(s => ({
                uri: model.uri,
                range: symbolRange(s, model)
            }))
        }
        if (symbol.member instanceof BaseSymbol) {
            return {
                uri: model.uri,
                range: symbolRange(symbol.member, model)
            }
        }
    }

    return undefined
}

export function getBslDocumentSymbols(model: ModuleModel): languages.DocumentSymbol[] {
    return model.getCodeModel().methods.map(m => {
        const range = symbolRange(m, model)
        return {
            kind: languages.SymbolKind.Method,
            name: m.name,
            range,
            detail: 'Нет деталей',
            selectionRange: range,
            tags: []
        }
    })
}

export async function getBslSignatureHelp(
    model: ModuleModel,
    positionOffset: number,
    context: languages.SignatureHelpContext
): Promise<languages.SignatureHelpResult | undefined> {
    const symbol = model.getEditingMethod(positionOffset)
    const args = symbol?.arguments as BaseExpressionSymbol[]

    if (context.isRetrigger && context.activeSignatureHelp && (context.activeSignatureHelp as SignatureHelp).symbol === symbol) {
        if (args) {
            setActiveParameter(context.activeSignatureHelp, args, positionOffset)
        }
        return {
            value: context.activeSignatureHelp,
            dispose: () => {}
        }
    }

    if (!symbol) {
        return undefined
    }

    let signatures: SignatureHelp | undefined
    if (symbol instanceof ConstructorSymbol) {
        signatures = createConstructorSignatures(symbol)
    } else if (symbol instanceof MethodCallSymbol) {
        signatures = await createMethodSignatures(model, symbol)
    }

    if (!signatures) {
        return undefined
    }

    setActiveSignature(signatures, args)
    setActiveParameter(signatures, args, positionOffset)
    signatures.symbol = symbol

    return {
        value: signatures,
        dispose: () => {}
    }
}

interface SignatureHelp extends languages.SignatureHelp {
    symbol?: BaseSymbol
}

function newCompletionItem(symbol: Member, range: Range): languages.CompletionItem {
    const insertText = symbol.kind === MemberType.function || symbol.kind === MemberType.procedure
        ? methodInsertText(symbol)
        : symbol.name

    return {
        label: {
            label: symbol.name,
            description: symbol.description
        },
        kind: completionItemKind(symbol.kind),
        range,
        insertText,
        documentation: symbol.description ? {
            value: symbol.description
        } : undefined
    }
}

function methodInsertText(symbol: Member): string {
    let close = false

    if (isPlatformMethod(symbol)) {
        close = symbol.signatures.length > 0 && symbol.signatures[0].params.length === 0
    } else if (isMethod(symbol)) {
        close = symbol.params.length === 0
    }

    return symbol.name + (close ? '()' : '(')
}

function completionItemKind(type: MemberType): languages.CompletionItemKind {
    switch (type) {
        case MemberType.function:
            return languages.CompletionItemKind.Function
        case MemberType.procedure:
            return languages.CompletionItemKind.Method
        case MemberType.property:
            return languages.CompletionItemKind.Field
        case MemberType.variable:
            return languages.CompletionItemKind.Variable
        default:
            return languages.CompletionItemKind.Class
    }
}

function createConstructorSignatures(symbol: ConstructorSymbol): languages.SignatureHelp | undefined {
    if (!symbol.type) {
        return undefined
    }

    const ctor = GlobalScope.getConstructor(symbol.type)
    if (!ctor) {
        return undefined
    }

    return {
        signatures: ctor.signatures.map(sign => ({
            label: signatureLabel(ctor.name, sign),
            documentation: sign.description ?? ctor.name,
            parameters: sign.params.map(p => ({
                label: p.name,
                documentation: parameterDocumentation(p)
            }))
        })),
        activeParameter: 0,
        activeSignature: 0
    }
}

async function createMethodSignatures(model: editor.ITextModel, symbol: MethodCallSymbol): Promise<languages.SignatureHelp | undefined> {
    const seq = currentAccessSequence(symbol) ?? symbol
    const method = await scopeProvider.resolveSymbolMember(model, seq)
    if (!method) {
        return undefined
    }

    const isMethodMember = method.kind === MemberType.function || method.kind === MemberType.procedure
    return {
        signatures: isMethodMember ? methodSignature(method) : [],
        activeParameter: 0,
        activeSignature: 0
    }
}

function setActiveSignature(signature: languages.SignatureHelp, args: BaseSymbol[] | undefined) {
    if (signature.signatures.length <= 1 || !args) {
        return
    }

    for (let index = 0; index < signature.signatures.length; index++) {
        const sign = signature.signatures[index]
        if (sign.parameters.length >= args.length) {
            signature.activeSignature = index
            return
        }
    }

    for (let index = 0; index < signature.signatures.length; index++) {
        const sign = signature.signatures[index]
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
        const arg = args[index]
        if (arg && arg.startOffset <= position) {
            signature.activeParameter = index
            return
        }
    }
}

function methodSignature(symbol: Member): languages.SignatureInformation[] {
    if (isPlatformMethod(symbol)) {
        return symbol.signatures.map(s => createSignature(symbol, s))
    }

    const methodSymbol = symbol as MethodMember
    return [createSignature(methodSymbol, methodSymbol)]
}

function createSignature(method: Member, sign: Signature): languages.SignatureInformation {
    return {
        label: signatureLabel(method, sign),
        documentation: signatureDocumentation(method, sign),
        parameters: sign.params.map(p => ({
            label: p.name,
            documentation: parameterDocumentation(p)
        }))
    }
}
