import { Method, ModuleVariable, Parameter, Variable } from "@/common/codeModel";
import { BaseSymbol, NamedSymbol } from "@/common/codeModel/base";
import { Signature } from "@/common/scope";
import { ConstExpression } from "./expressions";

export abstract class MethodDefinition extends NamedSymbol implements Signature {
    isExport: boolean = false
    params: ParameterDefinition[] = []
    vars?: Variable[]
    children: BaseSymbol[] = []
}

export class ParameterDefinition extends NamedSymbol implements Parameter {
    byVal: boolean = false
    type: string = ''
    defaultValue?: ConstExpression
    get default() {
        return this.defaultValue?.value
    }
}

export class ProcedureDefinition extends MethodDefinition implements Method {
    get isProc() { return true }
}

export class FunctionDefinition extends MethodDefinition implements Method {
    get isProc() { return false }
}

export class ModuleVariableDefinition extends NamedSymbol implements ModuleVariable {
    isExport: boolean = false
}