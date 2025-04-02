import {
    BinaryExpressionSymbol,
    AccessSequenceSymbol
} from "@/bsl/codeModel";
import { CodeModelVisitor, isAcceptable } from "../visitor";
import { BaseSymbol } from "@/common/codeModel";

export class RuleNameCalculator implements CodeModelVisitor {
    static instance = new RuleNameCalculator()

    static getSymbolRule(symbol: BaseSymbol) {
        return isAcceptable(symbol) ? symbol.accept(RuleNameCalculator.instance) : undefined
    }

    static getAvailableSymbol(baseSymbol: BaseSymbol | undefined) {
        let symbol: BaseSymbol | undefined = baseSymbol
        let rule

        while (symbol && (rule = RuleNameCalculator.getSymbolRule(symbol)) === undefined) {
            symbol = symbol?.parent
        }
        return { rule, symbol }
    }

    visitAccessSequenceSymbol() {
        return 'qualifiedName'
    }
    visitAddHandlerStatement() {
        return 'statements' // Используется верхнеуровневое обобщающее правило для возможности разбора нескольких выражений
    }
    visitAssignmentStatement() {
        return 'statements' // Используется верхнеуровневое обобщающее правило для возможности разбора нескольких выражений
    }
    visitBinaryExpressionSymbol(symbol: BaseSymbol) {
        return symbol.parent instanceof BinaryExpressionSymbol ? undefined : 'expression'
    }
    visitBreakStatement(symbol: BaseSymbol) {
        return symbol.parent ? undefined : 'statements'
    }
    visitConstSymbol(symbol: BaseSymbol) {
        // Для корректной обработки незакрытой кавычки строки
        return symbol.parent ? undefined : 'literal'
    }
    visitConstructorSymbol() {
        return 'constructorExpression'
    }
    visitContinueStatement(symbol: BaseSymbol) {
        return symbol.parent ? undefined : 'statements'
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
    visitMethodCallSymbol(symbol: BaseSymbol) {
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
    visitPreprocessorSymbol(symbol: BaseSymbol) {
        return symbol.parent ? undefined : 'preprocessor'
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
    visitUnaryExpressionSymbol(symbol: BaseSymbol) {
        return symbol.parent ? undefined : 'expression'
    }
    visitVariableDefinition() {
        return 'varStatement'
    }
    visitVariableSymbol(symbol: BaseSymbol) {
        return symbol.parent ? undefined : 'qualifiedName'
    }
    visitWhileStatement() {
        return 'statements' // Используется верхнеуровневое обобщающее правило для возможности разбора нескольких выражений
    }
}