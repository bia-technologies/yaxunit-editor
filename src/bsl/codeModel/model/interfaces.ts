import { Member } from "@/common/scope";
import { BslVariable } from "./members";

export interface VariablesScope {
    vars: BslVariable[]
}

export function isVariablesScope(symbol: any): symbol is VariablesScope {
    return (symbol as VariablesScope).vars !== undefined
}

export interface MemberRef {
    member?: Member
}

export function isMemberRef(symbol: any): symbol is MemberRef {
    return (symbol as MemberRef).member !== undefined
}