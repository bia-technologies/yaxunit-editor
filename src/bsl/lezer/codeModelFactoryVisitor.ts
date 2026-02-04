import { BslVisitor, SyntaxNode, hasChild } from "lezer-bsl"
import { BaseSymbol, SymbolPosition } from "@/common/codeModel"
import {
    ProcedureDefinitionSymbol,
    FunctionDefinitionSymbol,
    ParameterDefinitionSymbol,
    VariableDefinitionSymbol,
    ModuleVariableDefinitionSymbol,
    VariableSymbol,
    ConstSymbol,
    BinaryExpressionSymbol,
    UnaryExpressionSymbol,
    TernaryExpressionSymbol,
    MethodCallSymbol,
    PropertySymbol,
    AccessSequenceSymbol,
    ConstructorSymbol,
    AssignmentStatementSymbol,
    ReturnStatementSymbol,
    IfStatementSymbol,
    IfBranchSymbol,
    ElseBranchSymbol,
    WhileStatementSymbol,
    ForStatementSymbol,
    ForEachStatementSymbol,
    TryStatementSymbol,
    BreakStatementSymbol,
    ContinueStatementSymbol,
    GotoStatementSymbol,
    LabelStatementSymbol,
    AddHandlerStatementSymbol,
    RemoveHandlerStatementSymbol,
    ExecuteStatementSymbol,
    RiseErrorStatementSymbol,
    BaseExpressionSymbol
} from "../codeModel"
import { terms } from "lezer-bsl"

export class LezerCodeModelFactoryVisitor extends BslVisitor<BaseSymbol> {
    private symbols: BaseSymbol[] = []

    module(node: SyntaxNode, _source: string): BaseSymbol[] {
        this.symbols = []
        return super.module(node, _source)
            .filter(symbol => symbol !== undefined)
    }

    protected override visitProcedureDef(node: SyntaxNode): ProcedureDefinitionSymbol {
        const name = this.findChildText(node, terms.Name) || "UnknownProcedure"
        const symbol = new ProcedureDefinitionSymbol(this.nodePosition(node), name)

        symbol.isExport = hasChild(node, terms._export)
        symbol.params = this.getParameters(node)
        symbol.children = this.getStatements(node)

        this.symbols.push(symbol)
        return symbol
    }

    protected override visitFunctionDef(node: SyntaxNode): FunctionDefinitionSymbol {
        const name = this.findChildText(node, terms.Name) || "UnknownFunction"
        const symbol = new FunctionDefinitionSymbol(this.nodePosition(node), name)

        symbol.isExport = hasChild(node, terms._export)
        symbol.params = this.getParameters(node)
        symbol.children = this.getStatements(node)

        this.symbols.push(symbol)
        return symbol
    }

    protected override visitParam(node: SyntaxNode): ParameterDefinitionSymbol {
        const symbol =  new ParameterDefinitionSymbol(this.nodePosition(node), this.findChildText(node, terms.Name))
        symbol.byVal = hasChild(node, terms.val)
        return symbol
    }

    protected visitVarDecl(node: SyntaxNode): void {
        const symbol = new VariableDefinitionSymbol(this.nodePosition(node))
        const vars = this.getVariableSpecs(node)
        symbol.vars = vars
        this.symbols.push(symbol)
    }

    protected visitAssignmentStmt(node: SyntaxNode): void {
        const symbol = new AssignmentStatementSymbol(this.nodePosition(node))
        const expressions = this.getAllExpressions(node)
        if (expressions.length >= 2) {
            symbol.variable = expressions[0] as VariableSymbol
            symbol.expression = expressions[1]
        }
        this.symbols.push(symbol)
    }

    protected visitReturnStmt(node: SyntaxNode): void {
        const symbol = new ReturnStatementSymbol(this.nodePosition(node))
        symbol.expression = this.getFirstExpression(node)
        this.symbols.push(symbol)
    }

    protected visitIfStmt(node: SyntaxNode): void {
        const branches: IfBranchSymbol[] = []
        let elseBranch: ElseBranchSymbol | undefined

        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (child.type.id === terms._if || child.type.id === terms.elseIf) {
                const condition = this.getFirstExpression(child) || new VariableSymbol(this.nodePosition(child), "condition")
                const body = this.getStatements(child)
                const branch = new IfBranchSymbol(this.nodePosition(child), condition, body)
                branches.push(branch)
            } else if (child.type.id === terms._else) {
                const body = this.getStatements(child)
                elseBranch = new ElseBranchSymbol(this.nodePosition(child), body)
            }
        }

        const symbol = new IfStatementSymbol(this.nodePosition(node), branches, elseBranch)
        this.symbols.push(symbol)
    }

    protected visitWhileStmt(node: SyntaxNode): void {
        const condition = this.getFirstExpression(node) || new VariableSymbol(this.nodePosition(node), "condition")
        const body = this.getStatements(node)
        const symbol = new WhileStatementSymbol(this.nodePosition(node), condition, body)
        this.symbols.push(symbol)
    }

    protected visitForStmt(node: SyntaxNode): void {
        const variable = new VariableSymbol(this.nodePosition(node), "i")
        const start = new ConstSymbol(this.nodePosition(node), "1", "Number")
        const end = new ConstSymbol(this.nodePosition(node), "10", "Number")
        const body = this.getStatements(node)
        const symbol = new ForStatementSymbol(this.nodePosition(node), variable, start, end, body)
        this.symbols.push(symbol)
    }

    protected visitForEachStmt(node: SyntaxNode): void {
        const variable = new VariableSymbol(this.nodePosition(node), "item")
        const collection = new VariableSymbol(this.nodePosition(node), "collection")
        const body = this.getStatements(node)
        const symbol = new ForEachStatementSymbol(this.nodePosition(node), variable, collection, body)
        this.symbols.push(symbol)
    }

    protected visitTryStmt(node: SyntaxNode): void {
        const tryBody = this.getStatements(node)
        const exceptBody: BaseSymbol[] = []

        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (child.type.id === terms.except) {
                exceptBody.push(...this.getStatements(child))
            }
        }

        const symbol = new TryStatementSymbol(this.nodePosition(node), tryBody, exceptBody)
        this.symbols.push(symbol)
    }

    protected visitGotoStmt(node: SyntaxNode): void {
        const label = this.findChildText(node, terms.VariableName) || "UnknownLabel"
        const symbol = new GotoStatementSymbol(this.nodePosition(node), label)
        this.symbols.push(symbol)
    }

    protected visitLabelStmt(node: SyntaxNode): void {
        const label = this.findChildText(node, terms.VariableName) || "UnknownLabel"
        const symbol = new LabelStatementSymbol(this.nodePosition(node), label)
        this.symbols.push(symbol)
    }

    protected visitAddHandlerStmt(node: SyntaxNode): void {
        const expressions = this.getAllExpressions(node)
        const event = expressions[0] || new VariableSymbol(this.nodePosition(node), "event")
        const handler = expressions[1] || new VariableSymbol(this.nodePosition(node), "handler")
        const symbol = new AddHandlerStatementSymbol(this.nodePosition(node), event, handler)
        this.symbols.push(symbol)
    }

    protected visitRemoveHandlerStmt(node: SyntaxNode): void {
        const expressions = this.getAllExpressions(node)
        const event = expressions[0] || new VariableSymbol(this.nodePosition(node), "event")
        const handler = expressions[1] || new VariableSymbol(this.nodePosition(node), "handler")
        const symbol = new RemoveHandlerStatementSymbol(this.nodePosition(node), event, handler)
        this.symbols.push(symbol)
    }

    protected visitExecuteStmt(node: SyntaxNode): void {
        const text = this.getFirstExpression(node) || new VariableSymbol(this.nodePosition(node), "code")
        const symbol = new ExecuteStatementSymbol(this.nodePosition(node))
        symbol.text = text
        this.symbols.push(symbol)
    }

    protected visitRaiseStmt(node: SyntaxNode): void {
        const error = this.getFirstExpression(node) || new VariableSymbol(this.nodePosition(node), "error")
        const args = this.getAllExpressions(node).slice(1)
        const symbol = new RiseErrorStatementSymbol(this.nodePosition(node), error, args)
        this.symbols.push(symbol)
    }

    protected visitBreakStmt(node: SyntaxNode): void {
        const symbol = new BreakStatementSymbol(this.nodePosition(node))
        this.symbols.push(symbol)
    }

    protected visitContinueStmt(node: SyntaxNode): void {
        const symbol = new ContinueStatementSymbol(this.nodePosition(node))
        this.symbols.push(symbol)
    }

    protected visitBinaryExpr(node: SyntaxNode): void {
        const symbol = new BinaryExpressionSymbol(this.nodePosition(node))
        symbol.left = this.getFirstExpression(node)
        symbol.right = this.getLastExpression(node)
        symbol.operator = this.getOperator(node)
        this.symbols.push(symbol)
    }

    protected visitUnaryExpr(node: SyntaxNode): void {
        const symbol = new UnaryExpressionSymbol(this.nodePosition(node))
        symbol.operand = this.getFirstExpression(node)
        symbol.operator = this.getOperator(node)
        this.symbols.push(symbol)
    }

    protected visitTernaryExpr(node: SyntaxNode): void {
        const symbol = new TernaryExpressionSymbol(this.nodePosition(node))
        const expressions = this.getAllExpressions(node)
        if (expressions.length >= 3) {
            symbol.condition = expressions[0]
            symbol.consequence = expressions[1]
            symbol.alternative = expressions[2]
        }
        this.symbols.push(symbol)
    }

    protected visitCallExpr(node: SyntaxNode): void {
        const name = this.getMethodName(node) || "UnknownMethod"
        const symbol = new MethodCallSymbol(this.nodePosition(node), name)
        symbol.arguments = this.getArguments(node)
        this.symbols.push(symbol)
    }

    protected visitMemberExpr(node: SyntaxNode): void {
        const sequence = new AccessSequenceSymbol(this.nodePosition(node))
        sequence.access = this.buildAccessChain(node)
        this.symbols.push(sequence)
    }

    protected visitNewExpr(node: SyntaxNode): void {
        const typeName = this.getConstructorType(node) || "UnknownType"
        const symbol = new ConstructorSymbol(this.nodePosition(node), typeName)
        symbol.arguments = this.getArguments(node)
        this.symbols.push(symbol)
    }

    protected visitNumber(node: SyntaxNode): void {
        const value = this.source.slice(node.from, node.to)
        const symbol = new ConstSymbol(this.nodePosition(node), value, "Number")
        this.symbols.push(symbol)
    }

    protected visitString(node: SyntaxNode): void {
        const value = this.source.slice(node.from, node.to)
        const symbol = new ConstSymbol(this.nodePosition(node), value, "String")
        this.symbols.push(symbol)
    }

    protected visitVariableName(node: SyntaxNode): void {
        const name = this.source.slice(node.from, node.to)
        const symbol = new VariableSymbol(this.nodePosition(node), name)
        this.symbols.push(symbol)
    }

    private nodePosition(node: SyntaxNode): SymbolPosition {
        return {
            startOffset: node.from,
            endOffset: node.to
        }
    }

    private findChildText(node: SyntaxNode, termId: number): string | undefined {
        const child = node.getChild(termId)
        return child ? this.source.slice(child.from, child.to) : undefined
    }

    private findChild(node: SyntaxNode, termId: number): SyntaxNode | null {
        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (child.type.id === termId) return child
            const found = this.findChild(child, termId)
            if (found) return found
        }
        return null
    }

    private getParameters(node: SyntaxNode): ParameterDefinitionSymbol[] {
        const paramList = node.getChild(terms.ParamList)
        if (!paramList) return []

        return paramList.getChildren(terms.Param)
            .map(node => this.visit(node) as ParameterDefinitionSymbol)
    }

    private getVariableSpecs(node: SyntaxNode): VariableSymbol[] {
        const vars: VariableSymbol[] = []
        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (child.type.id === terms.VarSpec) {
                const name = this.findChildText(child, terms.VariableName) || "UnknownVar"
                const variable = new VariableSymbol(this.nodePosition(child), name)
                vars.push(variable)
            }
        }
        return vars
    }

    private getStatements(node: SyntaxNode): BaseSymbol[] {
        const statements: BaseSymbol[] = []
        const block = this.findChild(node, terms.Block)
        if (block) {
            for (let child = block.firstChild; child; child = child.nextSibling) {
                const childSymbols = this.visitNode(child)
                statements.push(...childSymbols)
            }
        }
        return statements
    }

    private visitNode(node: SyntaxNode): BaseSymbol[] {
        const visitor = new LezerCodeModelFactoryVisitor()
        return visitor.visit(node)
    }

    private getFirstExpression(node: SyntaxNode): BaseExpressionSymbol | undefined {
        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (this.isExpression(child)) {
                const symbols = this.visitNode(child)
                return symbols[0] as BaseExpressionSymbol
            }
        }
        return undefined
    }

    private getLastExpression(node: SyntaxNode): BaseExpressionSymbol | undefined {
        let lastExpr: BaseExpressionSymbol | undefined
        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (this.isExpression(child)) {
                const symbols = this.visitNode(child)
                lastExpr = symbols[0] as BaseExpressionSymbol
            }
        }
        return lastExpr
    }

    private getAllExpressions(node: SyntaxNode): BaseExpressionSymbol[] {
        const expressions: BaseExpressionSymbol[] = []
        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (this.isExpression(child)) {
                const symbols = this.visitNode(child)
                if (symbols[0]) expressions.push(symbols[0] as BaseExpressionSymbol)
            }
        }
        return expressions
    }

    private getOperator(node: SyntaxNode): string {
        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (this.isOperator(child)) {
                return this.source.slice(child.from, child.to)
            }
        }
        return ""
    }

    private getMethodName(node: SyntaxNode): string | null {
        return this.findChildText(node, terms.VariableName)
    }

    private getArguments(node: SyntaxNode): BaseExpressionSymbol[] {
        const argList = this.findChild(node, terms.ArgList)
        if (!argList) return []

        const args: BaseExpressionSymbol[] = []
        for (let child = argList.firstChild; child; child = child.nextSibling) {
            if (this.isExpression(child)) {
                const symbols = this.visitNode(child)
                if (symbols[0]) args.push(symbols[0] as BaseExpressionSymbol)
            }
        }
        return args
    }

    private buildAccessChain(node: SyntaxNode): (MethodCallSymbol | VariableSymbol | PropertySymbol)[] {
        const chain: (MethodCallSymbol | VariableSymbol | PropertySymbol)[] = []

        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (child.type.id === terms.VariableName) {
                const name = this.source.slice(child.from, child.to)
                const prop = new PropertySymbol(this.nodePosition(child), name)
                chain.push(prop)
            } else if (child.type.id === terms.CallExpr) {
                const name = this.getMethodName(child) || "UnknownMethod"
                const call = new MethodCallSymbol(this.nodePosition(child), name)
                call.arguments = this.getArguments(child)
                chain.push(call)
            }
        }

        return chain
    }

    private getConstructorType(node: SyntaxNode): string | null {
        return this.findChildText(node, terms.VariableName)
    }

    private isExpression(node: SyntaxNode): boolean {
        return [
            terms.BinaryExpr,
            terms.UnaryExpr,
            terms.TernaryExpr,
            terms.CallExpr,
            terms.MemberExpr,
            terms.NewExpr,
            terms.Number,
            terms.String,
            terms.VariableName,
            terms._true,
            terms._false,
            terms._null,
            terms.undefined
        ].includes(node.type.id)
    }

    private isOperator(node: SyntaxNode): boolean {
        return [
            terms.divide,
            terms.and,
            terms.or,
            terms.not
        ].includes(node.type.id)
    }
}
