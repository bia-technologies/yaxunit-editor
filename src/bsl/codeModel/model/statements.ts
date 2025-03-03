import { BaseSymbol, ExpressionSymbol } from "@/common/codeModel/base";
import { AccessSequenceSymbol, VariableSymbol, Acceptable, CodeModelVisitor } from "@/bsl/codeModel";

export class AssignmentStatementSymbol extends BaseSymbol implements Acceptable {
    variable?: VariableSymbol | AccessSequenceSymbol
    expression?: ExpressionSymbol
    accept(visitor: CodeModelVisitor): void {
        visitor.visitAssignmentStatement(this)
    }
}

export class ReturnStatementSymbol extends BaseSymbol implements Acceptable {
    expression?: ExpressionSymbol
    accept(visitor: CodeModelVisitor): void {
        visitor.visitReturnStatement(this)
    }
}