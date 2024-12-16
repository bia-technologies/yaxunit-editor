export enum SymbolType {
    function,
    procedure,
    property
}
export interface Symbol {
    kind:SymbolType,
    name:string,
    type?: string
}

export interface Scope {
    id: string,
    members: Symbol[]
}

