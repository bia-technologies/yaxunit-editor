import { Node } from "web-tree-sitter";
import { BslTokenTypes } from "../tree-sitter";
import { FunctionDefinition, MethodDefinition, ModuleVariableDefinition, ParameterDefinition, ProcedureDefinition } from "./definitions";
import { BaseSymbol } from "@/common/codeModel/base";
import { AssignmentStatement } from "./statements";
import { Access, IndexAccess, MethodCall, Property, PropertyAccess, Variable } from "./baseSymbols";

export function createSymbol(node: Node): BaseSymbol | BaseSymbol[] | undefined {
    const constructor = constructors[node.type]
    if (constructor) {
        return constructor(node)
    } else {
        return undefined
    }
}

const constructors: { [key: string]: (node: Node) => BaseSymbol | BaseSymbol[] } = {
    [BslTokenTypes.function_definition]: createFunction,
    [BslTokenTypes.procedure_definition]: createProcedure,
    [BslTokenTypes.parameter]: createParameter,
    [BslTokenTypes.var_definition]: createModuleVariable,
    [BslTokenTypes.assignment_statement]: createAssignmentStatement,
    [BslTokenTypes.property_access]: createPropertyAccess,
}

function createFunction(node: Node) {
    const method = new FunctionDefinition(node, node.childForFieldName('name')?.text)
    fillMethodDefinition(method, node)
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
    symbol.default = node.childForFieldName('def')?.text

    return symbol
}

function createAssignmentStatement(node: Node) {
    const symbol = new AssignmentStatement(node)
    const left = node.childForFieldName('left')
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

    return symbol
}

function createPropertyAccess(node: Node) {
    const symbol = new PropertyAccess(node)
    if (node.firstNamedChild) {
        symbol.access = collectAccessTokens(node)
    }
    return symbol
}

function createMethodCall(node: Node) {
    const symbol = new MethodCall(node, node.childForFieldName('name')?.text)

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

function fillMethodDefinition(method: MethodDefinition, node: Node): void {
    method.isExport = node.childForFieldName('export') !== null
    const parameters = node.childForFieldName('parameters')
    if (parameters) {
        parameters.namedChildren
            .map(n => n ? createParameter(n) : undefined)
            .forEach(p => { if (p) method.params.push(p) })
    }
}

