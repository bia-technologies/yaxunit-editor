import { GlobalScope, Member, MemberType, Parameter, Signature } from "@/common/scope"
import {
    AccessSequenceSymbol,
    BaseCodeModelVisitor,
    ConstructorSymbol,
    ConstSymbol,
    FunctionDefinitionSymbol,
    IndexAccessSymbol,
    isAcceptable,
    MethodCallSymbol,
    ParameterDefinitionSymbol,
    ProcedureDefinitionSymbol,
    PropertySymbol,
    VariableSymbol
} from "../codeModel"
import { CodeSymbol, NamedSymbol } from "@/common/codeModel"
import { isAccessible } from "../expressions/expressions"
import { IMarkdownString } from "monaco-editor-core"
import { ModuleModel } from "../moduleModel"
import { scopeProvider } from "../scopeProvider"
import { BaseTypes } from "../scope/baseTypes"

export function signatureLabel(method: Member | string, signature: Signature) {
    const name = (method as Member).name ?? method
    return name + '(' + signature.params.map(p => p.name + ':' + p.type).join(', ') + ')'
}

export function signatureDocumentation(method: Member, signature: Signature) {
    return signature.description === '' ? method.description : signature.description
}

export function parameterDocumentation(p: Parameter) {
    if (p.description) {
        return {
            value: p.description + '  \n**Тип:** ' + p.type
        }
    }
    return {
        value: '**Тип:** ' + p.type
    }
}

export async function hoverSymbolDescription(symbol: CodeSymbol, model: ModuleModel): Promise<IMarkdownString[] | undefined> {
    const visitor = new HoverVisitor(model)
    if (!isAcceptable(symbol)) {
        return
    }

    const result = await symbol.accept(visitor)

    if (Array.isArray(result)) {
        return result.map(l => { return { value: l } })
    } else if (result) {
        return [{ value: result }]
    }
}

class HoverVisitor extends BaseCodeModelVisitor {
    model: ModuleModel

    constructor(model: ModuleModel) {
        super()
        this.model = model
    }

    visitConstSymbol(symbol: ConstSymbol) {
        return ['Константа', `Значение: \`${symbol.value}\`  \nТип: \`${symbol.type}\``]
    }

    visitVariableSymbol(symbol: VariableSymbol) {
        return variableDescription(symbol, this.model)
    }

    visitPropertySymbol(symbol: PropertySymbol) {
        return fieldDescription(currentAccessSequence(symbol), this.model)
    }

    visitConstructorSymbol(symbol: ConstructorSymbol) {
        return constructorDescription(symbol)
    }

    visitParameterDefinition(symbol: ParameterDefinitionSymbol) {
        return `Параметр \`${symbol.name}\``
    }

    visitIndexAccessSymbol(symbol: IndexAccessSymbol) {
        return `Получение свойства по индексу \`${symbol.index}\``
    }

    visitMethodCallSymbol(symbol: MethodCallSymbol) {
        return methodDescription(symbol, this.model)
    }

    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol) {
        return `Процедура \`${symbol.name}\``
    }

    visitFunctionDefinition(symbol: FunctionDefinitionSymbol) {
        return `Функция \`${symbol.name}\``
    }
}

async function constructorDescription(symbol: ConstructorSymbol) {
    const content: string[] = []
    if (symbol.type) {
        const ctor = await GlobalScope.getConstructor(symbol.type)
        if (ctor && ctor.signatures.length) {
            const index = 0;//getSignatureIndex(ctor.signatures, symbol.arguments)
            const signature = ctor.signatures[index]
            content.push('Конструктор. ' + signature.name)
            if (signature.description) {
                content.push(signature.description)
            }
        } else {
            content.push(`Конструктор \`${symbol.type}\``)
        }
    }
    return content
}

async function methodDescription(symbol: MethodCallSymbol, model: ModuleModel) {
    const content: string[] = []

    const seq = currentAccessSequence(symbol)
    if (seq) {
        symbol = seq
    }

    const member = await scopeProvider.resolveSymbolMember(model, symbol)

    if (member) {
        if (member.description) {
            content.push(member.description)
        }
        const memberType = await member.type
        if (memberType) {
            content.push(`**Возвращает:** \`${memberType}\``)
        }
    } else {
        content.push(`Метод \`${symbol.name}\``)
    }
    return content
}

async function variableDescription(symbol: VariableSymbol, model: ModuleModel) {
    const content: string[] = []

    const member = await scopeProvider.resolveSymbolMember(model, symbol)
    let type = symbol.type

    if (member) {
        const mDescription = memberDescription(member, true)
        content.push(`${mDescription} \`${member.name}\``)
        if (member.description) {
            content.push(member.description)
        }
        type = await member.type
    } else {
        content.push(`Переменная \`${symbol.name}\``)
    }
    content.push(`**Тип:** \`${type ?? BaseTypes.unknown}\``)

    return content
}

function memberDescription(member: Member, isVar: boolean) {
    let memberDescription = ''
    switch (member.kind) {
        case MemberType.variable:
            memberDescription = 'Локальная переменная'
            break
        case MemberType.property:
            if (isVar) {
                memberDescription = 'Глобальная переменная'
            } else {
                memberDescription = 'Свойство'
            }
            break
        case MemberType.function:
            memberDescription = 'Функция'
            break
        case MemberType.procedure:
            memberDescription = 'Процедура'
            break
        case MemberType.enum:
            memberDescription = 'Перечисление'
            break
    }
    return memberDescription
}

async function fieldDescription(symbol: AccessSequenceSymbol | NamedSymbol | undefined, model: ModuleModel) {
    if (!symbol) {
        return 'Неизвестно'
    }
    const content: string[] = []
    const member = await scopeProvider.resolveSymbolMember(model, symbol)
    let memberType: string | undefined

    const isVar = !isAccessible(symbol) || symbol.access.length === 1

    if (member) {
        let typeDescription = memberDescription(member, isVar)

        content.push(`${typeDescription} \`${member.name}\``)
        if (member.description) {
            content.push(member.description)
        }
        memberType = await member.type
    } else {
        const typeDescription = isVar ? 'Глобальная переменная' : 'Свойство'
        content.push(`${typeDescription} \`${symbol.name}\``)
    }
    content.push(`**Тип:** \`${memberType ?? BaseTypes.unknown}\``)

    return content
}

function currentAccessSequence(symbol: MethodCallSymbol | PropertySymbol) {
    if (symbol.parent instanceof AccessSequenceSymbol) {
        const seq = new AccessSequenceSymbol(symbol.parent.position)
        seq.access = [...symbol.parent.access]
        for (let index = seq.access.length; index > 0; index--) {
            if (symbol === seq.access[index - 1]) {
                seq.access.length = index
                break
            }
        }
        return seq
    }
}
// function getSignatureIndex(signatures: Signature[], args: ArgumentInfo[]) {
//     if (signatures.length <= 1) {
//         return 0
//     }

//     for (let index = 0; index < signatures.length; index++) {
//         const sign = signatures[index];
//         if (sign.params.length >= args.length) {
//             return index
//         }
//     }

//     let signatureIndex = 0
//     // Если нет подходящей сигнатуры, то возьмем самую длинную
//     for (let index = 0; index < signatures.length; index++) {
//         const sign = signatures[index];
//         if (sign.params.length > signatures[signatureIndex].params.length) {
//             signatureIndex = index
//         }
//     }

//     return signatureIndex
// }