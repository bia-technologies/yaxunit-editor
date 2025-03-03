import { BaseSymbol } from "@/common/codeModel/base";
import { PropertyAccessSymbol, VariableSymbol, Acceptable, CodeModelVisitor } from "@/bsl/codeModel";

export class AssignmentStatementSymbol extends BaseSymbol implements Acceptable {
    variable?: VariableSymbol | PropertyAccessSymbol
    expression?: BaseSymbol
    accept(visitor: CodeModelVisitor): void {
        visitor.visitAssignmentStatement(this)
    }
}

export class ReturnStatementSymbol extends BaseSymbol implements Acceptable {
    expression?: BaseSymbol
    accept(visitor: CodeModelVisitor): void {
        visitor.visitReturnStatement(this)
    }
}