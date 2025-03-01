import { ArgumentInfo, Constructor, Expression, FieldAccess, MethodCall, resolveSymbol } from "@/bsl/tree-sitter";
import { IMarkdownString, languages, editor } from "monaco-editor-core";
import { EditorScope } from "@/bsl/scope/editorScope";
import { getPositionOffset } from "@/monaco/utils";
import { GlobalScope, Signature, MemberType } from "@/common/scope";
import { scopeProvider } from "@/bsl/scopeProvider";
import { BaseTypes } from "../scope/baseTypes";

export const hoverProvider: languages.HoverProvider = {
    async provideHover(model: editor.ITextModel, position): Promise<languages.Hover | undefined> {
        const start = performance.now()
        const scope = EditorScope.getScope(model)
        const node = scope.getAst().getCurrentNode(getPositionOffset(model, position))
        let content: IMarkdownString[] | undefined

        if (node) {
            const symbol = resolveSymbol(node)
            content = await symbolDescription(symbol, model)
        }

        console.log('hover', performance.now() - start, 'ms')

        return content ? { contents: content } : undefined
    },
}

async function symbolDescription(symbol: Expression, model: editor.ITextModel) {
    const content: IMarkdownString[] = []
    const typeId = await symbol.getResultTypeId(EditorScope.getScope(model))

    if (symbol instanceof Constructor && typeId) {
        content.push(... (await constructorDescription(symbol, typeId)))
    } else if (symbol instanceof MethodCall) {
        content.push(... (await methodDescription(symbol, model)))
    } else if (symbol instanceof FieldAccess) {
        content.push(... (await fieldDescription(symbol, model)))
    } else {
        content.push({ value: symbol.toString() })
        if (typeId) {
            content.push({ value: `**Тип:** \`${typeId}\`` })
        }
    }

    return content
}

async function constructorDescription(symbol: Constructor, typeId: string) {
    const content: IMarkdownString[] = []
    const ctor = await GlobalScope.getConstructor(typeId)
    if (ctor && ctor.signatures.length) {
        const index = getSignatureIndex(ctor.signatures, symbol.arguments)
        const signature = ctor.signatures[index]
        content.push({ value: 'Конструктор. ' + signature.name })
        if (signature.description) {
            content.push({ value: signature.description })
        }
    } else {
        content.push({ value: `Конструктор \`${typeId}\`` })
    }
    return content
}

function getSignatureIndex(signatures: Signature[], args: ArgumentInfo[]) {
    if (signatures.length <= 1) {
        return 0
    }

    for (let index = 0; index < signatures.length; index++) {
        const sign = signatures[index];
        if (sign.params.length >= args.length) {
            return index
        }
    }

    let signatureIndex = 0
    // Если нет подходящей сигнатуры, то возьмем самую длинную
    for (let index = 0; index < signatures.length; index++) {
        const sign = signatures[index];
        if (sign.params.length > signatures[signatureIndex].params.length) {
            signatureIndex = index
        }
    }

    return signatureIndex
}

async function methodDescription(symbol: MethodCall, model: editor.ITextModel) {
    const content: IMarkdownString[] = []
    const member = await scopeProvider.resolveSymbolMember(model, symbol)

    if (member) {
        if (member.description) {
            content.push({ value: member.description })
        }
        const memberType = await member.type
        if (memberType) {
            content.push({ value: `**Возвращает:** \`${memberType}\`` })
        }
    } else {
        content.push({ value: `Метод \`${symbol.name}\`` })
    }
    return content
}

async function fieldDescription(symbol: FieldAccess, model: editor.ITextModel) {
    const content: IMarkdownString[] = []
    const member = await scopeProvider.resolveSymbolMember(model, symbol)
    let memberType: string | undefined
    if (member) {
        let typeDescription = ''
        switch (member.kind) {
            case MemberType.variable:
                typeDescription = 'Локальная переменная'
                break
            case MemberType.property:
                if (symbol.path.length) {
                    typeDescription = 'Свойство'
                } else {
                    typeDescription = 'Глобальная переменная'
                }
                break
            case MemberType.function:
                typeDescription = 'Функция'
                break
            case MemberType.procedure:
                typeDescription = 'Процедура'
                break
            case MemberType.enum:
                typeDescription = 'Перечисление'
                break
        }
        
        content.push({ value: `${typeDescription} \`${member.name}\`` })
        if (member.description) {
            content.push({ value: member.description })
        }
        memberType = await member.type
    } else {
        const typeDescription = symbol.path.length ? 'Свойство' : 'Глобальная переменная'
        content.push({ value: `${typeDescription} \`${symbol.name}\`` })
    }
    content.push({ value: `**Тип:** \`${memberType ?? BaseTypes.unknown}\`` })

    return content
}