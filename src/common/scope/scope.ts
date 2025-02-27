import { Member } from './members'
import { TypeDefinition, TypeHolder } from './types';

export interface Scope {
    getMembers(): Member[]
    findMember(name: string): Member | undefined
    forEachMembers(callbackfn: (value: Member, index: number, array: Member[]) => void): void;
}

export class BaseScope implements Scope {
    members: Member[]

    constructor(members: Member[]) {
        this.members = members
    }

    getMembers(): Member[] {
        this.beforeGetMembers()
        return this.members
    }

    forEachMembers(callbackfn: (value: Member, index: number, array: Member[]) => void): void {
        this.beforeGetMembers()
        this.members.forEach(callbackfn)
    }

    findMember(name: string): Member | undefined {
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

    getMembers(): Member[] {
        let result: Member[] | undefined = undefined;
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

    forEachMembers(callbackfn: (value: Member, index: number, array: Member[]) => void): void {
        this.getScopes().forEach(s => s.forEachMembers(callbackfn))
    }

    findMember(name: string): Member | undefined {
        for (const scope of this.getScopes()) {
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

    async resolveType(typeId: string): Promise<TypeDefinition | undefined> {
        return this.typesRegistry[typeId.toLocaleLowerCase()]
    }

    constructor(members: Member[], types: TypeDefinition[]) {
        super(members)
        types.forEach(symbol => {
            this.appendType(symbol)
        });
    }
    protected appendType(symbol: TypeDefinition) {
        this.typesRegistry[symbol.id.toLocaleLowerCase()] = symbol
    }
}