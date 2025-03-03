import { BaseSymbol } from "@/common/codeModel/base";
import { Node } from "web-tree-sitter";

export class BinaryExpressionSymbol extends BaseSymbol {
    left?: BaseSymbol
    right?: BaseSymbol
    operator?: string
}

export class ConstructorSymbol extends BaseSymbol {
    name?: string | BaseSymbol
    arguments?: BaseSymbol[] | BaseSymbol
}

export class ConstSymbol extends BaseSymbol {
    value: string
    type: string

    constructor(node: Node, value: string, type: string) {
        super(node)
        this.value = value
        this.type = type
    }
}