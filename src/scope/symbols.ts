export enum SymbolType {
    property = 0,
    function = 1,
    procedure = 2,
    enum = 3
}

export interface Symbol {
    kind: SymbolType,
    name: string,
    type?: string,
    description?: string
}

export interface MethodSymbol extends Symbol, MethodSignature {
}

export interface PlatformMethodSymbol extends Symbol {
    signatures: MethodSignature[],
}

export interface MethodSignature {
    description?: string,
    params: Parameter[],
}

export interface Parameter {
    name: string,
    type: string,
    description: string
}

export function isPlatformMethod(symbol: Symbol): symbol is PlatformMethodSymbol {
    return (<PlatformMethodSymbol>symbol).signatures !== undefined
}

export function isMethod(symbol: Symbol): symbol is MethodSymbol {
    return (<MethodSymbol>symbol).params !== undefined
}

