import { BaseSymbol, NamedSymbol } from "@/common/codeModel/base";
import { Node } from "web-tree-sitter";

export class BinaryExpression extends BaseSymbol {
    left?: BaseSymbol
    right?: BaseSymbol
    operator?: string
}

export class Constructor extends BaseSymbol {
    name?: string | BaseSymbol
    arguments?: BaseSymbol[] | BaseSymbol
}

export class ConstExpression extends BaseSymbol {
    value: string
    type: string

    constructor(node: Node, value: string, type: string) {
        super(node)
        this.value = value
        this.type = type
    }
}