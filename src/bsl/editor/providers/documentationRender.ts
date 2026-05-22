import { GlobalScope, Member, MemberType, Parameter, Signature } from "@/common/scope"
import {
    AccessSequenceSymbol,
    BaseCodeModelVisitor,
    BslVariable,
    ConstructorSymbol,
    FunctionDefinitionSymbol,
    IndexAccessSymbol,
    isAcceptable,
    MethodCallSymbol,
    ParameterDefinitionSymbol,
    ProcedureDefinitionSymbol,
    PropertySymbol,
    VariableSymbol
} from "@/bsl/codeModel"
import { CodeSymbol } from "@/common/codeModel"
import { IMarkdownString } from 'monaco-editor-core'
import { ModuleModel } from "../../moduleModel"
import { BaseTypes } from "../../scope/baseTypes"
import { TypesCalculator } from "@/bsl/codeModel/calculators"
import { sourceAccessSequenceForMethodCall } from "@/bsl/codeModel/utils"

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

export async function hoverSymbolDescription(
    symbol: CodeSymbol,
    model: ModuleModel,
    typesCalculator: TypesCalculator = TypesCalculator.instance
): Promise<IMarkdownString[] | undefined> {
    const visitor = new HoverVisitor(model, typesCalculator)
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
    typesCalculator: TypesCalculator

    constructor(model: ModuleModel, typesCalculator: TypesCalculator) {
        super()
        this.model = model
        this.typesCalculator = typesCalculator
    }

    visitVariableSymbol(symbol: VariableSymbol) {
        return variableDescription(symbol, this.typesCalculator)
    }

    visitAccessSequenceSymbol(symbol: AccessSequenceSymbol) {
        return fieldDescription(symbol, this.model, this.typesCalculator)
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
        return methodDescription(symbol, this.model, this.typesCalculator)
    }

    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol) {
        return symbol.description ?? `Процедура \`${symbol.name}\``
    }

    visitFunctionDefinition(symbol: FunctionDefinitionSymbol) {
        return symbol.description ?? `Функция \`${symbol.name}\``
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

async function methodDescription(symbol: MethodCallSymbol, model: ModuleModel, typesCalculator: TypesCalculator) {
    const content: string[] = []

    if (!symbol.type) {
        await typesCalculator.calculate(sourceAccessSequenceForMethodCall(symbol, model) ?? symbol)
    }

    if (symbol.member) {
        if (symbol.member.description) {
            content.push(symbol.member.description)
        }
        if (symbol.type) {
            content.push(`**Возвращает:** \`${symbol.type}\``)
        }
    } else {
        content.push(`Метод \`${symbol.name}\``)
    }
    return content
}

async function variableDescription(symbol: VariableSymbol, typesCalculator: TypesCalculator) {
    const content: string[] = []

    let type = symbol.member?.type || symbol.type
    if (!type) {
        await typesCalculator.calculate(symbol)
        type = symbol.member?.type || symbol.type
    }

    if (symbol.member) {
        if (symbol.member instanceof BslVariable) {
            content.push(symbol.member.description ?? `Локальная переменная \`${symbol.name}\``)
        } else {
            content.push(memberDescription(symbol.member, true))
            if (symbol.member.description) {
                content.push(symbol.member.description)
            }
        }
    } else {
        content.push(`Глобальная переменная \`${symbol.name}\``)
    }

    content.push(`**Тип:** \`${symbol.type ?? BaseTypes.unknown}\``)

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

async function fieldDescription(symbol: AccessSequenceSymbol, model: ModuleModel, typesCalculator: TypesCalculator) {
    if (!symbol) {
        return 'Неизвестно'
    }
    if (!symbol.type) {
        await typesCalculator.calculate(symbol)
    }

    const last = symbol.last
    if (last instanceof VariableSymbol) {
        return variableDescription(last, typesCalculator)
    } else if (last instanceof MethodCallSymbol) {
        return methodDescription(last, model, typesCalculator)
    }

    if (!last.type) {
        await typesCalculator.calculate(symbol)
    }
    const content: string[] = []

    if (last instanceof PropertySymbol) {
        content.push(`Свойство \`${last.name}\``)
    } else if (last instanceof IndexAccessSymbol) {
        content.push(`Элемент коллекции \`${last.index}\``)
    }

    if (last.member?.description) {
        content.push(last.member.description)
    }
    content.push(`**Тип:** \`${last.type ?? BaseTypes.unknown}\``)

    return content
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
