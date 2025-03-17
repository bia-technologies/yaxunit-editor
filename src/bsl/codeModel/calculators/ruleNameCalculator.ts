import {
    BinaryExpressionSymbol,
    MethodCallSymbol,
    AccessSequenceSymbol,
} from "@/bsl/codeModel";
import { CodeModelVisitor } from "../visitor";

export class RuleNameCalculator implements CodeModelVisitor {
    static instance = new RuleNameCalculator()

    visitAccessSequenceSymbol() {
        return 'qualifiedName'
    }
    visitAddHandlerStatement() {
        return 'addHandlerStatement'
    }
    visitAssignmentStatement() {
        return 'assignmentStatement'
    }
    visitBinaryExpressionSymbol(symbol: BinaryExpressionSymbol) {
        return symbol.parent instanceof BinaryExpressionSymbol ? undefined : 'expression'
    }
    visitBreakStatement() {
        return undefined
    }
    visitConstSymbol() {
        return 'literal'
    }
    visitConstructorSymbol() {
        return 'constructorExpression'
    }
    visitContinueStatement() {
        return undefined
    }
    visitElseBranch() {
        return undefined
    }
    visitExecuteStatement() {
        return 'executeStatement'
    }
    visitForEachStatement() {
        return 'forEachStatement'
    }
    visitForStatement() {
        return 'forStatement'
    }
    visitFunctionDefinition() {
        return 'function'
    }
    visitGotoStatement() {
        return 'gotoStatement'
    }
    visitIfBranch() {
        return undefined
    }
    visitIfStatement() {
        return 'ifStatement'
    }
    visitIndexAccessSymbol() {

    }
    visitLabelStatement() {
        return 'labelStatement'
    }
    visitMethodCallSymbol(symbol: MethodCallSymbol) {
        return symbol.parent instanceof AccessSequenceSymbol ? undefined : 'methodCall'
    }
    visitModel() {
        return 'model'
    }
    visitModuleVariableDefinition() {
        return 'varStatement'
    }
    visitParameterDefinition() {
        return 'parameter'
    }
    visitPreprocessorSymbol() {
        return undefined
    }
    visitProcedureDefinition() {
        return 'procedure'
    }
    visitPropertySymbol() {
        return undefined
    }
    visitRemoveHandlerStatement() {
        return 'removeHandlerStatement'
    }
    visitReturnStatement() {
        return 'returnStatement'
    }
    visitRiseErrorStatement() {
        return 'riseErrorStatement'
    }
    visitTernaryExpressionSymbol() {
        return 'ternaryExpression'
    }
    visitTryStatement() {
        return 'tryStatement'
    }
    visitUnaryExpressionSymbol() {
        return undefined
    }
    visitVariableDefinition() {
        return 'varStatement'
    }
    visitVariableSymbol() {
        return undefined
    }
    visitWhileStatement() {
        return 'whileStatement'
    }
}