import { BaseTypes } from "@/bsl/scope/baseTypes";
import {
    AssignmentStatementSymbol,
    BinaryExpressionSymbol,
    BslCodeModel,
    ConstSymbol,
    ConstructorSymbol,
    FunctionDefinitionSymbol,
    IndexAccessSymbol,
    MethodCallSymbol,
    ModuleVariableDefinitionSymbol,
    ParameterDefinitionSymbol,
    ProcedureDefinitionSymbol,
    AccessSequenceSymbol,
    PropertySymbol,
    ReturnStatementSymbol,
    TernaryExpressionSymbol,
    VariableSymbol,
    UnaryExpressionSymbol,
    PreprocessorSymbol,
    BslVariable,
    ElseBranchSymbol,
    IfBranchSymbol,
    IfStatementSymbol,
    WhileStatementSymbol,
    ForStatementSymbol,
    ForEachStatementSymbol,
    ExecuteStatementSymbol,
    TryStatementSymbol,
    RiseErrorStatementSymbol
} from "@/bsl/codeModel";
import { Operators, isCompareOperator } from "../model/operators"
import { CodeModelVisitor, isAcceptable } from "../visitor"
import { BaseScope, GlobalScope, Scope, UnionScope } from "@/common/scope"
import { BaseSymbol, CodeSymbol } from "@/common/codeModel"
import { isVariablesScope, VariablesScope } from "../model/interfaces"
import { ModelCalculator } from "./calculator";

export class TypesCalculator implements CodeModelVisitor, ModelCalculator {
    static readonly instance: TypesCalculator = new TypesCalculator()

    codeModel?: BslCodeModel

    constructor(codeModel?: BslCodeModel) {
        this.codeModel = codeModel
    }

    private localScope?: BaseScope
    private fullScope: UnionScope = new UnionScope()

    async calculate(model: VariablesScope | CodeSymbol) {
        const start = performance.now()
        if (model instanceof BslCodeModel) {
            await this.visitModel(model)
        } else {
            await this.calculateSymbol(model as BaseSymbol)
        }
        console.log('Calculate types', performance.now() - start, 'ms')
    }

    private async calculateSymbol(symbol: BaseSymbol) {
        let parent: BaseSymbol | undefined = symbol
        while (parent) {
            if (isVariablesScope(parent)) {
                this.initScope(parent)
                break
            }
            parent = parent.parent
        }

        if (!parent) {
            return
        }
        if (isAcceptable(symbol)) {
            symbol.accept(this)
        }
    }

    async visitModel(model: BslCodeModel) {
        this.initScope(model)
        await this.acceptItems(model.getChildrenSymbols())
    }

    // #region definitions
    async visitProcedureDefinition(symbol: ProcedureDefinitionSymbol) {
        this.initScope(symbol)
        await this.acceptItems(symbol.children)
    }

    async visitFunctionDefinition(symbol: FunctionDefinitionSymbol) {
        this.initScope(symbol)
        await this.acceptItems(symbol.children)
    }

    visitParameterDefinition(_: ParameterDefinitionSymbol): any { }

    visitModuleVariableDefinition(_: ModuleVariableDefinitionSymbol): any { }
    // #endregion

    // #region statements
    visitVariableDefinition() { }

    async visitAssignmentStatement(symbol: AssignmentStatementSymbol) {
        if (!symbol.variable) {
            return
        }
        await this.accept(symbol.expression)

        if (symbol.expression?.type) {
            symbol.variable.type = symbol.expression.type
        }
        if (symbol.expression?.value) {
            symbol.variable.value = symbol.expression.value
        }
        if (symbol.variable instanceof VariableSymbol) {
            await this.handleVariable(symbol.variable)
        }
    }

    async visitReturnStatement(symbol: ReturnStatementSymbol) {
        await this.accept(symbol.expression)
    }

    async visitExecuteStatement(symbol: ExecuteStatementSymbol) {
        await this.accept(symbol.text)
    }

    async visitTryStatement(symbol: TryStatementSymbol) {
        await this.acceptItems(symbol.body)
        await this.acceptItems(symbol.handler)
    }

    async visitRiseErrorStatement(symbol: RiseErrorStatementSymbol) {
        await this.acceptItems(symbol.getChildrenSymbols())
    }

    visitVarStatement(): any { }

    async visitIfStatement(symbol: IfStatementSymbol) {
        await this.acceptItems(symbol.branches)
    }

    async visitIfBranch(symbol: IfBranchSymbol) {
        await this.accept(symbol.condition)
        await this.acceptItems(symbol.body)
    }

    async visitElseBranch(symbol: ElseBranchSymbol) {
        await this.acceptItems(symbol.body)
    }

    async visitWhileStatement(symbol: WhileStatementSymbol) {
        await this.accept(symbol.condition)
        await this.acceptItems(symbol.body)
    }

    async visitForStatement(symbol: ForStatementSymbol) {
        if (!symbol.variable.type) {
            symbol.variable.type = BaseTypes.number
        }
        await this.handleVariable(symbol.variable)
        await this.acceptItems(symbol.body)
    }
    async visitForEachStatement(symbol: ForEachStatementSymbol) {
        await this.accept(symbol.variable)
        await this.accept(symbol.collection)
        await this.acceptItems(symbol.body)
    }

    visitBreakStatement() { }
    visitContinueStatement() { }

    visitLabelStatement() { }
    visitGotoStatement() { }

    visitAddHandlerStatement() { }
    visitRemoveHandlerStatement() { }
    // #endregion

    // basic
    async visitIndexAccessSymbol(symbol: IndexAccessSymbol) {
        await this.accept(symbol.index)
    }

    async visitMethodCallSymbol(symbol: MethodCallSymbol) {
        if (!symbol.member) {
            symbol.member = this.fullScope.findMember(symbol.name)
            if (symbol.member?.type) {
                symbol.type = await symbol.member.type
            }
        }
        await this.acceptItems(symbol.arguments)
    }

    async visitAccessSequenceSymbol(symbol: AccessSequenceSymbol) {
        let parentType: string | undefined = 'global'
        for (const item of symbol.access) {
            if (!item.type) {
                const parentScope: Scope | undefined = parentType === 'global' ? this.fullScope : await GlobalScope.resolveType(parentType)
                if (parentScope) {
                    if (item instanceof IndexAccessSymbol) { // TODO Index access
                        break
                    } else {
                        item.member = parentScope.findMember(item.name)
                        item.type = await item.member?.type
                    }
                }
            }
            if (!item.type) {
                break
            } else {
                parentType = item.type
            }
        }
        symbol.type = symbol.last.type
        await this.acceptItems(symbol.getChildrenSymbols())
    }

    visitPropertySymbol(_: PropertySymbol): any { }

    async visitVariableSymbol(symbol: VariableSymbol) {
        const member = this.findVar(symbol.name)
        if (member) {
            symbol.type = await member.type
            symbol.value = member.value
        }
    }

    // expression
    async visitUnaryExpressionSymbol(symbol: UnaryExpressionSymbol) {
        await this.accept(symbol.operand)
    }

    async visitBinaryExpressionSymbol(symbol: BinaryExpressionSymbol) {
        if (!symbol.left || !symbol.right || !symbol.operator) {
            return
        }

        await this.acceptItems(symbol.getChildrenSymbols())

        if (isCompareOperator(symbol.operator)) {
            symbol.type = BaseTypes.boolean
        } else if (symbol.operator === Operators.plus) {
            symbol.type = symbol.left.type
        }
    }

    async visitTernaryExpressionSymbol(symbol: TernaryExpressionSymbol) {
        await this.acceptItems(symbol.getChildrenSymbols())
    }

    async visitConstructorSymbol(symbol: ConstructorSymbol) {
        await this.acceptItems(symbol.getChildrenSymbols())
    }

    visitConstSymbol(_: ConstSymbol): any { }

    // preprocessor
    visitPreprocessorSymbol(_: PreprocessorSymbol): any { }


    findVar(name: string) {
        return this.localScope?.findMember(name) as BslVariable
    }

    private async handleVariable(symbol: VariableSymbol) {
        if (symbol.member && symbol.member instanceof BslVariable) {
            symbol.member.setTypeValue(symbol)
        } else {
            symbol.member = GlobalScope.findMember(symbol.name)
            if (symbol.member?.type) {
                symbol.type = await symbol.member.type
            } else if (symbol.type && symbol.member && symbol.member instanceof BslVariable) {
                symbol.member.setTypeValue(symbol)
            }
        }
    }

    private initScope(symbol: VariablesScope) {
        this.localScope = new BaseScope([...symbol.vars, ...(this.codeModel?.methods ?? [])])
        this.fullScope.scopes = [this.localScope, ...GlobalScope.scopes]
    }

    protected async acceptItems(items: (CodeSymbol | undefined)[] | undefined) {
        if (items) {
            for (const item of items) {
                if (item) await this.accept(item)
            }
        }
    }

    protected async accept(symbol: CodeSymbol | undefined) {
        if (symbol && isAcceptable(symbol)) {
            await symbol.accept(this)
        }
    }
}