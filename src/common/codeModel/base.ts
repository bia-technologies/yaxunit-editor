export interface SymbolPosition {
    startOffset: number,
    endOffset: number,
}

export interface CodeSymbol extends SymbolPosition { }

export interface ExpressionSymbol extends CodeSymbol {
    type?: string
    value?: string
}

export interface NamedSymbol extends CodeSymbol {
    name: string
}

export class BaseSymbol implements CodeSymbol {
    protected position: SymbolPosition

    constructor(position: SymbolPosition) {
        this.position = position
    }

    get startOffset() { return this.position.startOffset }
    get endOffset() { return this.position.endOffset }
}