import { Parser, Language, Tree, Point, Node, Query, } from 'web-tree-sitter';
import bslURL from '/assets/tree-sitter-bsl.wasm?url'
import { editor, IDisposable, Position } from 'monaco-editor-core';
import { Method, ModuleVariable, Variable } from '../bsl/Symbols';
import { expressionTokens } from './expression';
import { scopeProvider } from '../bsl/scopeProvider';
import { Queries } from './queries';

let bslLanguage: Language | undefined = undefined

export class BslParser implements IDisposable {
    private parser: Parser
    private tree: Tree | null = null
    private model: editor.IReadOnlyModel
    disposable: IDisposable[] = []

    private queries: Queries = new Queries()

    constructor(model: editor.IReadOnlyModel) {
        if (!bslLanguage) {
            throw 'Not init'
        }
        const start = performance.now()
        this.parser = new Parser()
        this.parser.setLanguage(bslLanguage)
        this.setModel(this.model = model)
        this.disposable.push(this.model.onDidChangeContent(e => this.onEditorContentChange(e)))
        console.log('parser init', performance.now() - start, 'ms')
    }

    setModel(model: editor.IReadOnlyModel) {
        this.model = model
        this.setContent(model.getValue())
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
        if (!this.tree) {
            throw 'Dont parsed'
        }

        const cursor = this.tree.walk()
        let currentNode
        try {
            let success = true
            while (success) {
                if (cursor.startIndex <= position && position <= cursor.endIndex) {
                    currentNode = cursor.currentNode
                    success = cursor.gotoFirstChild()
                } else {
                    success = cursor.gotoNextSibling()
                }
                if (!success) {
                    break
                }
            }
        } finally {
            cursor.delete()
        }
        return currentNode
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

    methods(): Method[] {
        const start = performance.now()
        const captures = this.queries.methodDefinitionsQuery().captures(this.getRootNode())

        const methods: Method[] = []
        let currentMethod: Method | undefined
        for (const { name, node } of captures) {
            if (name === 'function') {
                currentMethod = {
                    name: '',
                    params: [],
                    isProc: false,
                    isExport: false,
                    ...symbolPosition(node)
                }
                methods.push(currentMethod)
            } else if (name === 'procedure') {
                currentMethod = {
                    name: '',
                    params: [],
                    isProc: true,
                    isExport: false,
                    ...symbolPosition(node)
                }
                methods.push(currentMethod)
            } else if (name === 'name' && currentMethod) {
                currentMethod.name = node.text
            } else if (name === 'export' && currentMethod) {
                currentMethod.isExport = true
            }
        }
        console.log('get methods', performance.now() - start, 'ms')
        return methods.filter(m => m.name)
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
        const tokens = expressionTokens(expression)
        if (tokens.length === 0 || tokens.filter(t => !t).length !== 0) {
            return undefined
        }
        return await scopeProvider.resolveExpressionType(this.model, tokens as string[])
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
    }

    dispose(): void {
        this.disposable.forEach(d => d.dispose())
        this.parser?.delete()
        this.tree?.delete()
        this.queries.dispose()
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

function symbolPosition(node: Node) {
    return {
        startLine: node.startPosition.row + 1,
        startColumn: node.startPosition.column + 1,
        endLine: node.endPosition.row + 1,
        endColumn: node.endPosition.column + 1,
    }
}

export async function useTreeSitterBsl(): Promise<void> {
    if (bslLanguage) {
        return
    }
    await Parser.init()
    bslLanguage = await Language.load(bslURL)
}

if (!bslLanguage) {
}