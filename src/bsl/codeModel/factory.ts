import { Node } from "web-tree-sitter";
import { BslTokenTypes } from "../tree-sitter";
import { FunctionDefinition, MethodDefinition, ModuleVariableDefinition, ParameterDefinition, ProcedureDefinition } from "./definitions";
import { BaseSymbol } from "@/common/codeModel/base";
import { AssignmentStatement, ReturnStatement } from "./statements";
import { Access, IndexAccess, MethodCall, Property, PropertyAccess, Variable } from "./baseSymbols";
import { BinaryExpression, ConstExpression, Constructor } from "./expressions";
import { BaseTypes } from "../scope/baseTypes";

export function createSymbol(node: Node): BaseSymbol | BaseSymbol[] | undefined {
    const constructor = constructors[node.type]
    if (constructor) {
        return constructor(node)
    } else {
        return undefined
    }
}

export function createExpressionSymbol(node: Node): BaseSymbol | undefined {
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

const expressionConstructors: { [key: string]: (node: Node) => BaseSymbol | undefined } = {
    [BslTokenTypes.const_expression]: createConstExpression,
    [BslTokenTypes.identifier]: n => new Variable(n, n.text),
    [BslTokenTypes.unary_expression]: () => { throw 'not implemented' },
    [BslTokenTypes.binary_expression]: createBinaryExpression,
    [BslTokenTypes.ternary_expression]: () => { throw 'not implemented' },
    [BslTokenTypes.new_expression]: createConstructor,
    [BslTokenTypes.new_expression_method]: createConstructorMethod,
    [BslTokenTypes.method_call]: createMethodCall,
    [BslTokenTypes.call_expression]: () => { throw 'not implemented' },
    [BslTokenTypes.property_access]: createPropertyAccess,
    [BslTokenTypes.expression]: n => n.firstNamedChild ? createExpressionSymbol(n.firstNamedChild) : undefined,
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
    [BslTokenTypes.property_access]: createPropertyAccess,
}

const constructors: ConstructorsType = {
    ...statementConstructors,
    ...definitionConstructors
}

function createFunction(node: Node) {
    const method = new FunctionDefinition(node, node.childForFieldName('name')?.text)
    fillMethodDefinition(method, node)
    fillChildren(node.namedChildren, method.children)
    return method
}

function createProcedure(node: Node) {
    const method = new ProcedureDefinition(node, node.childForFieldName('name')?.text)
    fillMethodDefinition(method, node)
    return method
}

function createModuleVariable(node: Node) {
    const symbols: ModuleVariableDefinition[] = []

    let child = node.firstNamedChild
    while (child !== null) {
        if (child.type === BslTokenTypes.identifier) {
            symbols.push(new ModuleVariableDefinition(node, child.text))
        }
        child = child.nextNamedSibling
    }
    if (node.childForFieldName('export') !== null) {
        symbols.forEach(s => s.isExport = true)
    }
    return symbols
}

function createParameter(node: Node) {
    const symbol = new ParameterDefinition(node, node.childForFieldName('name')?.text)
    symbol.byVal = node.childForFieldName('val') !== null
    const defNode = node.childForFieldName('def')
    if (defNode) {
        symbol.defaultValue = createConstExpression(defNode)
    }

    return symbol
}

function createAssignmentStatement(node: Node) {
    const symbol = new AssignmentStatement(node)
    const left = node.childForFieldName('left')
    const right = node.childForFieldName('right')
    if (!left) {
        throw 'Не указана переменная для присвоения'
    }
    switch (left.type) {
        case BslTokenTypes.identifier:
            symbol.variable = new Variable(left, left.text)
            break
        case BslTokenTypes.property_access:
            symbol.variable = createPropertyAccess(left)
            break
    }

    if (right) {
        symbol.expression = createExpressionSymbol(right)
    }
    return symbol
}

function createPropertyAccess(node: Node) {
    const symbol = new PropertyAccess(node)
    if (node.firstNamedChild) {
        symbol.access = collectAccessTokens(node)
    }
    return symbol
}

function createReturnStatement(node: Node) {
    const symbol = new ReturnStatement(node)
    const resultNode = node.childForFieldName('result')
    if (resultNode) {
        symbol.expression = createExpressionSymbol(resultNode)
    }
    return symbol
}

function createMethodCall(node: Node) {
    const symbol = new MethodCall(node, node.childForFieldName('name')?.text)
    symbol.arguments = collectArguments(node.childForFieldName('arguments'))

    return symbol
}

function createIndexAccess(node: Node) {
    const symbol = new IndexAccess(node, node.firstNamedChild?.text)
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
            return new Property(node)
        case BslTokenTypes.index:
            return createIndexAccess(node)
    }
}

function createBinaryExpression(node: Node) {
    const symbol = new BinaryExpression(node)
    const leftNode = node.childForFieldName('left')
    const rightNode = node.childForFieldName('right')

    if (leftNode) {
        symbol.left = createExpressionSymbol(leftNode) as BaseSymbol
    }

    if (rightNode) {
        symbol.right = createExpressionSymbol(rightNode) as BaseSymbol
    }
    symbol.operator = node.childForFieldName('operator')?.text

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

    return new ConstExpression(node, value, type)
}

function createConstructor(node: Node) {
    const symbol = new Constructor(node)
    symbol.name = node.childForFieldName('type')?.text
    symbol.arguments = collectArguments(node.childForFieldName('arguments'))

    return symbol
}

function createConstructorMethod(node: Node) {
    const symbol = new Constructor(node)
    const typeNode = node.childForFieldName('type')
    const argsNode = node.childForFieldName('arguments')

    if (typeNode) {
        symbol.name = createExpressionSymbol(typeNode)
        if (symbol.name instanceof ConstExpression && symbol.name.type === BaseTypes.string) {
            symbol.name = symbol.name.value
        }
    }
    if (argsNode) {
        symbol.arguments = createExpressionSymbol(argsNode)
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
        .map(n => n ? createExpressionSymbol(n) : undefined)
        .map(n => n as BaseSymbol)

}
