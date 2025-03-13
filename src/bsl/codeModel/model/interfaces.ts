import { BslVariable } from "./variables";

export interface VariablesScope {
    vars: BslVariable[]
}

export function isVariablesScope(symbol: any): symbol is VariablesScope {
    return (symbol as VariablesScope).vars !== undefined
}