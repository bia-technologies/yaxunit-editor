export interface Symbol {
    name: string
}

export interface SymbolRange extends Symbol {
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
}

