import { BaseScope, Scope, UnionScope } from './scope'
import { LocalScope } from './localScope'
import { Position, editor } from 'monaco-editor-core'
import { GlobalScope } from '.'
import { Method } from '../bsl/Symbols'

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

export class EditorScope extends UnionScope {
    localScope: LocalScope
    editor: editor.IStandaloneCodeEditor
    constructor(model: editor.ITextModel, editor: editor.IStandaloneCodeEditor) {
        super()
        this.scopes.push(new BaseScope(GlobalScope.members))
        this.localScope = new LocalScope(model)
        this.scopes.push(this.localScope)
        this.editor = editor
    }

    getScopesAtLine(line: number | undefined): Scope[] {
        if (!line) {
            return this.scopes;
        }
        const method = this.localScope.getMethodScope(line)
        if (method === undefined) {
            return this.scopes;
        } else {
            const clone = Object.assign([], this.scopes)
            clone.push(method)
            return clone
        }
    }

    getScopes(): Scope[] {
        return this.getScopesAtLine(this.editor.getPosition()?.lineNumber)
    }

    getMethods(): Method[] {
        return this.localScope.module.methods
    }

    update() {
        this.localScope.updateMembers()
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