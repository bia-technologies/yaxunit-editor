import { BaseScope, Member, MemberType } from "@/common/scope"
import { Method, Variable } from "../Symbols"
import { BslParser } from "@/bsl/tree-sitter"

export class MethodScope extends BaseScope {

}
export function createMethodScope(method: Method, parser: BslParser) {

    const members: Member[] = []

    if (!method.vars) {
        method.vars = []
        const iter = parser.getMethodVars(method)
        let variable: IteratorResult<Variable>
        while (!(variable = iter.next()).done) {
            method.vars.push(variable.value)
        }
    }
    
    method.vars.forEach(v => members.push({
        name: v.name,
        kind: MemberType.variable,
        type: v.type
    }))
    method.params.forEach(v => members.push({
        name: v.name,
        kind: MemberType.variable,
    }))

    return new MethodScope(members)
}