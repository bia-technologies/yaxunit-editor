import { Acceptable, CodeModelVisitor } from "../visitor"
import { Variable as CommonVariable, BaseSymbol, ExpressionSymbol, NamedSymbol } from "@/common/codeModel";
import { Node } from "web-tree-sitter";

export class BaseExpressionSymbol extends BaseSymbol implements ExpressionSymbol {
    type?: string
    value?: string
}

export class NamedExpressionSymbol extends BaseExpressionSymbol implements ExpressionSymbol, NamedSymbol {
    name: string

    constructor(node: Node, name?: string) {
        super(node)
        this.name = name ?? ''
    }
}

export class VariableSymbol extends NamedExpressionSymbol implements CommonVariable, Acceptable, ExpressionSymbol {
    accept(visitor: CodeModelVisitor): void {
        visitor.visitVariableSymbol(this)
    }
}
export class PropertySymbol extends NamedExpressionSymbol implements Acceptable {
    constructor(node: Node) { super(node, node.text) }
    accept(visitor: CodeModelVisitor): void {
        visitor.visitPropertySymbol(this)
    }
}

export class IndexAccessSymbol extends NamedExpressionSymbol implements Acceptable {
    accept(visitor: CodeModelVisitor): void {
        visitor.visitIndexAccessSymbol(this)
    }
}

export class MethodCallSymbol extends NamedExpressionSymbol implements Acceptable {
    arguments?: BaseSymbol[]
    accept(visitor: CodeModelVisitor): void {
        visitor.visitMethodCallSymbol(this)
    }
}

export type Access = (MethodCallSymbol | PropertySymbol | IndexAccessSymbol)[]

export class AccessSequenceSymbol extends BaseExpressionSymbol implements Acceptable {
    access: Access = []
    accept(visitor: CodeModelVisitor): void {
        visitor.visitAccessSequenceSymbol(this)
    }
}
