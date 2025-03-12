import { Accessible } from "@/bsl/expressions/expressions";
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

export class BaseExpressionSymbol extends BaseSymbol implements ExpressionSymbol {
    type?: string
    value?: string
}

export class VariableSymbol extends BaseExpressionSymbol implements CommonVariable, Acceptable, NamedSymbol {
    name: string

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

export type Access = (MethodCallSymbol | VariableSymbol | PropertySymbol | IndexAccessSymbol)[]

export class AccessSequenceSymbol extends BaseExpressionSymbol implements Acceptable, CompositeSymbol, Accessible {
    access: Access = []

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitAccessSequenceSymbol(this)
    }

    descendantByOffset(offset: number): CodeSymbol | undefined {
        return descendantByOffset(offset, ...this.access)
    }

    get path(): string[] {
        const result = this.access.map(s => (s as NamedSymbol).name)
        result.pop()
        return result
    }

    get name(): string {
        return (this.access[this.access.length - 1] as NamedSymbol).name
    }
}
