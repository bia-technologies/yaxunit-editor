import { BaseScope, Scope } from "./scope"
import { Symbol } from "./symbols"

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

export function isTypeHolder(object: any): object is TypeHolder {
    return (<TypeHolder>object).resolveType !== undefined

}
