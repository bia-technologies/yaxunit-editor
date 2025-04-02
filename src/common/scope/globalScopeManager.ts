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
import { Emitter, IEvent } from 'monaco-editor'

const activeLoaders: Promise<Scope>[] = []

export class GlobalScopeManager extends UnionScope implements TypeHolder {
    readonly typeHolders: TypeHolder[] = []
    readonly constructorHolders: ConstructorsHolder[] = []
    readonly registeredScopes: { [key: string]: Scope } = {}
    private onLoadedEmitter: Emitter<void> = new Emitter()

    registerScope(scopeId: string, scope: Scope | Promise<Scope>) {
        const scopePromise = Promise.resolve(scope)
        activeLoaders.push(scopePromise)
        scopePromise
            .then(scope => {
                this.scopes.push(scope)
                this.registeredScopes[scopeId] = scope
                console.log('registerScope', scopeId, scope)

                if (isTypeHolder(scope)) {
                    this.typeHolders.push(scope)
                }
                if (isConstructorsHolder(scope)) {
                    this.constructorHolders.push(scope)
                }
            })
            .then(() => {
                activeLoaders.splice(activeLoaders.indexOf(scopePromise), 1)
                if (activeLoaders.length === 0) {
                    this.onLoadedEmitter.fire()
                }
            })
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

    onLoaded: IEvent<void> = (listener) => {
        return this.onLoadedEmitter.event(listener)
    }
}

export const GlobalScope = new GlobalScopeManager()