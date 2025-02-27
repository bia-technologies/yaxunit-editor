import { BaseScope, Scope } from "./scope"
import { Constructor, Member } from "./members"

export interface TypeDefinition extends Scope {
    id: string
}

export class PredefinedType extends BaseScope implements TypeDefinition {
    id: string
    description?: string

    constructor(id: string, members: Member[], description?: string) {
        super(members)
        this.id = id
        this.description = description
    }
}

export interface TypeHolder {
    resolveType(typeId: string): Promise<TypeDefinition | undefined>
}
export interface ConstructorsHolder {
    getConstructors(): Constructor[]
}

export function isTypeHolder(object: any): object is TypeHolder {
    return (<TypeHolder>object).resolveType !== undefined
}

export function isConstructorsHolder(object: any): object is ConstructorsHolder {
    return (<ConstructorsHolder>object).getConstructors !== undefined
}
