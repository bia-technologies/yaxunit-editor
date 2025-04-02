import { BaseSymbol, CompositeSymbol, SymbolPosition } from "@/common/codeModel/base";
import { AccessSequenceSymbol, VariableSymbol, Acceptable, CodeModelVisitor, BaseExpressionSymbol } from "@/bsl/codeModel";

export class AssignmentStatementSymbol extends BaseSymbol implements Acceptable, CompositeSymbol {
    variable?: VariableSymbol | AccessSequenceSymbol
    expression?: BaseExpressionSymbol

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitAssignmentStatement(this)
    }

    getChildrenSymbols() {
        return [this.variable, this.expression]
    }
}

export class ReturnStatementSymbol extends BaseSymbol implements Acceptable, CompositeSymbol {
    expression?: BaseExpressionSymbol

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitReturnStatement(this)
    }

    getChildrenSymbols() {
        return [this.expression]
    }
}

export class ExecuteStatementSymbol extends BaseSymbol implements Acceptable, CompositeSymbol {
    text?: BaseExpressionSymbol

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitExecuteStatement(this)
    }

    getChildrenSymbols(): (BaseSymbol | undefined)[] {
        return [this.text]
    }
}

export class TryStatementSymbol extends BaseSymbol implements Acceptable, CompositeSymbol {
    body: BaseSymbol[]
    handler: BaseSymbol[]

    constructor(position: SymbolPosition, body: BaseSymbol[], handler: BaseSymbol[]) {
        super(position)
        this.body = body
        this.handler = handler
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitTryStatement(this)
    }

    getChildrenSymbols(): (BaseSymbol | undefined)[] {
        return [...this.handler, ...this.body]
    }
}

export class RiseErrorStatementSymbol extends BaseSymbol implements Acceptable, CompositeSymbol {
    error: BaseExpressionSymbol
    arguments?: BaseSymbol[]

    constructor(position: SymbolPosition, error: BaseExpressionSymbol, args?: BaseSymbol[]) {
        super(position)
        this.arguments = args
        this.error = error
        if (!this.error && args) {
            this.error = args[0]
        }
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitRiseErrorStatement(this)
    }

    getChildrenSymbols(): (BaseSymbol | undefined)[] {
        if (this.arguments) { return [this.error, ...this.arguments] }
        else { return [this.error] }
    }
}

export class IfStatementSymbol extends BaseSymbol implements Acceptable, CompositeSymbol {
    branches: ifBranch[] = []

    constructor(position: SymbolPosition, branches: IfBranchSymbol[], elseBranch?: ElseBranchSymbol) {
        super(position)
        this.branches = branches
        if (elseBranch) {
            this.branches.push(elseBranch)
        }
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitIfStatement(this)
    }

    getChildrenSymbols(): (BaseSymbol | undefined)[] {
        return this.branches
    }
}
export interface ifBranch extends BaseSymbol {
    condition?: BaseExpressionSymbol
    body: BaseSymbol[]

}
export class IfBranchSymbol extends BaseSymbol implements ifBranch, Acceptable, CompositeSymbol {
    condition: BaseExpressionSymbol
    body: BaseSymbol[]

    constructor(position: SymbolPosition, condition: BaseExpressionSymbol, body: BaseSymbol[]) {
        super(position)
        this.condition = condition
        this.body = body
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitIfBranch(this)
    }

    getChildrenSymbols(): (BaseSymbol | undefined)[] {
        return [this.condition, ...this.body]
    }
}

export class ElseBranchSymbol extends BaseSymbol implements ifBranch, Acceptable, CompositeSymbol {
    body: BaseSymbol[]

    constructor(position: SymbolPosition, body: BaseSymbol[]) {
        super(position)
        this.body = body
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitElseBranch(this)
    }

    getChildrenSymbols(): (BaseSymbol | undefined)[] {
        return this.body
    }
}

export class WhileStatementSymbol extends BaseSymbol implements Acceptable, CompositeSymbol {
    condition: BaseExpressionSymbol
    body: BaseSymbol[]

    constructor(position: SymbolPosition, condition: BaseExpressionSymbol, body: BaseSymbol[]) {
        super(position)
        this.condition = condition
        this.body = body
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitWhileStatement(this)
    }

    getChildrenSymbols(): (BaseSymbol | undefined)[] {
        return [this.condition, ...this.body]
    }
}

export class ForStatementSymbol extends BaseSymbol implements Acceptable, CompositeSymbol {
    variable: VariableSymbol
    start: BaseExpressionSymbol
    end: BaseExpressionSymbol
    body: BaseSymbol[]

    constructor(position: SymbolPosition, variable: VariableSymbol, start: BaseExpressionSymbol, end: BaseExpressionSymbol, body: BaseSymbol[]) {
        super(position)
        this.variable = variable
        this.start = start
        this.end = end
        this.body = body
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitForStatement(this)
    }

    getChildrenSymbols(): (BaseSymbol | undefined)[] {
        return [this.variable, this.start, this.end, ...this.body]
    }
}

export class ForEachStatementSymbol extends BaseSymbol implements Acceptable, CompositeSymbol {
    variable: VariableSymbol
    collection: BaseExpressionSymbol
    body: BaseSymbol[]

    constructor(position: SymbolPosition, variable: VariableSymbol, collection: BaseExpressionSymbol, body: BaseSymbol[]) {
        super(position)
        this.variable = variable
        this.collection = collection
        this.body = body
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitForEachStatement(this)
    }

    getChildrenSymbols(): (BaseSymbol | undefined)[] {
        return [this.variable, this.collection, ...this.body]
    }
}

export class ContinueStatementSymbol extends BaseSymbol implements Acceptable {
    accept(visitor: CodeModelVisitor): any {
        return visitor.visitContinueStatement(this)
    }
}

export class BreakStatementSymbol extends BaseSymbol implements Acceptable {
    accept(visitor: CodeModelVisitor): any {
        return visitor.visitBreakStatement(this)
    }
}

export class GotoStatementSymbol extends BaseSymbol implements Acceptable {
    label: string

    constructor(position: SymbolPosition, label: string) {
        super(position)
        this.label = label
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitGotoStatement(this)
    }
}

export class LabelStatementSymbol extends BaseSymbol implements Acceptable {
    label: string

    constructor(position: SymbolPosition, label: string) {
        super(position)
        this.label = label
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitLabelStatement(this)
    }
}

export class AddHandlerStatementSymbol extends BaseSymbol implements Acceptable, CompositeSymbol {
    event: BaseExpressionSymbol
    handler: BaseExpressionSymbol

    constructor(position: SymbolPosition, event: BaseExpressionSymbol, handler: BaseExpressionSymbol) {
        super(position)
        this.event = event
        this.handler = handler
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitAddHandlerStatement(this)
    }

    getChildrenSymbols(): (BaseSymbol | undefined)[] {
        return [this.event, this.handler]
    }
}

export class RemoveHandlerStatementSymbol extends BaseSymbol implements Acceptable, CompositeSymbol {
    event: BaseExpressionSymbol
    handler: BaseExpressionSymbol

    constructor(position: SymbolPosition, event: BaseExpressionSymbol, handler: BaseExpressionSymbol) {
        super(position)
        this.event = event
        this.handler = handler
    }

    accept(visitor: CodeModelVisitor): any {
        return visitor.visitRemoveHandlerStatement(this)
    }

    getChildrenSymbols(): (BaseSymbol | undefined)[] {
        return [this.event, this.handler]
    }

}

export class AwaitStatementSymbol extends BaseSymbol implements Acceptable, CompositeSymbol {
    expression: BaseExpressionSymbol

    constructor(position: SymbolPosition, expression: BaseExpressionSymbol) {
        super(position)
        this.expression = expression
    }

    accept(_: CodeModelVisitor): any {
        //return visitor.visitAwaitStatement(this)
    }

    getChildrenSymbols(): (BaseSymbol | undefined)[] {
        return [this.expression]
    }
}

