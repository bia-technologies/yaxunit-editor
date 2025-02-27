import { Symbol, SymbolRange, Variable } from "./"

export interface Method extends SymbolRange {
    isExport: boolean
    isProc: boolean
    params: Parameter[]
    vars?: Variable[]
}

export interface Parameter extends Symbol {
    default?: string
    byVal: boolean
}