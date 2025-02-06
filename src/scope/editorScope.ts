import { BaseScope, Scope, UnionScope } from './scope'
import { LocalScope } from './localScope'
import { editor } from 'monaco-editor-core'
import { GlobalScope } from '.'
import { Method } from '../bsl/Symbols'
import { ModelChangeHandler } from '../yaxunit/features/interfaces'

const editorsScopes: Map<editor.ITextModel, EditorScope> = new Map()

function isModel(value: editor.ITextModel | editor.IStandaloneCodeEditor): value is editor.ITextModel {
    return (<editor.ITextModel>value).getValue !== undefined;
}

function getModel(value: editor.ITextModel | editor.IStandaloneCodeEditor): editor.ITextModel | null {
    if (isModel(value)) {
        return value
    } else {
        return (<editor.IStandaloneCodeEditor>value).getModel()
    }
}

export class EditorScope extends UnionScope implements ModelChangeHandler {
    localScope: LocalScope
    editor: editor.IStandaloneCodeEditor
    constructor(model: editor.ITextModel, editor: editor.IStandaloneCodeEditor) {
        super()
        this.localScope = new LocalScope(model)
        this.editor = editor

        this.scopes.push(this.localScope)
        this.scopes.push(new BaseScope(GlobalScope.members))
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
        this.localScope.updateMembers()
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