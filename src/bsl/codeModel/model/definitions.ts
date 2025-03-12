import {
    BaseSymbol,
    NamedSymbol,
    Method,
    ModuleVariable,
    Parameter,
    SymbolPosition,
    CompositeSymbol,
    CodeSymbol,
    descendantByOffset
} from "@/common/codeModel";
import { Signature } from "@/common/scope";
import { VariablesScope } from "../interfaces";
import { VariableSymbol } from "./baseSymbols";
import { Acceptable, CodeModelVisitor } from "../visitor";
import { ConstSymbol } from "./expressions";

export abstract class MethodDefinition extends BaseSymbol implements Signature, VariablesScope, NamedSymbol, CompositeSymbol {
    name: string
    isExport: boolean = false
    params: ParameterDefinitionSymbol[] = []
    vars?: VariableSymbol[]
    children: BaseSymbol[] = []

    constructor(position: SymbolPosition, name?: string) {
        super(position)
        this.name = name ?? ''
    }

    descendantByOffset(offset: number): CodeSymbol | undefined {
        return descendantByOffset(offset, ...this.params, ...this.children)
    }
}

export class ParameterDefinitionSymbol extends BaseSymbol implements Parameter, Acceptable, NamedSymbol {
    name: string
    byVal: boolean = false
    type: string = ''
    defaultValue?: ConstSymbol

    get default() {
        return this.defaultValue?.value
    }

    constructor(position: SymbolPosition, name?: string) {
        super(position)
        this.name = name ?? ''
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitParameterDefinition(this)
    }
}

export class ProcedureDefinitionSymbol extends MethodDefinition implements Method, Acceptable {
    get isProc() { return true }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitProcedureDefinition(this)
    }
}

export class FunctionDefinitionSymbol extends MethodDefinition implements Method, Acceptable {
    get isProc() { return false }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitFunctionDefinition(this)
    }
}

export class ModuleVariableDefinitionSymbol extends VariableSymbol implements ModuleVariable, Acceptable {
    isExport: boolean = false

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitModuleVariableDefinition(this)
    }
}