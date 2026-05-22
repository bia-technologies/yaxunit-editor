import { Constructor, Scope, TypeDefinition, UnionScope, GlobalScope } from '@/common/scope'
import { IPosition, editor } from 'monaco-editor-core'
import { Method } from '@/common/codeModel'
import { isModel } from '@/monaco/utils'
import { ModuleModel } from '../moduleModel'
import { BslModuleScope } from './bslModuleScope'
import { languages } from 'monaco-editor-core'
import { BslEditorContext, ScopeContribution, SnippetContribution } from '../editor/context'

const editorsScopes: Map<editor.ITextModel, EditorScope> = new Map()

function getModel(value: editor.ITextModel | editor.IStandaloneCodeEditor): editor.ITextModel | null {
    if (isModel(value)) {
        return value
    } else {
        return (<editor.IStandaloneCodeEditor>value).getModel()
    }
}

export class EditorScope extends UnionScope {
    moduleScope: BslModuleScope
    editor: editor.IStandaloneCodeEditor
    modelVersionId: number = 0
    private snippets: languages.CompletionItem[] = []
    private readonly extraScopes: Scope[] = []
    private readonly context?: BslEditorContext

    constructor(model: editor.ITextModel, editor: editor.IStandaloneCodeEditor, context?: BslEditorContext) {
        super()
        this.moduleScope = (model as ModuleModel).getScope()
        this.editor = editor
        this.context = context

        this.scopes.push(...this.baseScopes())
    }

    registerScope(scope: Scope): void {
        this.extraScopes.push(scope)
        this.scopes = this.baseScopes()
    }

    async registerScopeContribution(contribution: ScopeContribution): Promise<void> {
        this.registerScope(await contribution.scope)
    }

    async registerSnippetContribution(contribution: SnippetContribution): Promise<void> {
        this.snippets.push(...await contribution.snippets)
    }

    appendSnippets(suggestions: languages.CompletionItem[], range: languages.CompletionItem['range']): void {
        this.context?.getSnippets().forEach(snippet => {
            suggestions.push({ ...snippet, range })
        })
        this.snippets.forEach(snippet => {
            suggestions.push({ ...snippet, range })
        })
    }

    getScopesAtPosition(position: IPosition | null): Scope[] {
        const scopes = this.baseScopes()
        if (!position) {
            return scopes;
        }
        const method = this.moduleScope.collectScopeAtPosition(position)
        if (!method) {
            return scopes;
        } else {
            return [method].concat(scopes)
        }
    }

    getScopes(): Scope[] {
        return this.getScopesAtPosition(this.editor.getPosition())
    }

    getMethods(): Method[] {
        return this.moduleScope.getMethods()
    }

    update() {
        const currentVersionId = this.editor.getModel()?.getVersionId()
        if (currentVersionId != this.modelVersionId) {
            this.modelVersionId = currentVersionId ?? 0
            this.moduleScope.updateMembers()
        }
    }

    onDidChangeContent(_: editor.IModelContentChangedEvent): void {
        this.update()
    }

    init(): void {
        this.update()
    }

    async whenReady(): Promise<void> {
        await this.context?.whenReady()
    }

    async resolveType(typeId: string | undefined): Promise<TypeDefinition | undefined> {
        return await this.context?.resolveType(typeId) ?? GlobalScope.resolveType(typeId)
    }

    getConstructors(): Constructor[] {
        return [...(this.context?.getConstructors() ?? []), ...GlobalScope.getConstructors()]
    }

    getConstructor(name: string): Constructor | undefined {
        return this.getConstructors().find(constructor => constructor.name === name)
    }

    private baseScopes(): Scope[] {
        return [
            this.moduleScope,
            ...this.extraScopes,
            ...(this.context?.getScopes() ?? []),
            GlobalScope
        ]
    }

    static createScope(value: editor.IStandaloneCodeEditor, context?: BslEditorContext): EditorScope {
        const model = value.getModel()
        if (!model) {
            throw 'Model don\'t set'
        }
        const scope = new EditorScope(model, value, context)
        editorsScopes.set(model, scope)

        return scope
    }

    static disposeScope(value: editor.ITextModel | editor.IStandaloneCodeEditor): void {
        const model = getModel(value)
        if (model) {
            editorsScopes.delete(model)
        }
    }

    static getScope(value: editor.ITextModel | editor.IStandaloneCodeEditor): EditorScope {
        const model = getModel(value)
        if (!model) {
            throw 'Model don\'t set'
        }

        const res = editorsScopes.get(model)
        if (res === undefined) {
            throw 'Editor scope not exist'
        } else {
            res.update()
            return res
        }
    }

    static getActiveScope(value: editor.ITextModel | editor.IStandaloneCodeEditor, position: IPosition): Scope {
        const scope = this.getScope(value)
        return new UnionScope(scope.getScopesAtPosition(position))
    }
}
