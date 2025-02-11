import { Parser, Language, Tree, Point, Node, Query } from 'web-tree-sitter';
import bslURL from '/assets/tree-sitter-bsl.wasm?url'
import { editor, IDisposable, Position } from 'monaco-editor-core';
import { Method, ModuleVariable, Variable } from '../bsl/Symbols';
import { expressionTokens } from './expression';
import { scopeProvider } from '../bsl/scopeProvider';

let bslLanguage: Language | undefined = undefined

export class BslParser implements IDisposable {
    private parser?: Parser
    private tree: Tree | null = null
    private model?: editor.IReadOnlyModel

    private queries: {
        methodDefinitions?: Query,
        assignments?: Query,
        varDefinitions?: Query,
        [key: string]: Query | undefined
    } = {}
    private createdQueries: Query[] = []

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

    async init() {
        const start = performance.now()
        if (!bslLanguage) {
            await Parser.init()
            bslLanguage = await Language.load(bslURL)
        }

        this.parser = new Parser()
        this.parser.setLanguage(bslLanguage)
        console.log('parser init', performance.now() - start, 'ms')
        // this.parser.setLogger((message, lexing) => {
        //     if (lexing) {
        //         console.log(">>", message);
        //     } else {
        //         console.log(message);
        //     }
        // })
    }

    methods(): Method[] {
        const start = performance.now()
        const captures = this.methodDefinitionsQuery().captures(this.getRootNode())

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
            }
        }
        console.log('get methods', performance.now() - start, 'ms')
        return methods
    }

    vars(): ModuleVariable[] {
        const start = performance.now()
        const captures = this.varDefinitionsQuery().captures(this.getRootNode())

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

    getMethodVars(method: Method) {
        const start = performance.now()

        const captures = this.methodVarsQuery().captures(this.getRootNode(), {
            startPosition: { row: method.startLine, column: method.startColumn },
            endPosition: { row: method.endLine, column: method.endColumn }
        })

        const vars: Variable[] = []
        let currentVar: Variable | undefined

        for (const { name, node } of captures) {
            if (name === 'name') {
                vars.push(currentVar = {
                    name: node.text,
                    ...symbolPosition(node)
                })
            } else if (name === 'expression' && currentVar) {
                currentVar.type = this.calculateType(node)
            }
        }
        console.log('get method vars', performance.now() - start, 'ms')
        return vars
    }

    createQuery(queryText: string) {
        if (!bslLanguage) {
            throw 'Not init'
        }
        return new Query(bslLanguage, queryText)
    }


    calculateType(expression: Node) {
        if (!this.parser || !this.model) return;
        const tokens = expressionTokens(expression)
        if (tokens.length === 0 || tokens.filter(t => !t).length !== 0) {
            return undefined
        }
        return scopeProvider.resolveExpressionType(this.model, tokens as string[])
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


    onEditorContentChange(e: editor.IModelContentChangedEvent) {
        if (!this.parser || !this.model) return;
        if (e.changes.length == 0) return;

        if (!this.tree) {
            this.tree = this.parser.parse(this.model.getValue());
            return
        }
        const start = performance.now()
        for (const change of e.changes) {
            const startIndex = change.rangeOffset;
            const oldEndIndex = change.rangeOffset + change.rangeLength;
            const newEndIndex = change.rangeOffset + change.text.length;
            const startPosition = monacoPositionToParserPoint(this.model.getPositionAt(startIndex));
            const oldEndPosition = monacoPositionToParserPoint(this.model.getPositionAt(oldEndIndex));
            const newEndPosition = monacoPositionToParserPoint(this.model.getPositionAt(newEndIndex));
            this.tree.edit({ startIndex, oldEndIndex, newEndIndex, startPosition, oldEndPosition, newEndPosition });
        }
        this.tree = this.parser.parse(this.model.getValue(), this.tree); // TODO: Don't use getText, use Parser.Input
        console.log('update ast', performance.now() - start, 'ms')
    }

    dispose(): void {
        this.parser?.delete()
        this.tree?.delete()
        this.createdQueries.forEach(q => q.delete())
    }

    private methodDefinitionsQuery() {
        if (!this.queries.methodDefinitions) {
            this.queries.methodDefinitions = this.createQuery(
                `(function_definition name: (identifier) @name parameters: (parameters) @parameters) @function
(procedure_definition name: (identifier) @name parameters: (parameters) @parameters) @procedure`)
        }
        return this.queries.methodDefinitions
    }
    private varDefinitionsQuery() {
        if (!this.queries.varDefinitions) {
            this.queries.varDefinitions = this.createQuery(
                '(var_definition var_name: (identifier) @name export: (export_modifier) @export) @var')
        }
        return this.queries.varDefinitions
    }

    private methodVarsQuery() {
        if (!this.queries.assignments) {
            this.queries.assignments = this.createQuery(
                `(assignment_statement left: (leftValue) @name right: (expression)@expression) @assignment
(var_statement var_name: (identifier) @name) @var`)
        }
        return this.queries.assignments
    }
}

function monacoPositionToParserPoint(position: Position): Point {
    return { row: position.lineNumber, column: position.column };
}

function symbolPosition(node: Node) {
    return {
        startLine: node.startPosition.row,
        startColumn: node.startPosition.column,
        endLine: node.endPosition.row,
        endColumn: node.endPosition.column,
    }
}

if (!bslLanguage) {
    Parser.init().then(_ =>
        Language.load(bslURL).then(module => {
            bslLanguage = module
        })
    )
}