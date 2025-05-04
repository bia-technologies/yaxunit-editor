import { BaseSymbol, ExpressionSymbol, Variable } from "@/common/codeModel";
import { Member, MemberType } from "@/common/scope";

export class BslVariable implements Variable, Member {
    name: string
    type?: string
    value?: string
    definitions: BaseSymbol[] = []
    variableType: BslVariableType = BslVariableType.Unknown

    constructor(name: string) {
        this.name = name
    }

    setTypeValue(symbol: ExpressionSymbol) {
        if (symbol.type) {
            this.type = symbol.type
        }
        if (symbol.value) {
            this.value = symbol.value
        }
    }

    get kind() {
        return MemberType.variable
    }

    get description(){
        switch(this.variableType){
            case BslVariableType.LocalVariable:
                return '```bsl\n' + `Перем ${this.name}: ${this.type}` + '\n```'
            case BslVariableType.Parameter:
                return '```bsl\n' + `(Параметр) Перем ${this.name}: ${this.type}` + '\n```'
            default:
                return this.name
        }
    }
}

export enum BslVariableType {
    LocalVariable,
    GlobalVariable,
    Parameter,
    Unknown
}