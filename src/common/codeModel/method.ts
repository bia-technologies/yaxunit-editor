import { Signature, Parameter as ParameterMember } from "../scope"
import { Symbol, SymbolRange, Variable } from "./"

export interface Method extends SymbolRange, Signature {
    isExport: boolean
    isProc: boolean
    params: Parameter[]
    vars?: Variable[]
}

export interface Parameter extends Symbol, ParameterMember {
    default?: string
    byVal: boolean
}