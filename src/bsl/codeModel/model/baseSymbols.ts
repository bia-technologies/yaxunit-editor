import { Acceptable, CodeModelVisitor } from "@/bsl/codeModel"
import { Variable as CommonVariable, BaseSymbol, NamedSymbol, } from "@/common/codeModel";
import { Node } from "web-tree-sitter";

export class VariableSymbol extends NamedSymbol implements CommonVariable, Acceptable {
    accept(visitor: CodeModelVisitor): void {
        visitor.visitVariableSymbol(this)
    }
}
export class PropertySymbol extends NamedSymbol implements Acceptable {
    constructor(node: Node) { super(node, node.text) }
    accept(visitor: CodeModelVisitor): void {
        visitor.visitPropertySymbol(this)
    }
}

export class IndexAccessSymbol extends NamedSymbol implements Acceptable {
    accept(visitor: CodeModelVisitor): void {
        visitor.visitIndexAccessSymbol(this)
    }
}

export class MethodCallSymbol extends NamedSymbol implements Acceptable {
    arguments?: BaseSymbol[]
    accept(visitor: CodeModelVisitor): void {
        visitor.visitMethodCallSymbol(this)
    }
}

export type Access = (MethodCallSymbol | PropertySymbol | IndexAccessSymbol)[]

export class PropertyAccessSymbol extends BaseSymbol implements Acceptable {
    access: Access = []
    accept(visitor: CodeModelVisitor): void {
        visitor.visitPropertyAccessSymbol(this)
    }
}
