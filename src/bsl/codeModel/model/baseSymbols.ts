import { Acceptable, CodeModelVisitor } from "../visitor"
import {
    BaseSymbol,
    CodeSymbol,
    Variable as CommonVariable,
    CompositeSymbol,
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

    getChildrenSymbols(): (BaseSymbol | undefined)[] {
        return [this.index]
    }
}

export class MethodCallSymbol extends BaseExpressionSymbol implements Acceptable, CompositeSymbol, NamedSymbol {
    name: string
    arguments?: BaseExpressionSymbol[]
    member?: Member

    constructor(position: SymbolPosition, name?: string) {
        super(position)
        this.name = name ?? ''
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitMethodCallSymbol(this)
    }


    getChildrenSymbols() {
        return this.arguments ?? []
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
    unclosed = false

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitAccessSequenceSymbol(this)
    }

    getChildrenSymbols() {
        return this.access
    }
}
