import { editor } from "monaco-editor"
import LocalScope from "./localScope"
import { TypeDefinition } from "./Scope"
import globalScope from '../scope/globalScope'


const editorsScopes: Map<editor.ITextModel, UnionScope> = new Map()

export class UnionScope {

    scopes: TypeDefinition[] = [{
        id: globalScope.id,
        members: globalScope.members,
        getMembers: () => globalScope.members
    }]

    localScope: LocalScope
    constructor(model: editor.ITextModel | null) {
        this.localScope = new LocalScope(model)
        this.scopes.push(this.localScope)
    }

    getScopes(line: number): TypeDefinition[] {
        const method = this.localScope.getMethodScope(line)
        if (method === undefined) {
            return this.scopes
        } else {
            const clone = Object.assign([], this.scopes)
            clone.push(method)
            return clone
        }
    }
    update() {
        this.localScope.getMembers()
    }
}

export function createEditorScope(editor: editor.IStandaloneCodeEditor) {
    const model = editor.getModel()

    if (model === null) {
        throw 'Model don\'t set'
    }
    editorsScopes.set(model, new UnionScope(model))
}

export function getEditorScope(editor: editor.IStandaloneCodeEditor): UnionScope {
    const model = editor.getModel()

    if (model === null) {
        throw 'Model don\'t set'
    }
    return getModelScope(model)
}
export function getModelScope(model: editor.ITextModel): UnionScope {
    const res = editorsScopes.get(model)
    if (res === undefined) {
        throw 'Scope don\'t set'
    }
    res.update()
    return res
}

