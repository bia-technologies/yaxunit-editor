import { BaseTypes } from "@/bsl/scope/baseTypes";
import {
    AccessSequenceSymbol,
    AssignmentStatementSymbol,
    BinaryExpressionSymbol,
    BslCodeModel,
    BslVariable,
    FunctionDefinitionSymbol,
    IndexAccessSymbol,
    MethodCallSymbol,
    ProcedureDefinitionSymbol,
    VariableSymbol
} from "../model";
import { Operators, isCompareOperator } from "../model/operators"
import { BaseCodeModelVisitor, isAcceptable } from "../visitor"
import { BaseScope, GlobalScope, Scope, UnionScope } from "@/common/scope"
import { BaseSymbol, CodeSymbol } from "@/common/codeModel"
import { isVariablesScope, VariablesScope } from "../model/interfaces"

export class TypesCalculator extends BaseCodeModelVisitor {
    static readonly instance: TypesCalculator = new TypesCalculator()

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
        await this.acceptItems(model.children)
    }

    async visitProcedureDefinition(symbol: ProcedureDefinitionSymbol) {
        this.initScope(symbol)
        await this.acceptItems(symbol.children)
    }

    async visitFunctionDefinition(symbol: FunctionDefinitionSymbol) {
        this.initScope(symbol)
        await this.acceptItems(symbol.children)
    }

    private initScope(symbol: VariablesScope) {
        this.localScope = new BaseScope(symbol.vars)
        this.fullScope.scopes = [this.localScope, ...GlobalScope.scopes]
    }

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

    async visitVariableSymbol(symbol: VariableSymbol) {
        const member = this.findVar(symbol.name)
        if (member) {
            symbol.type = await member.type
            symbol.value = member.value
        }
    }

    async visitBinaryExpressionSymbol(symbol: BinaryExpressionSymbol) {
        await super.visitBinaryExpressionSymbol(symbol)

        if (!symbol.left || !symbol.right || !symbol.operator) {
            return
        }

        if (isCompareOperator(symbol.operator)) {
            symbol.type = BaseTypes.boolean
        } else if (symbol.operator === Operators.plus) {
            symbol.type = symbol.left.type
        }
    }

    async visitMethodCallSymbol(symbol: MethodCallSymbol) {
        symbol.member = GlobalScope.findMember(symbol.name)
        if (symbol.member?.type) {
            symbol.type = await symbol.member.type
        }
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
        symbol.type = parentType
    }

    findVar(name: string) {
        return this.localScope?.findMember(name) as BslVariable
    }

    private async handleVariable(symbol: VariableSymbol) {
        if (symbol.member && symbol.member instanceof BslVariable) {
            symbol.member.setTypeValue(symbol)
        } else {
            symbol.member = GlobalScope.findMember(symbol.name)
            if (symbol.member) {
                symbol.type = await symbol.member.type
            }
        }
    }

    protected async acceptItems(items: CodeSymbol[]) {
        for (const item of items) {
            await this.accept(item)
        }
    }

    protected async accept(symbol: CodeSymbol | undefined) {
        if (symbol && isAcceptable(symbol)) {
            await symbol.accept(this)
        }
    }
}