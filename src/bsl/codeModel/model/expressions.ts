import { Acceptable, CodeModelVisitor } from "../visitor";
import { BaseExpressionSymbol } from "./baseSymbols";
import { CompositeSymbol, SymbolPosition } from "@/common/codeModel";

export class BinaryExpressionSymbol extends BaseExpressionSymbol implements Acceptable, CompositeSymbol {
    left?: BaseExpressionSymbol
    right?: BaseExpressionSymbol
    operator?: string

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitBinaryExpressionSymbol(this)
    }

    getChildrenSymbols() {
        return [this.left, this.right]
    }
}

export class UnaryExpressionSymbol extends BaseExpressionSymbol implements Acceptable, CompositeSymbol {
    operand?: BaseExpressionSymbol
    operator?: string

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitUnaryExpressionSymbol(this)
    }

    getChildrenSymbols() {
        return [this.operand]
    }
}

export class TernaryExpressionSymbol extends BaseExpressionSymbol implements Acceptable, CompositeSymbol {
    condition?: BaseExpressionSymbol
    consequence?: BaseExpressionSymbol
    alternative?: BaseExpressionSymbol

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitTernaryExpressionSymbol(this)
    }

    getChildrenSymbols() {
        return [this.condition, this.consequence, this.alternative]
    }
}

export class ConstructorSymbol extends BaseExpressionSymbol implements Acceptable, CompositeSymbol {
    name: string | BaseExpressionSymbol
    arguments?: BaseExpressionSymbol[] | BaseExpressionSymbol

    constructor(position: SymbolPosition, name: string | BaseExpressionSymbol, type?: string) {
        super(position)
        this.name = name
        this.type = type
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitConstructorSymbol(this)
    }

    getChildrenSymbols() {
        const children = this.arguments ? (Array.isArray(this.arguments) ? this.arguments : [this.arguments]) : []
        if (typeof this.name === 'object') {
            children.push(this.name)
        }
        return children
    }
}

export class ConstSymbol extends BaseExpressionSymbol implements Acceptable {
    value: string
    type: string

    constructor(position: SymbolPosition, value: string, type: string) {
        super(position)
        this.value = value
        this.type = type
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitConstSymbol(this)
    }
}