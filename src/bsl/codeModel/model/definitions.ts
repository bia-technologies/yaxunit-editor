import { BaseSymbol, NamedSymbol, Method, ModuleVariable, Parameter } from "@/common/codeModel";
import { Signature } from "@/common/scope";
import { VariablesScope } from "../interfaces";
import { VariableSymbol } from "./baseSymbols";
import { Acceptable, CodeModelVisitor } from "../visitor";
import { ConstSymbol } from "./expressions";

export abstract class MethodDefinition extends NamedSymbol implements Signature, VariablesScope {
    isExport: boolean = false
    params: ParameterDefinitionSymbol[] = []
    vars?: VariableSymbol[]
    children: BaseSymbol[] = []
}

export class ParameterDefinitionSymbol extends NamedSymbol implements Parameter, Acceptable {
    byVal: boolean = false
    type: string = ''
    defaultValue?: ConstSymbol
    get default() {
        return this.defaultValue?.value
    }
    accept(visitor: CodeModelVisitor): void {
        visitor.visitParameterDefinition(this)
    }
}

export class ProcedureDefinitionSymbol extends MethodDefinition implements Method, Acceptable {
    get isProc() { return true }
    accept(visitor: CodeModelVisitor): void {
        visitor.visitProcedureDefinition(this)
    }
}

export class FunctionDefinitionSymbol extends MethodDefinition implements Method, Acceptable {
    get isProc() { return false }
    accept(visitor: CodeModelVisitor): void {
        visitor.visitFunctionDefinition(this)
    }
}

export class ModuleVariableDefinitionSymbol extends VariableSymbol implements ModuleVariable, Acceptable {
    isExport: boolean = false
    accept(visitor: CodeModelVisitor): void {
        visitor.visitModuleVariableDefinition(this)
    }
}