import { Scope, UnionScope, GlobalScope } from '@/common/scope'
import { editor } from 'monaco-editor-core'
import { Method } from '@/common/codeModel'
import { isModel } from '@/monaco/utils'
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
    localScope: BslModuleScope
    editor: editor.IStandaloneCodeEditor
    modelVersionId: number = 0

    constructor(model: editor.ITextModel, editor: editor.IStandaloneCodeEditor) {
        super()
        this.localScope = new BslModuleScope(model)
        this.editor = editor

        this.scopes.push(this.localScope)
        this.scopes.push(GlobalScope)
    }

    getAst() {
        return this.localScope.parser;
    }

    getScopesAtLine(line: number | undefined): Scope[] {
        if (!line) {
            return this.scopes;
        }
        const method = this.localScope.getMethodScope(line)
        if (!method) {
            return this.scopes;
        } else {
            return [method].concat(this.scopes)
        }
    }

    getScopes(): Scope[] {
        return this.getScopesAtLine(this.editor.getPosition()?.lineNumber)
    }

    getMethods(): Method[] {
        return this.localScope.getMethods()
    }

    update() {
        const currentVersionId = this.editor.getModel()?.getVersionId()
        if (currentVersionId != this.modelVersionId) {
            this.modelVersionId = currentVersionId ?? 0
            this.localScope.updateMembers()
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
}