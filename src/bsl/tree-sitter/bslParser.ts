import { Parser, Language, Tree, Point, Node, Query, } from 'web-tree-sitter'
import bslURL from '/assets/tree-sitter-bsl.wasm?url'
import { editor, Position } from 'monaco-editor-core'
import { Method, ModuleVariable, Variable } from '@/common/codeModel'
import { Queries } from './queries'
import { isModel } from '@/monaco/utils'
import { Scope } from '@/common/scope'
import { EditorScope } from '@/bsl/scope/editorScope'
import { AutoDisposable } from '@/common/utils/autodisposable'
import { createSymbolForNode } from '.'

let bslLanguage: Language | undefined = undefined

export class BslParser extends AutoDisposable {
    private parser: Parser
    private tree: Tree | null = null
    private model?: editor.IReadOnlyModel

    private readonly queries: Queries

    constructor(model: editor.IReadOnlyModel | string) {
        super()
        if (!bslLanguage) {
            throw 'Constructor: bsl language not loaded'
        }
        const start = performance.now()
        this.parser = new Parser()
        this.parser.setLanguage(bslLanguage)

        if (isModel(model)) {
            this.setModel(this.model = model)
            this._disposables.push(this.model.onDidChangeContent(e => this.onEditorContentChange(e)))
        } else {
            this.setContent(model)
        }
        this._disposables.push(this.queries = new Queries())

        console.log('parser init', performance.now() - start, 'ms')
    }

    setModel(model: editor.IReadOnlyModel) {
        this.model = model
        this.setContent(model.getValue())
    }

    get scope(): Scope | undefined {
        return this.model ? EditorScope.getScope(this.model) : undefined
    }

    setContent(content: string) {
        if (!this.parser) {
            throw 'Not init'
        }
        const start = performance.now()
        this.tree = this.parser.parse(content)
        console.log('first parse ast', performance.now() - start, 'ms')
    }

    getAst(): Tree | null {
        return this.tree
    }

    getRootNode(): Node {
        if (!this.tree) {
            throw 'Dont parsed'
        }
        return this.tree.rootNode
    }

    getCurrentNode(position: number) {
        return this.getNodeAtPosition(position, position)
    }

    getCurrentEditingNode(position: number) {
        return this.getNodeAtPosition(position - 1, position)
    }

    getMissings() {
        const start = performance.now()
        const captures = this.queries.missingQuery().captures(this.getRootNode())

        const nodes: Node[] = []

        for (const { node } of captures) {
            nodes.push(node)
        }

        console.log('get missings', performance.now() - start, 'ms')
        return nodes
    }

    getErrors() {
        const start = performance.now()
        const captures = this.queries.errorQuery().captures(this.getRootNode())

        const nodes: Node[] = []

        for (const { node } of captures) {
            nodes.push(node)
        }

        console.log('get errors', performance.now() - start, 'ms')
        return nodes
    }

    private getNodeAtPosition(startPosition: number, endPosition: number) {
        if (!this.tree) {
            throw 'Dont parsed'
        }

        return this.getRootNode().namedDescendantForIndex(startPosition, endPosition)
    }

    findParenNode(node: Node, predicate: (node: Node) => boolean) {
        let currentNode: Node | null = node

        while (currentNode !== null && (currentNode = currentNode.parent) !== null) {
            if (predicate(currentNode)) {
                return currentNode
            }
        }
        return undefined
    }

    vars(): ModuleVariable[] {
        const start = performance.now()
        const captures = this.queries.varDefinitionsQuery().captures(this.getRootNode())

        const vars: ModuleVariable[] = []

        let currentVars: ModuleVariable[] = []
        for (const { name, node } of captures) {
            if (name === 'var') {
                currentVars.length = 0
            } else if (name === 'export') {
                currentVars.forEach(v => v.isExport = true)
            } else if (name === 'name') {
                const var_def: ModuleVariable = {
                    name: node.text,
                    isExport: false,
                    ...symbolPosition(node)
                }
                currentVars.push(var_def)
                vars.push(var_def)
            }
        }

        console.log('get vars', performance.now() - start, 'ms')
        return vars
    }

    *getMethodVars(method: Method) {
        const captures = this.queries.methodVarsQuery().captures(this.getRootNode(), {
            startPosition: { row: method.startLine - 1, column: method.startColumn - 1 },
            endPosition: { row: method.endLine - 1, column: method.endColumn - 1 }
        })

        const vars: Variable[] = []
        let currentVar: Variable | undefined

        for (const { name, node } of captures) {
            if (name === 'name') {
                vars.push(currentVar = {
                    name: node.text,
                    ...symbolPosition(node)
                })
                yield currentVar
            } else if (name === 'expression' && currentVar) {
                currentVar.type = this.calculateType(node)
            }
        }
    }

    async calculateType(expression: Node) {
        if (!this.parser || !this.model) return;
        const symbol = createSymbolForNode(expression)
        if (symbol) {
            return await symbol.getResultTypeId(this.scope)
        }
    }

    logNodes(nodes: (Node | null)[]) {
        for (const node of nodes) {
            if (!node) {
                continue
            }
            console.log(node?.type, node?.typeId, node)
            if (node?.children) {
                this.logNodes(node.children)
            }
        }
    }

    private onEditorContentChange(e: editor.IModelContentChangedEvent) {
        if (!this.parser || !this.model) return;
        if (e.changes.length == 0) return;

        if (!this.tree) {
            this.tree = this.parser.parse(this.model.getValue());
            return
        }
        console.log('changed', e)
        const start = performance.now()
        for (const change of e.changes) {
            const startIndex = change.rangeOffset;
            const oldEndIndex = change.rangeOffset + change.rangeLength;
            const newEndIndex = change.rangeOffset + change.text.length;
            const startPosition = monacoOffsetToPoint(this.model, startIndex);
            const oldEndPosition = monacoOffsetToPoint(this.model, oldEndIndex);
            const newEndPosition = monacoOffsetToPoint(this.model, newEndIndex);
            this.tree.edit({ startIndex, oldEndIndex, newEndIndex, startPosition, oldEndPosition, newEndPosition });
        }
        this.tree = this.parser.parse(this.model.getValue(), this.tree); // TODO: Don't use getText, use Parser.Input
        console.log('update ast', performance.now() - start, 'ms')
        const missings = this.getMissings()
        if (missings.length) {
            console.log(missings.map(n => `Missing ${n?.type} at ${n.startIndex}`))
        }
        const errors = this.getErrors()
        if (errors.length) {
            console.log(errors.map(n => `Error at ${n.startIndex}`))
        }
    }

    dispose(): void {
        super.dispose()
        this.parser?.delete()
        this.tree?.delete()
    }
}

export function createQuery(queryText: string) {
    if (!bslLanguage) {
        throw 'Not init'
    }
    return new Query(bslLanguage, queryText)
}

function monacoOffsetToPoint(model: editor.ITextModel, offset: number): Point {
    return monacoPositionToPoint(model.getPositionAt(offset))
}

function monacoPositionToPoint(position: Position): Point {
    return { row: position.lineNumber - 1, column: position.column - 1 };
}

export async function useTreeSitterBsl(): Promise<void> {
    if (bslLanguage) {
        return
    }
    await Parser.init()

    if ((self as any).process?.versions.node) { // Run in node js env
        // Fix error: Error: Dynamic require of "fs/promises" is not supported
        const bytes = await readOnNode(bslURL)
        bslLanguage = await Language.load(bytes)
    } else {
        bslLanguage = await Language.load(bslURL)
    }
}

function symbolPosition(node: Node) {
    return {
        startLine: node.startPosition.row + 1,
        startColumn: node.startPosition.column + 1,
        endLine: node.endPosition.row + 1,
        endColumn: node.endPosition.column + 1,
    }
}

async function readOnNode(resolvedUrl: string) {
    const fs_promises_name = 'node:fs/promises'
    const fs = await import(/* @vite-ignore */fs_promises_name)

    const buffer = await fs.readFile('.' + resolvedUrl)
    return new Uint8Array(buffer);
}