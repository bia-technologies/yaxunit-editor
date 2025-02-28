import { Method, Parameter, Variable } from "@/common/codeModel";
import { NamedSymbol } from "@/common/codeModel/base";
import { Signature } from "@/common/scope";

export abstract class MethodDefinition extends NamedSymbol implements Signature {
    isExport: boolean = false
    params: ParameterDefinition[] = []
    vars?: Variable[]
}

export class ParameterDefinition extends NamedSymbol implements Parameter {
    byVal: boolean = false
    type: string = ''
    default?: string
}

export class ProcedureDefinition extends MethodDefinition implements Method {
    get isProc() { return true }
}

export class FunctionDefinition extends MethodDefinition implements Method {
    get isProc() { return false }
}