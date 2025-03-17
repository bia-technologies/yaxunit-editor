import { Acceptable, CodeModelVisitor, isAcceptable } from "../visitor";
import {
    AccessSequenceSymbol,
    IndexAccessSymbol,
    MethodCallSymbol,
    AssignmentStatementSymbol,
    ReturnStatementSymbol,
    FunctionDefinitionSymbol,
    ParameterDefinitionSymbol,
    ProcedureDefinitionSymbol,
    BinaryExpressionSymbol,
    ConstructorSymbol,
    TernaryExpressionSymbol,
    UnaryExpressionSymbol,
    BslCodeModel,
    ElseBranchSymbol,
    IfBranchSymbol,
    IfStatementSymbol,
    WhileStatementSymbol,
    ForStatementSymbol,
    ForEachStatementSymbol,
    AddHandlerStatementSymbol,
    RemoveHandlerStatementSymbol,
    ExecuteStatementSymbol,
    TryStatementSymbol,
    RiseErrorStatementSymbol,
    VariableDefinitionSymbol
} from "../model";
import { BaseSymbol } from "@/common/codeModel";
import { ModelCalculator } from "./calculator";

export class ParentsCalculator implements CodeModelVisitor, ModelCalculator {

    calculate(symbol: BslCodeModel | BaseSymbol) {
        const start = performance.now()
        if (symbol instanceof BslCodeModel) {
            this.visitModel(symbol)
        } else if (isAcceptable(symbol)) {
            symbol.accept(this)
        }
        console.log('Calculate parents', performance.now() - start, 'ms')
    }

    setParent(parent: BaseSymbol, symbol: BaseSymbol | undefined) {
        if (symbol) {
            symbol.parent = parent
            if (isAcceptable(symbol)) {
                symbol.accept(this)
            }
        }
    }
    setParentItems(parent: BaseSymbol, items: (BaseSymbol | undefined)[] | undefined) {
        if (items) {
            items.forEach(i => { if (i) this.setParent(parent, i) })
        }
    }

    visitModel(model: BslCodeModel): any {
        model.children.filter(isAcceptable)
            .forEach((symbol: any) => (<Acceptable>symbol).accept(this))
    }

    // #region definitions
    visitFunctionDefinition(symbol: FunctionDefinitionSymbol): any {
        this.setParentItems(symbol, symbol.params)
        this.setParentItems(symbol, symbol.children)
    }

    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol): any {
        this.setParentItems(symbol, symbol.params)
        this.setParentItems(symbol, symbol.children)
    }

    visitParameterDefinition(symbol: ParameterDefinitionSymbol): any {
        this.setParent(symbol, symbol.defaultValue)
    }

    visitModuleVariableDefinition(_: any): any { }
    //#endregion

    // #region statements
    visitVariableDefinition(symbol: VariableDefinitionSymbol) {
        this.setParentItems(symbol, symbol.vars)
    }

    visitAssignmentStatement(symbol: AssignmentStatementSymbol): any {
        this.setParent(symbol, symbol.variable)
        this.setParent(symbol, symbol.expression)
    }

    visitReturnStatement(symbol: ReturnStatementSymbol): any {
        this.setParent(symbol, symbol.expression)
    }

    visitExecuteStatement(symbol: ExecuteStatementSymbol): any {
        this.setParent(symbol, symbol.text)
    }

    visitTryStatement(symbol: TryStatementSymbol): any {
        this.setParentItems(symbol, symbol.body)
        this.setParentItems(symbol, symbol.handler)
    }

    visitRiseErrorStatement(symbol: RiseErrorStatementSymbol): any {
        this.setParentItems(symbol, symbol.getChildrenSymbols())
    }

    visitIfStatement(symbol: IfStatementSymbol) {
        this.setParentItems(symbol, symbol.branches)
        this.setParent(symbol, symbol.elseBranch)
    }

    visitIfBranch(symbol: IfBranchSymbol) {
        this.setParent(symbol, symbol.condition)
        this.setParentItems(symbol, symbol.body)
    }

    visitElseBranch(symbol: ElseBranchSymbol) {
        this.setParentItems(symbol, symbol.body)
    }

    visitWhileStatement(symbol: WhileStatementSymbol) {
        this.setParent(symbol, symbol.condition)
        this.setParentItems(symbol, symbol.body)
    }

    visitForStatement(symbol: ForStatementSymbol) {
        this.setParent(symbol, symbol.variable)
        this.setParent(symbol, symbol.start)
        this.setParent(symbol, symbol.end)
        this.setParentItems(symbol, symbol.body)
    }
    visitForEachStatement(symbol: ForEachStatementSymbol) {
        this.setParent(symbol, symbol.variable)
        this.setParent(symbol, symbol.collection)
        this.setParentItems(symbol, symbol.body)
    }

    visitBreakStatement() { }
    visitContinueStatement() { }

    visitLabelStatement() { }
    visitGotoStatement() { }

    visitAddHandlerStatement(symbol: AddHandlerStatementSymbol) {
        this.setParentItems(symbol, symbol.getChildrenSymbols())
    }
    visitRemoveHandlerStatement(symbol: RemoveHandlerStatementSymbol) {
        this.setParentItems(symbol, symbol.getChildrenSymbols())
    }
    // #endregion

    // basic

    visitIndexAccessSymbol(symbol: IndexAccessSymbol): any {
        this.setParent(symbol, symbol.index)
    }

    visitMethodCallSymbol(symbol: MethodCallSymbol): any {
        this.setParentItems(symbol, symbol.getChildrenSymbols())
    }

    visitAccessSequenceSymbol(symbol: AccessSequenceSymbol): any {
        this.setParentItems(symbol, symbol.getChildrenSymbols())
    }

    visitPropertySymbol(_: any): any { }

    visitVariableSymbol(_: any): any { }

    // expression
    visitUnaryExpressionSymbol(symbol: UnaryExpressionSymbol): any {
        this.setParentItems(symbol, symbol.getChildrenSymbols())
    }

    visitBinaryExpressionSymbol(symbol: BinaryExpressionSymbol): any {
        this.setParentItems(symbol, symbol.getChildrenSymbols())
    }

    visitTernaryExpressionSymbol(symbol: TernaryExpressionSymbol): any {
        this.setParentItems(symbol, symbol.getChildrenSymbols())
    }

    visitConstructorSymbol(symbol: ConstructorSymbol): any {
        this.setParentItems(symbol, symbol.getChildrenSymbols())
    }

    visitConstSymbol(_: any): any { }

    // preprocessor
    visitPreprocessorSymbol(_: any): any { }
}