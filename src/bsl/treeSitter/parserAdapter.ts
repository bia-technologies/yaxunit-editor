import { editor } from 'monaco-editor-core'
import {
    AccessSequenceSymbol,
    AssignmentStatementSymbol,
    BslCodeModel,
    ConstructorSymbol,
    FunctionDefinitionSymbol,
    MethodCallSymbol,
    ParameterDefinitionSymbol,
    ProcedureDefinitionSymbol,
    PropertySymbol,
    VariableDefinitionSymbol,
    VariableSymbol
} from '@/bsl/codeModel'
import { ModuleModel } from '@/bsl/moduleModel'
import { ParserAdapter, ParserDiagnostic } from '@/bsl/parserAdapter'
import { BaseExpressionSymbol } from '../codeModel'
import { BaseSymbol, SymbolPosition } from '@/common/codeModel'

export interface TreeSitterBslRuntime {
    parse(text: string): TreeSitterParseResult | TreeSitterNode
}

export interface TreeSitterParseResult {
    rootNode?: TreeSitterNode
}

export interface TreeSitterNode {
    type: string
    text?: string
    startIndex?: number
    endIndex?: number
    from?: number
    to?: number
    namedChildren?: TreeSitterNode[]
    children?: TreeSitterNode[]
    namedChildCount?: number
    childCount?: number
    namedChild?(index: number): TreeSitterNode | null
    child?(index: number): TreeSitterNode | null
    childForFieldName?(name: string): TreeSitterNode | null
}

export const TREE_SITTER_BSL_NODE_MAP = {
    methodDeclarations: ['procedure_definition', 'function_definition'],
    parameters: ['parameters', 'parameter'],
    variableDeclarations: ['var_definition', 'var_statement', 'variable_spec'],
    callExpressions: ['call_expression'],
    accessChains: ['access', 'property_access'],
    constructors: ['new_expression'],
    assignments: ['assignment_statement']
} as const

export class TreeSitterParserAdapter implements ParserAdapter {
    readonly id = 'tree-sitter'
    private diagnostics: ParserDiagnostic[] = []
    private sourceText = ''

    constructor(private readonly runtime?: TreeSitterBslRuntime) {}

    buildModel(model: ModuleModel | string): BslCodeModel {
        const codeModel = new BslCodeModel()
        this.rebuildModel(codeModel, model)
        return codeModel
    }

    rebuildModel(codeModel: BslCodeModel, model: ModuleModel | string): void {
        const text = typeof model === 'string' ? model : model.getValue()
        this.sourceText = text
        codeModel.children.length = 0

        if (!this.runtime) {
            this.diagnostics = [unsupported('Tree-sitter runtime is not configured')]
            codeModel.afterUpdate(codeModel)
            return
        }

        const parseResult = this.runtime.parse(text)
        const rootNode = isParseResult(parseResult) ? parseResult.rootNode : parseResult
        if (!rootNode) {
            this.diagnostics = [unsupported('Tree-sitter runtime did not return a root node')]
            codeModel.afterUpdate(codeModel)
            return
        }

        const builder = new TreeSitterBslModelBuilder(this.sourceText)
        const children = builder.buildTopLevelSymbols(rootNode)
        codeModel.children.push(...children)
        this.diagnostics = builder.collectDiagnostics(rootNode)
        codeModel.afterUpdate(codeModel)
    }

    updateModel(codeModel: BslCodeModel, model: ModuleModel, _changes: editor.IModelContentChange[]): boolean {
        this.rebuildModel(codeModel, model)
        return true
    }

    getDiagnostics(): ParserDiagnostic[] {
        return this.diagnostics
    }

    dispose(): void {}
}

function isParseResult(value: TreeSitterParseResult | TreeSitterNode): value is TreeSitterParseResult {
    return (value as TreeSitterParseResult).rootNode !== undefined
}

class TreeSitterBslModelBuilder {
    private adapterDiagnostics: ParserDiagnostic[] = []

    constructor(private readonly sourceText: string) {}

    buildTopLevelSymbols(rootNode: TreeSitterNode): BaseSymbol[] {
        return this.children(rootNode)
            .map(node => this.toTopLevelSymbol(node))
            .filter((symbol): symbol is BaseSymbol => symbol !== undefined)
    }

    collectDiagnostics(rootNode: TreeSitterNode): ParserDiagnostic[] {
        const diagnostics: ParserDiagnostic[] = []
        this.walk(rootNode, node => {
            if (node.type === 'ERROR' || node.type === 'MISSING') {
                diagnostics.push({
                    message: `Tree-sitter parse gap: ${node.type}`,
                    source: 'tree-sitter',
                    startOffset: this.startOffset(node),
                    endOffset: this.endOffset(node)
                })
            }
        })
        return [...diagnostics, ...this.adapterDiagnostics]
    }

    private toTopLevelSymbol(node: TreeSitterNode): BaseSymbol | undefined {
        switch (node.type) {
            case 'procedure_definition':
                return this.toProcedure(node)
            case 'function_definition':
                return this.toFunction(node)
            case 'var_definition':
                return this.toVariableDefinition(node)
            default:
                return this.toStatement(node)
        }
    }

    private toProcedure(node: TreeSitterNode): ProcedureDefinitionSymbol {
        const symbol = new ProcedureDefinitionSymbol(this.position(node), this.nodeText(this.field(node, 'name')) || 'UnknownProcedure')
        symbol.isExport = Boolean(this.field(node, 'export'))
        symbol.params = this.parameters(node)
        symbol.children = this.body(node)
        return symbol
    }

    private toFunction(node: TreeSitterNode): FunctionDefinitionSymbol {
        const symbol = new FunctionDefinitionSymbol(this.position(node), this.nodeText(this.field(node, 'name')) || 'UnknownFunction')
        symbol.isExport = Boolean(this.field(node, 'export'))
        symbol.params = this.parameters(node)
        symbol.children = this.body(node)
        return symbol
    }

    private parameters(node: TreeSitterNode): ParameterDefinitionSymbol[] {
        const parametersNode = this.field(node, 'parameters')
        if (!parametersNode) {
            return []
        }
        return this.descendants(parametersNode)
            .filter(child => child.type === 'parameter')
            .map(paramNode => {
                const symbol = new ParameterDefinitionSymbol(this.position(paramNode), this.nodeText(this.field(paramNode, 'name')))
                symbol.byVal = Boolean(this.field(paramNode, 'val'))
                return symbol
            })
    }

    private body(node: TreeSitterNode): BaseSymbol[] {
        return this.children(node)
            .filter(child => child !== this.field(node, 'parameters'))
            .filter(child => !['identifier', 'parameters'].includes(child.type))
            .map(child => this.toStatement(child))
            .filter((symbol): symbol is BaseSymbol => symbol !== undefined)
    }

    private toVariableDefinition(node: TreeSitterNode): VariableDefinitionSymbol {
        const symbol = new VariableDefinitionSymbol(this.position(node))
        symbol.vars = this.descendants(node)
            .filter(child => child.type === 'variable_spec')
            .map(spec => new VariableSymbol(this.position(spec), this.nodeText(this.field(spec, 'name')) || this.nodeText(spec)))
        return symbol
    }

    private toStatement(node: TreeSitterNode): BaseSymbol | undefined {
        switch (node.type) {
            case 'call_statement':
                return this.children(node)
                    .map(child => this.toExpression(child))
                    .find((symbol): symbol is BaseExpressionSymbol => symbol !== undefined)
            case 'assignment_statement':
                return this.toAssignment(node)
            case 'var_statement':
                return this.toVarStatement(node)
            case 'procedure_definition':
            case 'function_definition':
            case 'var_definition':
                return this.toTopLevelSymbol(node)
            default:
                this.reportUnsupportedNode(node)
                return undefined
        }
    }

    private toAssignment(node: TreeSitterNode): AssignmentStatementSymbol {
        const symbol = new AssignmentStatementSymbol(this.position(node))
        const left = this.field(node, 'left')
        const right = this.field(node, 'right')
        const leftExpression = left ? this.toExpression(left) : undefined
        if (leftExpression instanceof VariableSymbol || leftExpression instanceof AccessSequenceSymbol) {
            symbol.variable = leftExpression
        }
        symbol.expression = right ? this.toExpression(right) : undefined
        return symbol
    }

    private toVarStatement(node: TreeSitterNode): VariableDefinitionSymbol {
        const symbol = new VariableDefinitionSymbol(this.position(node))
        symbol.vars = this.children(node)
            .filter(child => child.type === 'identifier')
            .map(identifier => new VariableSymbol(this.position(identifier), this.nodeText(identifier)))
        return symbol
    }

    private toExpression(node: TreeSitterNode): BaseExpressionSymbol | undefined {
        switch (node.type) {
            case 'identifier':
                return new VariableSymbol(this.position(node), this.nodeText(node))
            case 'property':
                return new PropertySymbol(this.position(node), this.nodeText(node))
            case 'method_call':
                return this.toMethodCall(node)
            case 'call_expression':
            case 'property_access':
            case 'access':
                return this.toAccessSequence(node)
            case 'new_expression':
            case 'new_expression_method':
                return this.toConstructor(node)
            case 'arguments':
                return undefined
            default:
                return this.children(node)
                    .map(child => this.toExpression(child))
                    .find((symbol): symbol is BaseExpressionSymbol => symbol !== undefined)
        }
    }

    private toMethodCall(node: TreeSitterNode): MethodCallSymbol {
        const symbol = new MethodCallSymbol(this.position(node), this.nodeText(this.field(node, 'name')))
        symbol.arguments = this.argumentExpressions(node)
        return symbol
    }

    private toConstructor(node: TreeSitterNode): ConstructorSymbol {
        const symbol = new ConstructorSymbol(this.position(node), this.nodeText(this.field(node, 'type')))
        symbol.arguments = this.argumentExpressions(node)
        return symbol
    }

    private toAccessSequence(node: TreeSitterNode): AccessSequenceSymbol {
        const symbol = new AccessSequenceSymbol(this.position(node))
        symbol.access = this.accessParts(node)
        return symbol
    }

    private accessParts(node: TreeSitterNode): (VariableSymbol | PropertySymbol | MethodCallSymbol)[] {
        switch (node.type) {
            case 'identifier':
                return [new VariableSymbol(this.position(node), this.nodeText(node))]
            case 'property':
                return [new PropertySymbol(this.position(node), this.nodeText(node))]
            case 'method_call':
                return [this.toMethodCall(node)]
            default:
                return this.children(node).flatMap(child => this.accessParts(child))
        }
    }

    private argumentExpressions(node: TreeSitterNode): BaseExpressionSymbol[] {
        const argumentsNode = this.field(node, 'arguments') ?? this.children(node).find(child => child.type === 'arguments')
        if (!argumentsNode) {
            return []
        }
        return this.children(argumentsNode)
            .map(child => this.toExpression(child))
            .filter((symbol): symbol is BaseExpressionSymbol => symbol !== undefined)
    }

    private field(node: TreeSitterNode, name: string): TreeSitterNode | undefined {
        return node.childForFieldName?.(name) ?? undefined
    }

    private children(node: TreeSitterNode): TreeSitterNode[] {
        if (node.namedChildren) {
            return node.namedChildren
        }
        if (node.children) {
            return node.children
        }
        const count = node.namedChildCount ?? node.childCount ?? 0
        const childGetter = node.namedChild?.bind(node) ?? node.child?.bind(node)
        if (!childGetter) {
            return []
        }

        const children: TreeSitterNode[] = []
        for (let index = 0; index < count; index++) {
            const child = childGetter(index)
            if (child) {
                children.push(child)
            }
        }
        return children
    }

    private descendants(node: TreeSitterNode): TreeSitterNode[] {
        return this.children(node).flatMap(child => [child, ...this.descendants(child)])
    }

    private walk(node: TreeSitterNode, callback: (node: TreeSitterNode) => void): void {
        callback(node)
        this.children(node).forEach(child => this.walk(child, callback))
    }

    private reportUnsupportedNode(node: TreeSitterNode): void {
        if (!UNSUPPORTED_SEMANTIC_NODE_TYPES.has(node.type)) {
            return
        }

        this.adapterDiagnostics.push({
            message: `Unsupported Tree-sitter BSL semantic node: ${node.type}`,
            source: 'tree-sitter',
            startOffset: this.startOffset(node),
            endOffset: this.endOffset(node)
        })
    }

    private position(node: TreeSitterNode): SymbolPosition {
        return {
            startOffset: this.startOffset(node),
            endOffset: this.endOffset(node)
        }
    }

    private startOffset(node: TreeSitterNode): number {
        return node.startIndex ?? node.from ?? 0
    }

    private endOffset(node: TreeSitterNode): number {
        return node.endIndex ?? node.to ?? this.startOffset(node)
    }

    private nodeText(node: TreeSitterNode | undefined): string {
        if (!node) {
            return ''
        }
        return node.text ?? this.sourceText.slice(this.startOffset(node), this.endOffset(node))
    }
}

export function createTreeSitterParserAdapter(runtime?: TreeSitterBslRuntime): TreeSitterParserAdapter {
    return new TreeSitterParserAdapter(runtime)
}

function unsupported(message: string): ParserDiagnostic {
    return {
        message,
        source: 'tree-sitter'
    }
}

const UNSUPPORTED_SEMANTIC_NODE_TYPES = new Set([
    'execute_statement',
    'return_statement',
    'try_statement',
    'rise_error_statement',
    'if_statement',
    'while_statement',
    'for_statement',
    'for_each_statement',
    'continue_statement',
    'break_statement',
    'goto_statement',
    'label_statement',
    'add_handler_statement',
    'remove_handler_statement',
    'preprocessor',
    'await_statement'
])
