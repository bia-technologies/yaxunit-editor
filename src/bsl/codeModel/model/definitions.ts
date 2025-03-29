import {
    BaseSymbol,
    NamedSymbol,
    Method,
    ModuleVariable,
    Parameter,
    SymbolPosition,
    CompositeSymbol
} from "@/common/codeModel";
import { Member, MemberType, Signature } from "@/common/scope";
import { VariablesScope } from "./interfaces";
import { VariableSymbol } from "./baseSymbols";
import { Acceptable, CodeModelVisitor } from "../visitor";
import { ConstSymbol } from "./expressions";
import { BslVariable } from "./members";

export function isMethodDefinition(symbol: any) {
    return symbol instanceof ProcedureDefinitionSymbol || symbol instanceof FunctionDefinitionSymbol
}

export abstract class MethodDefinition extends BaseSymbol implements Signature, VariablesScope, NamedSymbol, CompositeSymbol {
    name: string
    isExport: boolean = false
    params: ParameterDefinitionSymbol[] = []
    vars: BslVariable[] = []
    children: BaseSymbol[] = []
    description?: string
    member?: Member

    constructor(position: SymbolPosition, name?: string) {
        super(position)
        this.name = name ?? ''
    }

    getChildrenSymbols() {
        return [...this.params, ...this.children]
    }
}

export class ParameterDefinitionSymbol extends BaseSymbol implements Parameter, Acceptable, NamedSymbol {
    name: string
    byVal: boolean = false
    type: string = ''
    defaultValue?: ConstSymbol
    member?: Member

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

export class ProcedureDefinitionSymbol extends MethodDefinition implements Method, Acceptable, Member {
    get isProc() { return true }
    get kind() { return MemberType.procedure }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitProcedureDefinition(this)
    }
}

export class FunctionDefinitionSymbol extends MethodDefinition implements Method, Acceptable {
    get isProc() { return false }
    get kind() { return MemberType.function }

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

export class VariableDefinitionSymbol extends BaseSymbol implements Acceptable {
    vars: VariableSymbol[] = []

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitVariableDefinition(this)
    }
}