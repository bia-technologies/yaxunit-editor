import { editor } from "monaco-editor"
import LocalScope from "./localScope"
import { BaseScope, Scope, Symbol } from "./Scope"
import globalScope from '../scope/globalScope'


const editorsScopes: Map<editor.ITextModel, UnionScope> = new Map()
let activeEditorInstance: editor.IStandaloneCodeEditor | undefined

export class UnionScope implements Scope {

    scopes: Scope[] = [new BaseScope(globalScope.members)]

    localScope: LocalScope
    constructor(model: editor.ITextModel | null) {
        this.localScope = new LocalScope(model)
        this.scopes.push(this.localScope)
    }

    getScopes(line: number): Scope[] {
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

    getMembers(): Symbol[] {
        let result: Symbol[] | undefined = undefined;
        for (let index = 1; index < this.scopes.length; index++) {
            if (result) {
                result = result.concat(this.scopes[index].getMembers());
            } else {
                result = this.scopes[index].getMembers()
            }
        }

        return result ?? []
    }

    forEachMembers(callbackfn: (value: Symbol, index: number, array: Symbol[]) => void): void {
        this.scopes.forEach(s => s.getMembers().forEach(callbackfn))
    }
}

export function createEditorScope(editor: editor.IStandaloneCodeEditor): UnionScope {
    activeEditorInstance = editor
    const model = editor.getModel()

    if (model === null) {
        throw 'Model don\'t set'
    }
    const scope = new UnionScope(model)
    editorsScopes.set(model, scope)

    return scope
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

export function activeEditor(): editor.IStandaloneCodeEditor | undefined {
    return activeEditorInstance
}

