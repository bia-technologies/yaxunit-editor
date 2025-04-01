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

/**
 * Determines whether the provided symbol is a method definition.
 *
 * This function checks if the symbol is an instance of either {@link ProcedureDefinitionSymbol} or
 * {@link FunctionDefinitionSymbol}, and serves as a type guard to confirm the symbol as a method definition.
 *
 * @param symbol - The symbol to test.
 * @returns True if the symbol is a method definition; otherwise, false.
 */
export function isMethodDefinition(symbol: any): symbol is ProcedureDefinitionSymbol | FunctionDefinitionSymbol {
    return symbol instanceof ProcedureDefinitionSymbol || symbol instanceof FunctionDefinitionSymbol
}

export abstract class MethodDefinition extends BaseSymbol implements Signature, VariablesScope, NamedSymbol, CompositeSymbol {
    name: string
    isExport: boolean = false
    params: ParameterDefinitionSymbol[] = []
    vars: BslVariable[] = []
    children: BaseSymbol[] = []
    member?: Member
    description?: string

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

    constructor(position: SymbolPosition, name: string) {
        super(position, name)
        this.description = `Локальная процедура \`${this.name}\``
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitProcedureDefinition(this)
    }
}

export class FunctionDefinitionSymbol extends MethodDefinition implements Method, Acceptable, Member {
    get isProc() { return false }
    get kind() { return MemberType.function }

    constructor(position: SymbolPosition, name: string) {
        super(position, name)
        this.description = `Локальная функция \`${this.name}\``
    }

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

export class VariableDefinitionSymbol extends BaseSymbol implements Acceptable, CompositeSymbol {
    vars: VariableSymbol[] = []

    getChildrenSymbols(): BaseSymbol[] {
        return this.vars
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitVariableDefinition(this)
    }
}