import { Signature, Parameter as ParameterMember } from "../scope"
import { NamedSymbol, Symbol, Variable } from "./"

export interface Method extends NamedSymbol, Signature {
    isExport: boolean
    isProc: boolean
    params: Parameter[]
    vars?: Variable[]
}

export interface Parameter extends Symbol, ParameterMember {
    default?: string
    byVal: boolean
}