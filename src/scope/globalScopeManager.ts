import { Scope, UnionScope } from './scope'
import { TypeDefinition, TypeHolder, isTypeHolder } from './types'

export class GlobalScopeManager extends UnionScope implements TypeHolder {
    readonly typeHolders: TypeHolder[] = []
    readonly registeredScopes: {[key:string]:Scope} = {}

    registerScope(scopeId: string, scope: Scope) {
        console.log('registerScope', scopeId, scope)
        this.scopes.push(scope)
        this.registeredScopes[scopeId] = scope

        if (isTypeHolder(scope)) {
            this.typeHolders.push(scope)
        }
    }

    resolveType(typeId: string): TypeDefinition | undefined {
        typeId = typeId.toLocaleLowerCase()
        for (const typeHolder of this.typeHolders) {
            const type = typeHolder.resolveType(typeId)
            if (type) {
                return type
            }
        }
        return undefined
    }
}

export const GlobalScope = new GlobalScopeManager()