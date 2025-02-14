import { BaseScope, Symbol, SymbolType } from "@/scope"
import { Method } from "../Symbols"
import { BslParser } from "@/tree-sitter/bslAst"

export class MethodScope extends BaseScope {

}
export function createMethodScope(method: Method, parser: BslParser) {

    const members: Symbol[] = []

    if (!method.vars) {
        method.vars = []
        parser.getMethodVars(method).forEach(v => method.vars?.push(v))
    }
    method.vars.forEach(v => members.push({
        name: v.name,
        kind: SymbolType.property,
        type: v.type
    }))
    method.params.forEach(v => members.push({
        name: v.name,
        kind: SymbolType.property,
    }))

    return new MethodScope(members)
}