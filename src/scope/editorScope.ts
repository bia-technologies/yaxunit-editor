import { BaseScope, Scope, UnionScope } from './scope'
import { LocalScope } from './localScope'
import { editor } from 'monaco-editor'
import { GlobalScope } from '.'
import { Method } from '../bsl/Symbols'

const editorsScopes: Map<editor.ITextModel, EditorScope> = new Map()

function createEditorScope(model: editor.ITextModel): EditorScope {
    const scope = new EditorScope(model)
    editorsScopes.set(model, scope)

    return scope
}

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

    constructor(model: editor.ITextModel | null) {
        super()
        this.scopes.push(new BaseScope(GlobalScope.members))
        this.localScope = new LocalScope(model)
        this.scopes.push(this.localScope)
    }

    getScopesAtLine(line: number): Scope[] {
        const method = this.localScope.getMethodScope(line)
        if (method === undefined) {
            return this.getScopes()
        } else {
            const clone = Object.assign([], this.getScopes())
            clone.push(method)
            return clone
        }
    }

    getMethods(): Method[] {
        return this.localScope.module.methods
    }

    update() {
        this.localScope.updateMembers()
    }

    static getScope(value: editor.ITextModel | editor.IStandaloneCodeEditor): EditorScope {
        const model = getModel(value)
        if (!model) {
            throw 'Model don\'t set'
        }

        const res = editorsScopes.get(model)
        if (res === undefined) {
            return createEditorScope(model)
        } else {
            res.update()
            return res
        }
    }
}