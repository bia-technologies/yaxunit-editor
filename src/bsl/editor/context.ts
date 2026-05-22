import { IDisposable, languages } from 'monaco-editor-core'
import {
    Constructor,
    ConstructorsHolder,
    isConstructorsHolder,
    isTypeHolder,
    Scope,
    TypeDefinition,
    TypeHolder
} from '@/common/scope'

export interface ScopeContribution {
    id: string
    scope: Scope | Promise<Scope>
}

export interface SnippetContribution {
    id: string
    snippets: languages.CompletionItem[] | Promise<languages.CompletionItem[]>
}

export class BslEditorContext {
    readonly scopeContributions: ScopeContribution[] = []
    readonly snippetContributions: SnippetContribution[] = []
    readonly disposables: IDisposable[] = []
    private readonly scopes: Scope[] = []
    private readonly snippets: languages.CompletionItem[] = []
    private readonly typeHolders: TypeHolder[] = []
    private readonly constructorHolders: ConstructorsHolder[] = []
    private readonly pendingContributions: Promise<void>[] = []
    private disposed = false

    registerScope(id: string, scope: Scope | Promise<Scope>): void {
        this.scopeContributions.push({ id, scope })
        const pending = Promise.resolve(scope).then(resolvedScope => {
            if (this.disposed) {
                return
            }
            this.scopes.push(resolvedScope)
            if (isTypeHolder(resolvedScope)) {
                this.typeHolders.push(resolvedScope)
            }
            if (isConstructorsHolder(resolvedScope)) {
                this.constructorHolders.push(resolvedScope)
            }
        })
        this.trackPending(pending)
    }

    registerSnippets(id: string, snippets: languages.CompletionItem[] | Promise<languages.CompletionItem[]>): void {
        this.snippetContributions.push({ id, snippets })
        const pending = Promise.resolve(snippets).then(resolvedSnippets => {
            if (this.disposed) {
                return
            }
            this.snippets.push(...resolvedSnippets)
        })
        this.trackPending(pending)
    }

    addDisposable(disposable: IDisposable): void {
        this.disposables.push(disposable)
    }

    dispose(): void {
        this.disposed = true
        while (this.disposables.length) {
            this.disposables.pop()?.dispose()
        }
        this.scopes.length = 0
        this.snippets.length = 0
        this.typeHolders.length = 0
        this.constructorHolders.length = 0
        this.pendingContributions.length = 0
    }

    getScopes(): Scope[] {
        return this.scopes
    }

    getSnippets(): languages.CompletionItem[] {
        return this.snippets
    }

    getConstructors(): Constructor[] {
        return this.constructorHolders.flatMap(holder => holder.getConstructors())
    }

    getConstructor(name: string): Constructor | undefined {
        return this.getConstructors().find(constructor => constructor.name === name)
    }

    async resolveType(typeId: string | undefined): Promise<TypeDefinition | undefined> {
        if (!typeId) {
            return undefined
        }
        const normalizedTypeId = typeId.toLocaleLowerCase()
        for (const typeHolder of this.typeHolders) {
            const type = await typeHolder.resolveType(normalizedTypeId)
            if (type) {
                return type
            }
        }
        return undefined
    }

    async whenReady(): Promise<void> {
        await Promise.all(this.pendingContributions)
    }

    private trackPending(pending: Promise<void>): void {
        this.pendingContributions.push(pending)
        void pending.finally(() => {
            const index = this.pendingContributions.indexOf(pending)
            if (index >= 0) {
                this.pendingContributions.splice(index, 1)
            }
        })
    }
}
