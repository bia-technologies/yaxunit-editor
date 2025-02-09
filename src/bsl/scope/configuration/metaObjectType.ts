import { BaseScope, TypeDefinition, UnionScope, Symbol } from "@/scope";

export class MetaObjectType extends UnionScope implements TypeDefinition {
    baseType: TypeDefinition
    members: Symbol[]
    id: string
    constructor(baseType: TypeDefinition, members: Symbol[]) {
        super()
        this.scopes.push(baseType, new BaseScope(members))
        this.id = baseType.id
        this.baseType = baseType
        this.members = members
    }
}