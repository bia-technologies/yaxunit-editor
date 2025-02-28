import { Node } from "web-tree-sitter";
import { BslTokenTypes } from "../tree-sitter";
import { FunctionDefinition, MethodDefinition, ParameterDefinition, ProcedureDefinition } from "./definitions";
import { NamedSymbol } from "@/common/codeModel/base";

export function createSymbol(node: Node): NamedSymbol | undefined {
    const constructor = constructors[node.type]
    if (constructor) {
        return constructor(node)
    } else {
        return undefined
    }
}

const constructors: { [key: string]: (node: Node) => NamedSymbol } = {
    [BslTokenTypes.function_definition]: createFunction,
    [BslTokenTypes.procedure_definition]: createProcedure,
    [BslTokenTypes.parameter]: createParameter,
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

function fillMethodDefinition(method: MethodDefinition, node: Node): void {
    method.isExport = node.childForFieldName('export') !== null
    const parameters = node.childForFieldName('parameters')
    if (parameters) {
        parameters.namedChildren
            .map(n => n ? createParameter(n) : undefined)
            .forEach(p => { if (p) method.params.push(p) })
    }
}

function createParameter(node: Node) {
    const symbol = new ParameterDefinition(node, node.childForFieldName('name')?.text)
    symbol.byVal = node.childForFieldName('val') !== null
    symbol.default = node.childForFieldName('def')?.text

    return symbol
}
