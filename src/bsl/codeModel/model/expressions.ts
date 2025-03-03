import { Node } from "web-tree-sitter";
import { Acceptable, CodeModelVisitor } from "../visitor";
import { BaseExpressionSymbol } from "./baseSymbols";
import { ExpressionSymbol } from "@/common/codeModel";

export class BinaryExpressionSymbol extends BaseExpressionSymbol implements Acceptable {
    left?: ExpressionSymbol
    right?: ExpressionSymbol
    operator?: string

    accept(visitor: CodeModelVisitor): void {
        visitor.visitBinaryExpressionSymbol(this)
    }
}

export class UnaryExpressionSymbol extends BaseExpressionSymbol implements Acceptable {
    operand?: ExpressionSymbol
    operator?: string

    accept(visitor: CodeModelVisitor): void {
        visitor.visitUnaryExpressionSymbol(this)
    }
}

export class TernaryExpressionSymbol extends BaseExpressionSymbol implements Acceptable {
    condition?: ExpressionSymbol
    consequence?: ExpressionSymbol
    alternative?: ExpressionSymbol

    accept(visitor: CodeModelVisitor): void {
        visitor.visitTernaryExpressionSymbol(this)
    }
}

export class ConstructorSymbol extends BaseExpressionSymbol implements Acceptable {
    name?: string | ExpressionSymbol
    arguments?: ExpressionSymbol[] | ExpressionSymbol

    accept(visitor: CodeModelVisitor): void {
        visitor.visitConstructorSymbol(this)
    }
}

export class ConstSymbol extends BaseExpressionSymbol implements Acceptable {
    value: string
    type: string

    constructor(node: Node, value: string, type: string) {
        super(node)
        this.value = value
        this.type = type
    }

    accept(visitor: CodeModelVisitor): void {
        visitor.visitConstSymbol(this)
    }
}