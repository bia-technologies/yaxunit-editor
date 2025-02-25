import { BaseScope, Scope } from "./scope"
import { Constructor, Symbol } from "./symbols"

export interface TypeDefinition extends Scope {
    id: string
}

export class PredefinedType extends BaseScope implements TypeDefinition {
    id: string

    constructor(id: string, members: Symbol[]) {
        super(members)
        this.id = id
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
