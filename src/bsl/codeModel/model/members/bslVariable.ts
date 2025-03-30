import { BaseSymbol, ExpressionSymbol, Variable } from "@/common/codeModel";
import { Member, MemberType } from "@/common/scope";

export class BslVariable implements Variable, Member {
    name: string
    type?: string
    value?: string
    description?: string
    definitions: BaseSymbol[] = []

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
}