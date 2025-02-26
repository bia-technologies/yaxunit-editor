import { Constructor, Expression, FieldAccess, MethodCall, resolveSymbol } from "@/bsl-tree-sitter";
import { IMarkdownString, languages, editor } from "monaco-editor-core";
import { EditorScope } from "../scope/editorScope";
import { getPositionOffset } from "@/monaco/utils";
import { GlobalScope, SymbolType } from "@/scope";
import { scopeProvider } from "../scopeProvider";

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
        content.push(... (await constructorDescription(typeId)))
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

async function constructorDescription(typeId: string) {
    const content: IMarkdownString[] = []
    const ctor = await GlobalScope.getConstructor(typeId)
    if (ctor && ctor.signatures.length) {
        content.push({ value: ctor.signatures[0].name })
        if (ctor.signatures[0].description) {
            content.push({ value: ctor.signatures[0].description })
        }
    } else {
        content.push({ value: `Конструктор \`${typeId}\`` })
    }
    return content
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
            case SymbolType.variable:
                typeDescription = 'Локальная переменная'
                break
            case SymbolType.property:
                if (symbol.path.length) {
                    typeDescription = 'Свойство'
                } else {
                    typeDescription = 'Глобальная переменная'
                }
                break
            case SymbolType.function:
                typeDescription = 'Функция'
                break
            case SymbolType.procedure:
                typeDescription = 'Процедура'
                break
            case SymbolType.enum:
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
    content.push({ value: `**Тип:** \`${memberType ?? 'Неизвестный'}\`` })

    return content
}