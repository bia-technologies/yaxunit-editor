import { Acceptable, CodeModelVisitor } from "../visitor"
import {
    BaseSymbol,
    CodeSymbol,
    Variable as CommonVariable,
    CompositeSymbol,
    descendantByOffset,
    ExpressionSymbol,
    NamedSymbol,
    SymbolPosition
} from "@/common/codeModel";
import { Member } from "@/common/scope";

export class BaseExpressionSymbol extends BaseSymbol implements ExpressionSymbol {
    type?: string
    value?: string
}

export class VariableSymbol extends BaseExpressionSymbol implements CommonVariable, Acceptable, NamedSymbol {
    name: string
    member?: Member

    constructor(position: SymbolPosition, name: string) {
        super(position)
        this.name = name
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitVariableSymbol(this)
    }
}

export class PropertySymbol extends BaseExpressionSymbol implements Acceptable, NamedSymbol {
    name: string
    member?: Member

    constructor(position: SymbolPosition, name: string) {
        super(position)
        this.name = name
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitPropertySymbol(this)
    }
}

export class IndexAccessSymbol extends BaseExpressionSymbol implements Acceptable, CompositeSymbol {
    index?: BaseSymbol
    member?: Member

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitIndexAccessSymbol(this)
    }

    descendantByOffset(offset: number): CodeSymbol | undefined {
        return descendantByOffset(offset, this.index)
    }
}

export class MethodCallSymbol extends BaseExpressionSymbol implements Acceptable, CompositeSymbol, NamedSymbol {
    name: string
    arguments?: BaseSymbol[]
    member?: Member

    constructor(position: SymbolPosition, name?: string) {
        super(position)
        this.name = name ?? ''
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitMethodCallSymbol(this)
    }

    descendantByOffset(offset: number): CodeSymbol | undefined {
        return this.arguments ? descendantByOffset(offset, ...this.arguments) : undefined
    }
}

export type AccessProperty = (MethodCallSymbol | VariableSymbol | PropertySymbol | IndexAccessSymbol)

export function isAccessProperty(symbol: CodeSymbol): symbol is AccessProperty {
    return symbol instanceof MethodCallSymbol
        || symbol instanceof VariableSymbol
        || symbol instanceof PropertySymbol
        || symbol instanceof IndexAccessSymbol
}

export class AccessSequenceSymbol extends BaseExpressionSymbol implements Acceptable, CompositeSymbol {
    access: AccessProperty[] = []

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitAccessSequenceSymbol(this)
    }

    descendantByOffset(offset: number): CodeSymbol | undefined {
        return descendantByOffset(offset, ...this.access)
    }
}
