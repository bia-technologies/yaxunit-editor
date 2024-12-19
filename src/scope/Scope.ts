export enum SymbolType {
    function,
    procedure,
    property,
    enum
}
export interface Symbol {
    kind: SymbolType,
    name: string,
    type?: string
}

export interface TypeDefinition {
    id: string,
    getMembers(): Symbol[]
}

export class PredefinedType implements TypeDefinition{
    id: string
    members: Symbol[]
    constructor(id: string, members: Symbol[]) {
        this.id = id
        this.members = members
    }
    getMembers(): Symbol[] {
        return this.members
    }
}