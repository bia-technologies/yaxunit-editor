import { AssignmentStatementSymbol, BslCodeModel, FunctionDefinitionSymbol, IndexAccessSymbol, MethodCallSymbol, ModuleVariableDefinitionSymbol, ParameterDefinitionSymbol, ProcedureDefinitionSymbol, PropertyAccessSymbol, PropertySymbol, ReturnStatementSymbol, VariableSymbol } from "@/bsl/codeModel";
import { BaseSymbol } from "@/common/codeModel";

export interface Acceptable {
    accept(visitor: CodeModelVisitor): void
}

function isAcceptable(symbol: any): symbol is Acceptable {
    return (<Acceptable>symbol).accept !== undefined
}

export interface CodeModelVisitor {
    visitModel(model: BslCodeModel): void
    visitVariableSymbol(symbol: VariableSymbol): void
    visitPropertySymbol(symbol: PropertySymbol): void
    visitIndexAccessSymbol(symbol: IndexAccessSymbol): void
    visitMethodCallSymbol(symbol: MethodCallSymbol): void
    visitPropertyAccessSymbol(symbol: PropertyAccessSymbol): void


    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol): void
    visitFunctionDefinition(symbol: FunctionDefinitionSymbol): void
    visitParameterDefinition(symbol: ParameterDefinitionSymbol): void
    visitModuleVariableDefinition(symbol: ModuleVariableDefinitionSymbol): void

    visitAssignmentStatement(symbol: AssignmentStatementSymbol): void
    visitReturnStatement(symbol: ReturnStatementSymbol): void
}

export class BaseCodeModelVisitor implements CodeModelVisitor {

    protected acceptItems(items: BaseSymbol[]) {
        items.filter(isAcceptable)
            .forEach((a: any) => (<Acceptable>a).accept(this))
    }

    protected accept(symbol: BaseSymbol | undefined) {
        if (symbol && isAcceptable(symbol)) {
            symbol.accept(this)
        }
    }

    visitModel(model: BslCodeModel): void {
        this.acceptItems(model.children)
    }

    // definitions
    visitFunctionDefinition(symbol: FunctionDefinitionSymbol): void {
        this.acceptItems(symbol.params)
        this.acceptItems(symbol.children)
    }

    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol): void {
        this.acceptItems(symbol.params)
        this.acceptItems(symbol.children)
    }

    visitParameterDefinition(symbol: ParameterDefinitionSymbol): void {
        this.accept(symbol.defaultValue)
    }

    visitModuleVariableDefinition(symbol: ModuleVariableDefinitionSymbol): void {

    }

    // statements

    visitAssignmentStatement(symbol: AssignmentStatementSymbol): void {
        this.accept(symbol.variable)
        this.accept(symbol.expression)
    }

    visitReturnStatement(symbol: ReturnStatementSymbol): void {
        this.accept(symbol.expression)
    }

    // basic

    visitIndexAccessSymbol(symbol: IndexAccessSymbol): void {

    }

    visitMethodCallSymbol(symbol: MethodCallSymbol): void {
        if (symbol.arguments) {
            this.acceptItems(symbol.arguments)
        }
    }

    visitPropertyAccessSymbol(symbol: PropertyAccessSymbol): void {
        this.acceptItems(symbol.access)
    }

    visitPropertySymbol(symbol: PropertySymbol): void {

    }

    visitVariableSymbol(symbol: VariableSymbol): void {

    }
}
