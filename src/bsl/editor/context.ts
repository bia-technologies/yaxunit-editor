import { IDisposable, languages } from 'monaco-editor-core'
import { Scope } from '@/common/scope'

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

    registerScope(id: string, scope: Scope | Promise<Scope>): void {
        this.scopeContributions.push({ id, scope })
    }

    registerSnippets(id: string, snippets: languages.CompletionItem[] | Promise<languages.CompletionItem[]>): void {
        this.snippetContributions.push({ id, snippets })
    }

    addDisposable(disposable: IDisposable): void {
        this.disposables.push(disposable)
    }

    dispose(): void {
        while (this.disposables.length) {
            this.disposables.pop()?.dispose()
        }
    }
}
