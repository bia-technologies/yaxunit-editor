import { BaseSymbol, CodeSymbol, CompositeSymbol } from "@/common/codeModel/base";
import { AccessSequenceSymbol, VariableSymbol, Acceptable, CodeModelVisitor, BaseExpressionSymbol } from "@/bsl/codeModel";
import { descendantByOffset } from "@/common/codeModel";

export class AssignmentStatementSymbol extends BaseSymbol implements Acceptable, CompositeSymbol {
    variable?: VariableSymbol | AccessSequenceSymbol
    expression?: BaseExpressionSymbol

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitAssignmentStatement(this)
    }

    descendantByOffset(offset: number): CodeSymbol | undefined {
        return descendantByOffset(offset, this.variable, this.expression)
    }
}

export class ReturnStatementSymbol extends BaseSymbol implements Acceptable, CompositeSymbol {
    expression?: BaseExpressionSymbol

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitReturnStatement(this)
    }

    descendantByOffset(offset: number): CodeSymbol | undefined {
        return descendantByOffset(offset, this.expression)
    }
}