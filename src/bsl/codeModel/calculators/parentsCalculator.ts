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

    calculate(model: BslCodeModel) {
        this.visitModel(model)
    }

    setParent(parent: BaseSymbol, symbol: BaseSymbol | undefined) {
        if (symbol) {
            symbol.parent = parent
            if (isAcceptable(symbol)) {
                symbol.accept(this)
            }
        }
    }
    setParentItems(parent: BaseSymbol, items: BaseSymbol[] | undefined) {
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
        this.setParent(symbol, symbol.error)
        this.setParentItems(symbol, symbol.arguments)
    }

    visitIfStatement(symbol: IfStatementSymbol) {
        this.setParentItems(symbol, symbol.brunches)
        this.setParent(symbol, symbol.elseBrunch)
    }

    visitIfBranch(symbol: IfBranchSymbol) {
        this.setParent(symbol, symbol.condition)
        this.setParentItems(symbol, symbol.body)
    }

    visitElseBrunch(symbol: ElseBranchSymbol) {
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
        this.setParent(symbol, symbol.event)
        this.setParent(symbol, symbol.handler)
    }
    visitRemoveHandlerStatement(symbol: RemoveHandlerStatementSymbol) {
        this.setParent(symbol, symbol.event)
        this.setParent(symbol, symbol.handler)
    }
    // #endregion

    // basic

    visitIndexAccessSymbol(symbol: IndexAccessSymbol): any {
        this.setParent(symbol, symbol.index)
    }

    visitMethodCallSymbol(symbol: MethodCallSymbol): any {
        if (symbol.arguments) {
            this.setParentItems(symbol, symbol.arguments)
        }
    }

    visitAccessSequenceSymbol(symbol: AccessSequenceSymbol): any {
        this.setParentItems(symbol, symbol.access)
    }

    visitPropertySymbol(_: any): any { }

    visitVariableSymbol(_: any): any { }

    // expression
    visitUnaryExpressionSymbol(symbol: UnaryExpressionSymbol): any {
        this.setParent(symbol, symbol.operand)
    }

    visitBinaryExpressionSymbol(symbol: BinaryExpressionSymbol): any {
        this.setParent(symbol, symbol.left)
        this.setParent(symbol, symbol.right)
    }

    visitTernaryExpressionSymbol(symbol: TernaryExpressionSymbol): any {
        this.setParent(symbol, symbol.condition)
        this.setParent(symbol, symbol.condition)
        this.setParent(symbol, symbol.alternative)
    }

    visitConstructorSymbol(symbol: ConstructorSymbol): any {
        if (Array.isArray(symbol.arguments)) {
            this.setParentItems(symbol, symbol.arguments)
        } else {
            this.setParent(symbol, symbol.arguments)
        }
        if (typeof symbol.name === 'object') {
            this.setParent(symbol, symbol.name)
        }
    }

    visitConstSymbol(_: any): any { }

    // preprocessor
    visitPreprocessorSymbol(_: any): any { }
}