import { BaseSymbol, NamedSymbol, Method, ModuleVariable, Parameter } from "@/common/codeModel";
import { Signature } from "@/common/scope";
import { VariablesScope } from "../interfaces";
import { NamedExpressionSymbol, VariableSymbol } from "./baseSymbols";
import { Acceptable, CodeModelVisitor } from "../visitor";
import { ConstSymbol } from "./expressions";
import { Node } from "web-tree-sitter";

export abstract class MethodDefinition extends BaseSymbol implements Signature, VariablesScope, NamedSymbol {
    name: string
    isExport: boolean = false
    params: ParameterDefinitionSymbol[] = []
    vars?: VariableSymbol[]
    children: BaseSymbol[] = []

    constructor(node: Node, name?: string) {
        super(node)
        this.name = name ?? ''
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

    constructor(node: Node, name?: string) {
        super(node)
        this.name = name ?? ''
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