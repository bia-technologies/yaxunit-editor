import { BaseTypes } from "@/bsl/scope/baseTypes";
import { AssignmentStatementSymbol, BinaryExpressionSymbol, BslCodeModel } from "../model";
import { Operators, isCompareOperator } from "../model/operators";
import { BaseCodeModelVisitor } from "../visitor"

export class TypesCalculator extends BaseCodeModelVisitor {
    calculate(model: BslCodeModel) {
        this.visitModel(model)
    }

    visitAssignmentStatement(symbol: AssignmentStatementSymbol): void {
        super.visitAssignmentStatement(symbol)

        if (symbol.variable && symbol.expression?.type) {
            symbol.variable.type = symbol.expression.type
        }
        if (symbol.variable && symbol.expression?.value) {
            symbol.variable.value = symbol.expression.value
        }
    }

    visitBinaryExpressionSymbol(symbol: BinaryExpressionSymbol): void {
        super.visitBinaryExpressionSymbol(symbol)

        if (!symbol.left || !symbol.right || !symbol.operator) {
            return
        }

        if (isCompareOperator(symbol.operator)) {
            symbol.type = BaseTypes.boolean
        } else if (symbol.operator === Operators.plus) {
            symbol.type = symbol.left.type
        }
    }
}