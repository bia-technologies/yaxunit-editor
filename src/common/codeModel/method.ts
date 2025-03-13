import { Signature, Parameter as ParameterMember } from "../scope"
import { CodeSymbol, NamedSymbol, Variable } from "./"

export interface Method extends NamedSymbol, Signature {
    isExport: boolean
    isProc: boolean
    params: Parameter[]
    vars?: Variable[]
}

export interface Parameter extends CodeSymbol, ParameterMember {
    default?: string
    byVal: boolean
}