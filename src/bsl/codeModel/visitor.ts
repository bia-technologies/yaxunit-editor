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

export class BaseCodeModelVisitor implements CodeModelVisitor {

    protected acceptItems(items: (CodeSymbol | undefined)[] | undefined) {
        if (items) {
            items
                .filter(item => item && isAcceptable(item))
                .forEach((a: any) => (<Acceptable>a).accept(this))
        }
    }

    protected accept(symbol: CodeSymbol | undefined) {
        if (symbol && isAcceptable(symbol)) {
            symbol.accept(this)
        }
    }

    visitModel(model: BslCodeModel): any {
        this.acceptItems(model.children)
    }

    // #region definitions
    visitFunctionDefinition(symbol: FunctionDefinitionSymbol): any {
        this.acceptItems(symbol.params)
        this.acceptItems(symbol.getChildrenSymbols())
    }

    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol): any {
        this.acceptItems(symbol.params)
        this.acceptItems(symbol.children)
    }

    visitParameterDefinition(symbol: ParameterDefinitionSymbol): any {
        this.accept(symbol.defaultValue)
    }

    visitModuleVariableDefinition(_: ModuleVariableDefinitionSymbol): any { }
    // #endregion

    // #region statements
    visitVariableDefinition(symbol: VariableDefinitionSymbol) {
        this.acceptItems(symbol.vars)
    }

    visitAssignmentStatement(symbol: AssignmentStatementSymbol): any {
        this.acceptItems(symbol.getChildrenSymbols())
    }

    visitReturnStatement(symbol: ReturnStatementSymbol): any {
        this.accept(symbol.expression)
    }

    visitExecuteStatement(symbol: ExecuteStatementSymbol): any {
        this.accept(symbol.text)
    }

    visitTryStatement(symbol: TryStatementSymbol): any {
        this.acceptItems(symbol.body)
        this.acceptItems(symbol.handler)
    }

    visitRiseErrorStatement(symbol: RiseErrorStatementSymbol): any {
        this.acceptItems(symbol.getChildrenSymbols())
    }

    visitIfStatement(symbol: IfStatementSymbol) {
        this.acceptItems(symbol.branches)
        this.accept(symbol.elseBranch)
    }

    visitIfBranch(symbol: IfBranchSymbol) {
        this.accept(symbol.condition)
        this.acceptItems(symbol.body)
    }

    visitElseBranch(symbol: ElseBranchSymbol) {
        this.acceptItems(symbol.body)
    }

    visitWhileStatement(symbol: WhileStatementSymbol) {
        this.accept(symbol.condition)
        this.acceptItems(symbol.body)
    }

    visitForStatement(symbol: ForStatementSymbol) {
        this.accept(symbol.variable)
        this.accept(symbol.start)
        this.accept(symbol.end)
        this.acceptItems(symbol.body)
    }
    visitForEachStatement(symbol: ForEachStatementSymbol) {
        this.accept(symbol.variable)
        this.accept(symbol.collection)
        this.acceptItems(symbol.body)
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
        this.acceptItems(symbol.getChildrenSymbols())
    }

    visitAccessSequenceSymbol(symbol: AccessSequenceSymbol): any {
        this.acceptItems(symbol.getChildrenSymbols())
    }

    visitPropertySymbol(_: PropertySymbol): any {

    }

    visitVariableSymbol(_: VariableSymbol): any {

    }

    // expression
    visitUnaryExpressionSymbol(symbol: UnaryExpressionSymbol): any {
        this.acceptItems(symbol.getChildrenSymbols())
    }

    visitBinaryExpressionSymbol(symbol: BinaryExpressionSymbol): any {
        this.acceptItems(symbol.getChildrenSymbols())
    }

    visitTernaryExpressionSymbol(symbol: TernaryExpressionSymbol): any {
        this.acceptItems(symbol.getChildrenSymbols())
    }

    visitConstructorSymbol(symbol: ConstructorSymbol): any {
        this.acceptItems(symbol.getChildrenSymbols())
    }

    visitConstSymbol(_: ConstSymbol): any {

    }

    // preprocessor
    visitPreprocessorSymbol(_: PreprocessorSymbol): any {

    }
}
