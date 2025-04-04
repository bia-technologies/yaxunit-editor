export interface SymbolPosition {
    startOffset: number,
    endOffset: number,
}

export type CodeSymbol = SymbolPosition

export interface CompositeSymbol {
    getChildrenSymbols(): (BaseSymbol | undefined)[]
}

export interface ExpressionSymbol extends CodeSymbol {
    type?: string
    value?: string
}

export interface NamedSymbol extends CodeSymbol {
    name: string
}

export class BaseSymbol implements CodeSymbol {
    position: SymbolPosition
    parent?: BaseSymbol

    constructor(position: SymbolPosition) {
        this.position = position
    }

    get startOffset() { return this.position.startOffset }
    get endOffset() { return this.position.endOffset }
}