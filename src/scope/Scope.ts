export enum SymbolType {
    function,
    procedure,
    property,
    enum
}
export interface Symbol {
    kind:SymbolType,
    name:string,
    type?: string
}

export interface TypeDefinition {
    id: string,
    members: Symbol[]
    getMembers(): Symbol[]
}

