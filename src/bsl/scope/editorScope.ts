import { Scope, UnionScope, GlobalScope } from '@/common/scope'
import { IPosition, editor } from 'monaco-editor-core'
import { Method } from '@/common/codeModel'
import { isModel } from '@/monaco/utils'
import { ModuleModel } from '../moduleModel'
import { BslModuleScope } from './bslModuleScope'

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

    constructor(model: editor.ITextModel, editor: editor.IStandaloneCodeEditor) {
        super()
        this.moduleScope = (model as ModuleModel).getScope()
        this.editor = editor

        this.scopes.push(this.moduleScope)
        this.scopes.push(GlobalScope)
    }

    getScopesAtPosition(position: IPosition | null): Scope[] {
        if (!position) {
            return this.scopes;
        }
        const method = this.moduleScope.collectScopeAtPosition(position)
        if (!method) {
            return this.scopes;
        } else {
            return [method].concat(this.scopes)
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

    static createScope(value: editor.IStandaloneCodeEditor): EditorScope {
        const model = value.getModel()
        if (!model) {
            throw 'Model don\'t set'
        }
        const scope = new EditorScope(model, value)
        editorsScopes.set(model, scope)

        return scope
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
    
    static getActiveScope(value: editor.ITextModel | editor.IStandaloneCodeEditor, position:IPosition): Scope {
        const scope = this.getScope(value)
        return new UnionScope(scope.getScopesAtPosition(position))
    }
}
