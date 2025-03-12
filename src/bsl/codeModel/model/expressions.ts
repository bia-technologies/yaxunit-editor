import { Acceptable, CodeModelVisitor } from "../visitor";
import { BaseExpressionSymbol } from "./baseSymbols";
import { CodeSymbol, CompositeSymbol, descendantByOffset, SymbolPosition } from "@/common/codeModel";

export class BinaryExpressionSymbol extends BaseExpressionSymbol implements Acceptable, CompositeSymbol {
    left?: BaseExpressionSymbol
    right?: BaseExpressionSymbol
    operator?: string

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitBinaryExpressionSymbol(this)
    }

    descendantByOffset(offset: number): CodeSymbol | undefined {
        return descendantByOffset(offset, this.left, this.right)
    }
}

export class UnaryExpressionSymbol extends BaseExpressionSymbol implements Acceptable, CompositeSymbol {
    operand?: BaseExpressionSymbol
    operator?: string

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitUnaryExpressionSymbol(this)
    }

    descendantByOffset(offset: number): CodeSymbol | undefined {
        return descendantByOffset(offset, this.operand)
    }
}

export class TernaryExpressionSymbol extends BaseExpressionSymbol implements Acceptable, CompositeSymbol {
    condition?: BaseExpressionSymbol
    consequence?: BaseExpressionSymbol
    alternative?: BaseExpressionSymbol

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitTernaryExpressionSymbol(this)
    }

    descendantByOffset(offset: number): CodeSymbol | undefined {
        return descendantByOffset(offset, this.condition, this.consequence, this.alternative)
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

    descendantByOffset(offset: number): CodeSymbol | undefined {
        return (this.arguments && Array.isArray(this.arguments) ? descendantByOffset(offset, ...this.arguments as BaseExpressionSymbol[]) : undefined) ??
            descendantByOffset(offset, this.name instanceof BaseExpressionSymbol ? this.name : undefined, !Array.isArray(this.arguments) ? this.arguments : undefined)
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