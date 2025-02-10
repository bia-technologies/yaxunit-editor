import { Symbol } from './symbols'
import { TypeDefinition, TypeHolder } from './types';

export interface Scope {
    getMembers(): Symbol[]
    findMember(name: string): Symbol | undefined
    forEachMembers(callbackfn: (value: Symbol, index: number, array: Symbol[]) => void): void;
}

export class BaseScope implements Scope {
    members: Symbol[]

    constructor(members: Symbol[]) {
        this.members = members
    }

    getMembers(): Symbol[] {
        this.beforeGetMembers()
        return this.members
    }

    forEachMembers(callbackfn: (value: Symbol, index: number, array: Symbol[]) => void): void {
        this.beforeGetMembers()
        this.members.forEach(callbackfn)
    }

    findMember(name: string): Symbol | undefined {
        this.beforeGetMembers()
        const member = this.members.find(s => s.name.localeCompare(name, undefined, { sensitivity: 'accent' }) === 0)
        console.debug('find member', name, 'in scope', this, 'result = ', member)
        return member
    }

    protected beforeGetMembers() { }
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
        this.getScopes().forEach(s => s.forEachMembers(callbackfn))
    }

    findMember(name: string): Symbol | undefined {
        for (const scope of this.scopes) {
            const member = scope.findMember(name)
            if (member) {
                return member
            }
        }
        return undefined
    }
}

export class GlobalScopeItem extends BaseScope implements TypeHolder {
    typesRegistry: { [key: string]: TypeDefinition } = {}

    resolveType(typeId: string): TypeDefinition | undefined {
        return this.typesRegistry[typeId.toLocaleLowerCase()]
    }
    
    constructor(members: Symbol[], types: TypeDefinition[]) {
        super(members)
        types.forEach(symbol => {
            this.appendType(symbol)
        });
    }
    protected appendType(symbol: TypeDefinition) {
        this.typesRegistry[symbol.id.toLocaleLowerCase()] = symbol
    }
}