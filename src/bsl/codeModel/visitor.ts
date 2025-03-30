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
    PreprocessorSymbol,
    ElseBranchSymbol,
    IfBranchSymbol,
    IfStatementSymbol,
    WhileStatementSymbol,
    ForStatementSymbol,
    ForEachStatementSymbol,
    ContinueStatementSymbol,
    BreakStatementSymbol,
    GotoStatementSymbol,
    LabelStatementSymbol,
    AddHandlerStatementSymbol,
    RemoveHandlerStatementSymbol,
    ExecuteStatementSymbol,
    TryStatementSymbol,
    RiseErrorStatementSymbol,
    VariableDefinitionSymbol
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

    // #region statements
    visitVariableDefinition(symbol: VariableDefinitionSymbol): any
    visitAssignmentStatement(symbol: AssignmentStatementSymbol): any
    visitReturnStatement(symbol: ReturnStatementSymbol): any

    visitExecuteStatement(symbol: ExecuteStatementSymbol): any
    visitTryStatement(symbol: TryStatementSymbol): any
    visitRiseErrorStatement(symbol: RiseErrorStatementSymbol): any

    visitIfStatement(symbol: IfStatementSymbol): any
    visitIfBranch(symbol: IfBranchSymbol): any
    visitElseBranch(symbol: ElseBranchSymbol): any

    visitWhileStatement(symbol: WhileStatementSymbol): any
    visitForStatement(symbol: ForStatementSymbol): any
    visitForEachStatement(symbol: ForEachStatementSymbol): any

    visitContinueStatement(symbol: ContinueStatementSymbol): any
    visitBreakStatement(symbol: BreakStatementSymbol): any

    visitGotoStatement(symbol: GotoStatementSymbol): any
    visitLabelStatement(symbol: LabelStatementSymbol): any

    visitAddHandlerStatement(symbol: AddHandlerStatementSymbol): any
    visitRemoveHandlerStatement(symbol: RemoveHandlerStatementSymbol): any
    // #endregion

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

export function acceptItems(items: (CodeSymbol | undefined)[] | undefined, visitor: CodeModelVisitor) {
    if (items) {
        return items
            .filter(item => item && isAcceptable(item))
            .map((a: any) => (<Acceptable>a).accept(visitor))
    }
}
export class BaseCodeModelVisitor implements CodeModelVisitor {
    protected accept(symbol: CodeSymbol | undefined) {
        if (symbol && isAcceptable(symbol)) {
            symbol.accept(this)
        }
    }

    visitModel(model: BslCodeModel): any {
        acceptItems(model.children, this)
    }

    // #region definitions
    visitFunctionDefinition(symbol: FunctionDefinitionSymbol): any {
        acceptItems(symbol.params, this)
        acceptItems(symbol.getChildrenSymbols(), this)
    }

    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol): any {
        acceptItems(symbol.params, this)
        acceptItems(symbol.children, this)
    }

    visitParameterDefinition(symbol: ParameterDefinitionSymbol): any {
        this.accept(symbol.defaultValue)
    }

    visitModuleVariableDefinition(_: ModuleVariableDefinitionSymbol): any { }
    // #endregion

    // #region statements
    visitVariableDefinition(symbol: VariableDefinitionSymbol) {
        acceptItems(symbol.vars, this)
    }

    visitAssignmentStatement(symbol: AssignmentStatementSymbol): any {
        acceptItems(symbol.getChildrenSymbols(), this)
    }

    visitReturnStatement(symbol: ReturnStatementSymbol): any {
        this.accept(symbol.expression)
    }

    visitExecuteStatement(symbol: ExecuteStatementSymbol): any {
        this.accept(symbol.text)
    }

    visitTryStatement(symbol: TryStatementSymbol): any {
        acceptItems(symbol.body, this)
        acceptItems(symbol.handler, this)
    }

    visitRiseErrorStatement(symbol: RiseErrorStatementSymbol): any {
        acceptItems(symbol.getChildrenSymbols(), this)
    }

    visitIfStatement(symbol: IfStatementSymbol) {
        acceptItems(symbol.branches, this)
        this.accept(symbol.elseBranch)
    }

    visitIfBranch(symbol: IfBranchSymbol) {
        this.accept(symbol.condition)
        acceptItems(symbol.body, this)
    }

    visitElseBranch(symbol: ElseBranchSymbol) {
        acceptItems(symbol.body, this)
    }

    visitWhileStatement(symbol: WhileStatementSymbol) {
        this.accept(symbol.condition)
        acceptItems(symbol.body, this)
    }

    visitForStatement(symbol: ForStatementSymbol) {
        this.accept(symbol.variable)
        this.accept(symbol.start)
        this.accept(symbol.end)
        acceptItems(symbol.body, this)
    }
    visitForEachStatement(symbol: ForEachStatementSymbol) {
        this.accept(symbol.variable)
        this.accept(symbol.collection)
        acceptItems(symbol.body, this)
    }

    visitBreakStatement(_: BreakStatementSymbol) { }
    visitContinueStatement(_: ContinueStatementSymbol) { }

    visitLabelStatement(_: LabelStatementSymbol) { }
    visitGotoStatement(_: GotoStatementSymbol) { }

    visitAddHandlerStatement(_: AddHandlerStatementSymbol) { }
    visitRemoveHandlerStatement(_: RemoveHandlerStatementSymbol) { }
    // #endregion

    // basic

    visitIndexAccessSymbol(symbol: IndexAccessSymbol): any {
        this.accept(symbol.index)
    }

    visitMethodCallSymbol(symbol: MethodCallSymbol): any {
        acceptItems(symbol.getChildrenSymbols(), this)
    }

    visitAccessSequenceSymbol(symbol: AccessSequenceSymbol): any {
        acceptItems(symbol.getChildrenSymbols(), this)
    }

    visitPropertySymbol(_: PropertySymbol): any {

    }

    visitVariableSymbol(_: VariableSymbol): any {

    }

    // expression
    visitUnaryExpressionSymbol(symbol: UnaryExpressionSymbol): any {
        acceptItems(symbol.getChildrenSymbols(), this)
    }

    visitBinaryExpressionSymbol(symbol: BinaryExpressionSymbol): any {
        acceptItems(symbol.getChildrenSymbols(), this)
    }

    visitTernaryExpressionSymbol(symbol: TernaryExpressionSymbol): any {
        acceptItems(symbol.getChildrenSymbols(), this)
    }

    visitConstructorSymbol(symbol: ConstructorSymbol): any {
        acceptItems(symbol.getChildrenSymbols(), this)
    }

    visitConstSymbol(_: ConstSymbol): any {

    }

    // preprocessor
    visitPreprocessorSymbol(_: PreprocessorSymbol): any {

    }
}
