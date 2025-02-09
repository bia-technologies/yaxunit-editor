import { BaseScope, Symbol, SymbolType } from "@/scope"
import { Method } from "../Symbols"

export class MethodScope extends BaseScope {

}
export function createMethodScope(method: Method) {
    const members: Symbol[] = []
    method.autoVars.forEach(v => members.push({
        name: v.name,
        kind: SymbolType.property,
    }))
    method.vars.forEach(v => members.push({
        name: v.name,
        kind: SymbolType.property,
    }))
    method.params.forEach(v => members.push({
        name: v.name,
        kind: SymbolType.property,
    }))

    return new MethodScope(members)
}