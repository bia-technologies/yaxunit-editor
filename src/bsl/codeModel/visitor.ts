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
    accept(visitor: CodeModelVisitor): any
}

export function isAcceptable(symbol: any): symbol is Acceptable {
    return (<Acceptable>symbol).accept !== undefined
}

export interface CodeModelVisitor {
    visitModel(model: BslCodeModel): any

    // definitions
    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol): any
    visitFunctionDefinition(symbol: FunctionDefinitionSymbol): any
    visitParameterDefinition(symbol: ParameterDefinitionSymbol): any
    visitModuleVariableDefinition(symbol: ModuleVariableDefinitionSymbol): any

    // statements
    visitAssignmentStatement(symbol: AssignmentStatementSymbol): any
    visitReturnStatement(symbol: ReturnStatementSymbol): any

    // base
    visitVariableSymbol(symbol: VariableSymbol): any
    visitPropertySymbol(symbol: PropertySymbol): any
    visitIndexAccessSymbol(symbol: IndexAccessSymbol): any
    visitMethodCallSymbol(symbol: MethodCallSymbol): any
    visitAccessSequenceSymbol(symbol: AccessSequenceSymbol): any

    // expression
    visitUnaryExpressionSymbol(symbol: UnaryExpressionSymbol): any
    visitBinaryExpressionSymbol(symbol: BinaryExpressionSymbol): any
    visitTernaryExpressionSymbol(symbol: TernaryExpressionSymbol): any
    visitConstructorSymbol(symbol: ConstructorSymbol): any
    visitConstSymbol(symbol: ConstSymbol): any

    // preprocessor
    visitPreprocessorSymbol(symbol: PreprocessorSymbol): any
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

    visitModel(model: BslCodeModel): any {
        this.acceptItems(model.children)
    }

    // definitions
    visitFunctionDefinition(symbol: FunctionDefinitionSymbol): any {
        this.acceptItems(symbol.params)
        this.acceptItems(symbol.children)
    }

    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol): any {
        this.acceptItems(symbol.params)
        this.acceptItems(symbol.children)
    }

    visitParameterDefinition(symbol: ParameterDefinitionSymbol): any {
        this.accept(symbol.defaultValue)
    }

    visitModuleVariableDefinition(_: ModuleVariableDefinitionSymbol): any {

    }

    // statements
    visitAssignmentStatement(symbol: AssignmentStatementSymbol): any {
        this.accept(symbol.variable)
        this.accept(symbol.expression)
    }

    visitReturnStatement(symbol: ReturnStatementSymbol): any {
        this.accept(symbol.expression)
    }

    // basic

    visitIndexAccessSymbol(symbol: IndexAccessSymbol): any {
        this.accept(symbol.index)
    }

    visitMethodCallSymbol(symbol: MethodCallSymbol): any {
        if (symbol.arguments) {
            this.acceptItems(symbol.arguments)
        }
    }

    visitAccessSequenceSymbol(symbol: AccessSequenceSymbol): any {
        this.acceptItems(symbol.access)
    }

    visitPropertySymbol(_: PropertySymbol): any {

    }

    visitVariableSymbol(_: VariableSymbol): any {

    }

    // expression
    visitUnaryExpressionSymbol(symbol: UnaryExpressionSymbol): any {
        this.accept(symbol.operand)
    }

    visitBinaryExpressionSymbol(symbol: BinaryExpressionSymbol): any {
        this.accept(symbol.left)
        this.accept(symbol.right)
    }

    visitTernaryExpressionSymbol(symbol: TernaryExpressionSymbol): any {
        this.accept(symbol.condition)
        this.accept(symbol.condition)
        this.accept(symbol.alternative)
    }

    visitConstructorSymbol(symbol: ConstructorSymbol): any {
        if (Array.isArray(symbol.arguments)) {
            this.acceptItems(symbol.arguments)
        } else {
            this.accept(symbol.arguments)
        }
        if (typeof symbol.name === 'object') {
            this.accept(symbol.name)
        }
    }

    visitConstSymbol(_: ConstSymbol): any {

    }

    // preprocessor
    visitPreprocessorSymbol(_: PreprocessorSymbol): any {

    }
}
