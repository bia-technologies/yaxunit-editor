import {
    AssignmentStatementSymbol,
    BinaryExpressionSymbol,
    BslCodeModel,
    ConstSymbol,
    ConstructorSymbol,
    FunctionDefinitionSymbol,
    IndexAccessSymbol,
    MethodCallSymbol,
    ModuleVariableDefinitionSymbol,
    ParameterDefinitionSymbol,
    ProcedureDefinitionSymbol,
    AccessSequenceSymbol,
    PropertySymbol,
    ReturnStatementSymbol,
    TernaryExpressionSymbol,
    VariableSymbol,
    UnaryExpressionSymbol,
    PreprocessorSymbol
} from "@/bsl/codeModel";
import { CodeSymbol } from "@/common/codeModel";

export interface Acceptable {
    accept(visitor: CodeModelVisitor): void
}

function isAcceptable(symbol: any): symbol is Acceptable {
    return (<Acceptable>symbol).accept !== undefined
}

export interface CodeModelVisitor {
    visitModel(model: BslCodeModel): void

    // definitions
    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol): void
    visitFunctionDefinition(symbol: FunctionDefinitionSymbol): void
    visitParameterDefinition(symbol: ParameterDefinitionSymbol): void
    visitModuleVariableDefinition(symbol: ModuleVariableDefinitionSymbol): void

    // statements
    visitAssignmentStatement(symbol: AssignmentStatementSymbol): void
    visitReturnStatement(symbol: ReturnStatementSymbol): void

    // base
    visitVariableSymbol(symbol: VariableSymbol): void
    visitPropertySymbol(symbol: PropertySymbol): void
    visitIndexAccessSymbol(symbol: IndexAccessSymbol): void
    visitMethodCallSymbol(symbol: MethodCallSymbol): void
    visitAccessSequenceSymbol(symbol: AccessSequenceSymbol): void

    // expression
    visitUnaryExpressionSymbol(symbol: UnaryExpressionSymbol): void
    visitBinaryExpressionSymbol(symbol: BinaryExpressionSymbol): void
    visitTernaryExpressionSymbol(symbol: TernaryExpressionSymbol): void
    visitConstructorSymbol(symbol: ConstructorSymbol): void
    visitConstSymbol(symbol: ConstSymbol): void

    // preprocessor
    visitPreprocessorSymbol(symbol: PreprocessorSymbol): void
}

export class BaseCodeModelVisitor implements CodeModelVisitor {

    protected acceptItems(items: CodeSymbol[]) {
        items.filter(isAcceptable)
            .forEach((a: any) => (<Acceptable>a).accept(this))
    }

    protected accept(symbol: CodeSymbol | undefined) {
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

    visitAccessSequenceSymbol(symbol: AccessSequenceSymbol): void {
        this.acceptItems(symbol.access)
    }

    visitPropertySymbol(symbol: PropertySymbol): void {

    }

    visitVariableSymbol(symbol: VariableSymbol): void {

    }

    // expression
    visitUnaryExpressionSymbol(symbol: UnaryExpressionSymbol): void {
        this.accept(symbol.operand)
    }

    visitBinaryExpressionSymbol(symbol: BinaryExpressionSymbol): void {
        this.accept(symbol.left)
        this.accept(symbol.right)
    }

    visitTernaryExpressionSymbol(symbol: TernaryExpressionSymbol): void {
        this.accept(symbol.condition)
        this.accept(symbol.condition)
        this.accept(symbol.alternative)
    }

    visitConstructorSymbol(symbol: ConstructorSymbol): void {
        if (Array.isArray(symbol.arguments)) {
            this.acceptItems(symbol.arguments)
        } else {
            this.accept(symbol.arguments)
        }
    }

    visitConstSymbol(symbol: ConstSymbol): void {

    }

    // preprocessor
    visitPreprocessorSymbol(symbol: PreprocessorSymbol): void {
        
    }
}
