export enum SymbolType {
    function,
    procedure,
    property,
    enum
}

export interface Symbol {
    kind: SymbolType,
    name: string,
    type?: string,
    description?: string
}

export interface MethodSymbol extends Symbol {
    params: Parameter[],
}

export interface Parameter {
    name: string,
    type: string,
    def: string
}
