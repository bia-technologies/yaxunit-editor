import { Node } from "web-tree-sitter";
import { BslParser, BslTokenTypes } from ".";
import { BaseSymbol } from "@/common/codeModel";
import {
    Access,
    AssignmentStatementSymbol,
    BinaryExpressionSymbol,
    BslCodeModel,
    ConstSymbol,
    ConstructorSymbol,
    FunctionDefinitionSymbol,
    IndexAccessSymbol,
    MethodCallSymbol,
    MethodDefinition,
    ModuleVariableDefinitionSymbol,
    ParameterDefinitionSymbol,
    ProcedureDefinitionSymbol,
    AccessSequenceSymbol,
    PropertySymbol,
    ReturnStatementSymbol,
    TernaryExpressionSymbol,
    VariableSymbol,
    UnaryExpressionSymbol,
    ExpressionSymbol
} from "../codeModel";
import { BaseTypes } from "../scope/baseTypes";

export const TreeSitterCodeModelFactory = {
    buildModel(parser: BslParser) {
        const start = performance.now()
        const model = new BslCodeModel()
        const root = parser.getRootNode()
        fillChildren(root.children, model.children)
        console.debug('Build code model', performance.now() - start, 'ms')
        return model
    },
}

export function createSymbol(node: Node): BaseSymbol | BaseSymbol[] | undefined {
    const constructor = constructors[node.type]
    if (constructor) {
        return constructor(node)
    } else {
        return undefined
    }
}

export function createExpressionSymbol(node: Node | null): ExpressionSymbol | undefined {
    if (!node) {
        return undefined
    }
    const constructor = expressionConstructors[node.type]
    if (constructor) {
        return constructor(node)
    } else {
        return undefined
    }
}

export function fillChildren(nodeChildren: (Node | null)[], symbolChildren: BaseSymbol[]): void {
    for (const node of nodeChildren) {
        if (!node) {
            continue
        }
        const symbol = createSymbol(node)
        if (Array.isArray(symbol)) {
            symbolChildren.push(...symbol)
        } else if (symbol) {
            symbolChildren.push(symbol)
        }
    }
}

type CreatorType = (node: Node) => BaseSymbol | BaseSymbol[] | undefined
type ConstructorsType = { [key: string]: CreatorType }

const expressionConstructors: { [key: string]: (node: Node) => ExpressionSymbol | undefined } = {
    [BslTokenTypes.const_expression]: createConstExpression,
    [BslTokenTypes.identifier]: n => new VariableSymbol(n, n.text),
    [BslTokenTypes.unary_expression]: createUnaryExpression,
    [BslTokenTypes.binary_expression]: createBinaryExpression,
    [BslTokenTypes.ternary_expression]: createTernaryExpressionSymbol,
    [BslTokenTypes.new_expression]: createConstructor,
    [BslTokenTypes.new_expression_method]: createConstructorMethod,
    [BslTokenTypes.method_call]: createMethodCall,
    [BslTokenTypes.call_expression]: createAccessSequence,
    [BslTokenTypes.property_access]: createAccessSequence,
    [BslTokenTypes.expression]: n => createExpressionSymbol(n.firstNamedChild),
    [BslTokenTypes.await_expression]: () => { throw 'not implemented' },
}

const definitionConstructors: ConstructorsType = {
    [BslTokenTypes.function_definition]: createFunction,
    [BslTokenTypes.procedure_definition]: createProcedure,
    [BslTokenTypes.var_definition]: createModuleVariable,
}

const statementConstructors: ConstructorsType = {
    [BslTokenTypes.execute_statement]: () => { throw 'not implemented' },
    [BslTokenTypes.call_statement]: n => n.firstNamedChild ? createMethodCall(n.firstNamedChild) : undefined,
    [BslTokenTypes.assignment_statement]: createAssignmentStatement,
    [BslTokenTypes.return_statement]: createReturnStatement,
    [BslTokenTypes.try_statement]: () => { throw 'not implemented' },
    [BslTokenTypes.rise_error_statement]: () => { throw 'not implemented' },
    [BslTokenTypes.var_statement]: () => { throw 'not implemented' },
    [BslTokenTypes.if_statement]: () => { throw 'not implemented' },
    [BslTokenTypes.while_statement]: () => { throw 'not implemented' },
    [BslTokenTypes.for_statement]: () => { throw 'not implemented' },
    [BslTokenTypes.for_each_statement]: () => { throw 'not implemented' },
    [BslTokenTypes.continue_statement]: () => { throw 'not implemented' },
    [BslTokenTypes.break_statement]: () => { throw 'not implemented' },
    [BslTokenTypes.goto_statement]: () => { throw 'not implemented' },
    [BslTokenTypes.label_statement]: () => { throw 'not implemented' },
    [BslTokenTypes.add_handler_statement]: () => { throw 'not implemented' },
    [BslTokenTypes.remove_handler_statement]: () => { throw 'not implemented' },
    [BslTokenTypes.preprocessor]: () => { throw 'not implemented' },
    [BslTokenTypes.await_statement]: () => { throw 'not implemented' },
    [BslTokenTypes.property_access]: createAccessSequence,
}

const constructors: ConstructorsType = {
    ...statementConstructors,
    ...definitionConstructors
}

function createFunction(node: Node) {
    const method = new FunctionDefinitionSymbol(node, node.childForFieldName('name')?.text)
    fillMethodDefinition(method, node)
    fillChildren(node.namedChildren, method.children)
    return method
}

function createProcedure(node: Node) {
    const method = new ProcedureDefinitionSymbol(node, node.childForFieldName('name')?.text)
    fillMethodDefinition(method, node)
    fillChildren(node.namedChildren, method.children)
    return method
}

function createModuleVariable(node: Node) {
    const symbols: ModuleVariableDefinitionSymbol[] = []

    let child = node.firstNamedChild
    while (child !== null) {
        if (child.type === BslTokenTypes.identifier) {
            symbols.push(new ModuleVariableDefinitionSymbol(node, child.text))
        }
        child = child.nextNamedSibling
    }
    if (node.childForFieldName('export') !== null) {
        symbols.forEach(s => s.isExport = true)
    }
    return symbols
}

function createParameter(node: Node) {
    const symbol = new ParameterDefinitionSymbol(node, node.childForFieldName('name')?.text)
    symbol.byVal = node.childForFieldName('val') !== null
    const defNode = node.childForFieldName('def')
    if (defNode) {
        symbol.defaultValue = createConstExpression(defNode)
    }

    return symbol
}

function createAssignmentStatement(node: Node) {
    const symbol = new AssignmentStatementSymbol(node)
    const left = node.childForFieldName('left')
    if (!left) {
        throw 'Не указана переменная для присвоения'
    }
    switch (left.type) {
        case BslTokenTypes.identifier:
            symbol.variable = createVariable(left)
            break
        case BslTokenTypes.property_access:
            symbol.variable = createAccessSequence(left)
            break
    }

    symbol.expression = createExpressionSymbol(node.childForFieldName('right'))

    return symbol
}

function createVariable(node: Node) {
    const symbol = new VariableSymbol(node, node.text)
    return symbol
}

function createAccessSequence(node: Node) {
    const symbol = new AccessSequenceSymbol(node)
    if (node.firstNamedChild) {
        symbol.access = collectAccessTokens(node)
    }
    return symbol
}

function createReturnStatement(node: Node) {
    const symbol = new ReturnStatementSymbol(node)
    symbol.expression = createExpressionSymbol(node.childForFieldName('result'))

    return symbol
}

function createMethodCall(node: Node) {
    const symbol = new MethodCallSymbol(node, node.childForFieldName('name')?.text)
    symbol.arguments = collectArguments(node.childForFieldName('arguments'))

    return symbol
}

function createIndexAccess(node: Node) {
    const symbol = new IndexAccessSymbol(node, node.firstNamedChild?.text)
    return symbol
}

function collectAccessTokens(accessNode: Node) {
    const path: Access = []
    let node: Node | null = accessNode.type !== BslTokenTypes.identifier ? accessNode.firstChild : accessNode;
    let lastNode: Node | undefined = undefined
    while (node) {
        lastNode = node
        if (node.type === BslTokenTypes.access) {
            path.push(...collectAccessTokens(node))
        } else {
            const symbol = createAccessSymbol(node)
            if (symbol) {
                path.push(symbol)
            }
        }
        node = node.nextSibling
    }
    return path
}

function createAccessSymbol(node: Node) {
    switch (node.type) {
        case BslTokenTypes.method_call:
            return createMethodCall(node)
        case BslTokenTypes.identifier:
        case BslTokenTypes.property:
            return new PropertySymbol(node)
        case BslTokenTypes.index:
            return createIndexAccess(node)
    }
}

function createBinaryExpression(node: Node) {
    const symbol = new BinaryExpressionSymbol(node)

    symbol.left = createExpressionSymbol(node.childForFieldName('left'))
    symbol.right = createExpressionSymbol(node.childForFieldName('right'))

    symbol.operator = node.childForFieldName('operator')?.text

    return symbol
}

function createUnaryExpression(node: Node) {
    const symbol = new UnaryExpressionSymbol(node)

    symbol.operand = createExpressionSymbol(node.childForFieldName('argument'))
    symbol.operator = node.childForFieldName('operator')?.text

    return symbol

}

function createTernaryExpressionSymbol(node: Node) {
    const symbol = new TernaryExpressionSymbol(node)

    symbol.condition = createExpressionSymbol(node.childForFieldName('condition'))
    symbol.consequence = createExpressionSymbol(node.childForFieldName('consequence'))
    symbol.alternative = createExpressionSymbol(node.childForFieldName('alternative'))

    return symbol
}

function createConstExpression(node: Node) {
    if (node.type === BslTokenTypes.const_expression) {
        node = node.firstNamedChild ?? node
    }
    let value: string
    if (node.type === BslTokenTypes.string) {
        value = node.namedChildren.map(n => n?.text).join('\n')
    } else {
        value = node.text
    }
    const type = getConstValueType(node)

    return new ConstSymbol(node, value, type)
}

function createConstructor(node: Node) {
    const symbol = new ConstructorSymbol(node)
    symbol.name = node.childForFieldName('type')?.text
    symbol.arguments = collectArguments(node.childForFieldName('arguments'))

    return symbol
}

function createConstructorMethod(node: Node) {
    const symbol = new ConstructorSymbol(node)
    symbol.name = createExpressionSymbol(node.childForFieldName('type'))
    symbol.arguments = createExpressionSymbol(node.childForFieldName('arguments'))

    if (symbol.name instanceof ConstSymbol && symbol.name.type === BaseTypes.string) {
        symbol.name = symbol.name.value
    }

    return symbol
}

function fillMethodDefinition(method: MethodDefinition, node: Node): void {
    method.isExport = node.childForFieldName('export') !== null
    const parameters = node.childForFieldName('parameters')
    if (parameters) {
        parameters.namedChildren
            .map(n => n ? createParameter(n) : undefined)
            .forEach(p => { if (p) method.params.push(p) })
    }
}

function constValues() {
    const res: { [key: string]: string } = {}
    res[BslTokenTypes.number] = BaseTypes.number
    res[BslTokenTypes.date] = BaseTypes.date
    res[BslTokenTypes.string] = BaseTypes.string
    res[BslTokenTypes.boolean] = BaseTypes.boolean
    res[BslTokenTypes.undefined_keyword] = BaseTypes.undefined
    res[BslTokenTypes.null_keyword] = BaseTypes.null

    return res
}

export function getConstValueType(node: Node | null): string {
    if (node) {
        return constValues()[node.type] ?? BaseTypes.unknown
    }
    return BaseTypes.unknown
}

function collectArguments(node: Node | null) {
    if (!node) {
        return undefined
    }
    return node.namedChildren
        .map(createExpressionSymbol)
        .map(n => n as BaseSymbol)
}
