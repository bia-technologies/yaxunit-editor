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

export interface Scope {
    getMembers(): Symbol[]
    forEachMembers(callbackfn: (value: Symbol, index: number, array: Symbol[]) => void): void;
}

export interface TypeDefinition extends Scope {
    id: string
}


export class BaseScope implements Scope {
    members: Symbol[]
    
    constructor(members: Symbol[]) {
        this.members = members
    } 
    
    getMembers(): Symbol[] {
        return this.members
    }

    forEachMembers(callbackfn: (value: Symbol, index: number, array: Symbol[]) => void): void {
        this.members.forEach(callbackfn)
    }
}

export class PredefinedType extends BaseScope implements TypeDefinition {
    id: string
    
    constructor(id: string, members: Symbol[]) {
        super(members)
        this.id = id
    }
    
    getMembers(): Symbol[] {
        return this.members
    }
}