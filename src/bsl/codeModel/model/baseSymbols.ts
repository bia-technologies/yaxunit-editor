import { Acceptable, CodeModelVisitor } from "../visitor"
import { BaseSymbol, Variable as CommonVariable, ExpressionSymbol, NamedSymbol, SymbolPosition } from "@/common/codeModel";

export class BaseExpressionSymbol extends BaseSymbol implements ExpressionSymbol {
    type?: string
    value?: string
}

export class NamedExpressionSymbol extends BaseExpressionSymbol implements ExpressionSymbol, NamedSymbol {
    name: string

    constructor(position: SymbolPosition, name?: string) {
        super(position)
        this.name = name ?? ''
    }
}

export class VariableSymbol extends NamedExpressionSymbol implements CommonVariable, Acceptable, ExpressionSymbol {
    accept(visitor: CodeModelVisitor): void {
        visitor.visitVariableSymbol(this)
    }
}
export class PropertySymbol extends NamedExpressionSymbol implements Acceptable {
    constructor(position: SymbolPosition, name?: string) { super(position, name) }
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
