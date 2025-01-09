import { Symbol } from './symbols'

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

export class UnionScope implements Scope {

    scopes: Scope[] = []

    getScopes(): Scope[] {
        return this.scopes
    }

    getMembers(): Symbol[] {
        let result: Symbol[] | undefined = undefined;
        const scopes = this.getScopes()

        for (let index = 1; index < scopes.length; index++) {
            if (result) {
                result = result.concat(scopes[index].getMembers());
            } else {
                result = scopes[index].getMembers()
            }
        }

        return result ?? []
    }

    forEachMembers(callbackfn: (value: Symbol, index: number, array: Symbol[]) => void): void {
        this.getScopes().forEach(s => s.getMembers().forEach(callbackfn))
    }
}
