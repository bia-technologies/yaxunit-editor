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
        return 'statements' // Используется верхнеуровневое обобщающее правило для возможности разбора нескольких выражений
    }
    visitAssignmentStatement() {
        return 'statements' // Используется верхнеуровневое обобщающее правило для возможности разбора нескольких выражений
    }
    visitBinaryExpressionSymbol(symbol: BinaryExpressionSymbol) {
        return symbol.parent instanceof BinaryExpressionSymbol ? undefined : 'expression'
    }
    visitBreakStatement() {
        return undefined
    }
    visitConstSymbol() {
        // Для корректной обработки незакрытой кавычки строки
        return undefined // 'literal'
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
        return 'statements' // Используется верхнеуровневое обобщающее правило для возможности разбора нескольких выражений
    }
    visitForEachStatement() {
        return 'statements' // Используется верхнеуровневое обобщающее правило для возможности разбора нескольких выражений
    }
    visitForStatement() {
        return 'statements' // Используется верхнеуровневое обобщающее правило для возможности разбора нескольких выражений
    }
    visitFunctionDefinition() {
        return 'module' // Используется верхнеуровневое обобщающее правило, когда вставляется несколько методов
    }
    visitGotoStatement() {
        return 'statements' // Используется верхнеуровневое обобщающее правило для возможности разбора нескольких выражений
    }
    visitIfBranch() {
        return undefined
    }
    visitIfStatement() {
        return 'statements' // Используется верхнеуровневое обобщающее правило для возможности разбора нескольких выражений
    }
    visitIndexAccessSymbol() {
        return undefined
    }
    visitLabelStatement() {
        return 'statements' // Используется верхнеуровневое обобщающее правило для возможности разбора нескольких выражений
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
        return 'module' // Используется верхнеуровневое обобщающее правило, когда вставляется несколько методов
    }
    visitPropertySymbol() {
        return undefined
    }
    visitRemoveHandlerStatement() {
        return 'statements' // Используется верхнеуровневое обобщающее правило для возможности разбора нескольких выражений
    }
    visitReturnStatement() {
        return 'statements' // Используется верхнеуровневое обобщающее правило для возможности разбора нескольких выражений
    }
    visitRiseErrorStatement() {
        return 'statements' // Используется верхнеуровневое обобщающее правило для возможности разбора нескольких выражений
    }
    visitTernaryExpressionSymbol() {
        return 'ternaryExpression'
    }
    visitTryStatement() {
        return 'statements' // Используется верхнеуровневое обобщающее правило для возможности разбора нескольких выражений
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
        return 'statements' // Используется верхнеуровневое обобщающее правило для возможности разбора нескольких выражений
    }
}