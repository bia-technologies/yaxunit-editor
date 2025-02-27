import {
    ConstructorsHolder,
    TypeDefinition,
    TypeHolder,
    isConstructorsHolder,
    isTypeHolder,
    Constructor,
    Scope,
    UnionScope
} from '@/common/scope'

export class GlobalScopeManager extends UnionScope implements TypeHolder {
    readonly typeHolders: TypeHolder[] = []
    readonly constructorHolders: ConstructorsHolder[] = []
    readonly registeredScopes: { [key: string]: Scope } = {}

    registerScope(scopeId: string, scope: Scope) {
        console.log('registerScope', scopeId, scope)
        this.scopes.push(scope)
        this.registeredScopes[scopeId] = scope

        if (isTypeHolder(scope)) {
            this.typeHolders.push(scope)
        }
        if (isConstructorsHolder(scope)) {
            this.constructorHolders.push(scope)
        }
    }

    async resolveType(typeId: string | undefined): Promise<TypeDefinition | undefined> {
        if (!typeId) {
            return undefined
        }
        typeId = typeId.toLocaleLowerCase()
        for (const typeHolder of this.typeHolders) {
            const type = await typeHolder.resolveType(typeId)
            if (type) {
                return type
            }
        }
        return undefined
    }

    getConstructors(): Constructor[] {
        return this.constructorHolders.length ? this.constructorHolders[0].getConstructors() : []
    }

    getConstructor(name: string) {
        return this.getConstructors().find(c => c.name === name)
    }
}

export const GlobalScope = new GlobalScopeManager()