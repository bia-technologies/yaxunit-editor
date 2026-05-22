import { BslVisitor, SyntaxNode, getChildText, getChildren, hasChild } from "lezer-bsl"
import { BaseSymbol, SymbolPosition } from "@/common/codeModel"
import {
    ProcedureDefinitionSymbol,
    FunctionDefinitionSymbol,
    ParameterDefinitionSymbol,
    VariableDefinitionSymbol,
    VariableSymbol,
    ConstSymbol,
    BinaryExpressionSymbol,
    UnaryExpressionSymbol,
    TernaryExpressionSymbol,
    MethodCallSymbol,
    PropertySymbol,
    IndexAccessSymbol,
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
    AwaitStatementSymbol,
    BaseExpressionSymbol,
    AccessProperty,
    EmptySymbol
} from "../../codeModel"
import { terms } from "lezer-bsl"
import { getNodeText } from "../utils"

export class LezerCodeModelFactoryVisitor extends BslVisitor<BaseSymbol> {
    module(node: SyntaxNode, _source: string): BaseSymbol[] {
        this.source = _source
        const results: BaseSymbol[] = []

        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (child.type.id === terms.ModuleBlock) {
                // For ModuleBlock, we want to get all its statement children
                for (let stmt = child.firstChild; stmt; stmt = stmt.nextSibling) {
                    const symbol = this.visit(stmt)
                    if (symbol) results.push(symbol)
                }
            } else {
                const symbol = this.visit(child)
                if (symbol) results.push(symbol)
            }
        }

        return results
    }

    //#region definitions

    protected override visitProcedureDef(node: SyntaxNode): ProcedureDefinitionSymbol {
        const name = getChildText(node, terms.Name, this.source) || "UnknownProcedure"
        const symbol = new ProcedureDefinitionSymbol(nodePosition(node), name)

        symbol.isExport = hasChild(node, terms._export)
        symbol.params = this.getParameters(node)
        symbol.children = this.getStatements(node)

        return symbol
    }

    protected override visitFunctionDef(node: SyntaxNode): FunctionDefinitionSymbol {
        const name = getChildText(node, terms.Name, this.source) || "UnknownFunction"
        const symbol = new FunctionDefinitionSymbol(nodePosition(node), name)

        symbol.isExport = hasChild(node, terms._export)
        symbol.params = this.getParameters(node)
        symbol.children = this.getStatements(node)

        return symbol
    }

    protected override visitVarDecl(node: SyntaxNode): BaseSymbol {
        const symbol = new VariableDefinitionSymbol(nodePosition(node))
        symbol.vars = node.getChildren(terms.VarSpec)
            .map(_ => this.visit(_))
            .filter(_ => _ !== undefined) as VariableSymbol[]

        return symbol
    }

    protected override visitVarSpec(node: SyntaxNode): BaseSymbol {
        const name = getChildText(node, terms.VariableName, this.source) || "UnknownVar"
        return new VariableSymbol(nodePosition(node), name)
    }

    //#endregion

    //#region statements
    protected override visitCallStmt(node: SyntaxNode): BaseSymbol {
        const path = getChildren(node)
            .map(_ => this.visit(_))
            .filter(_ => _ !== undefined)

        if (path.length == 1) {
            if (path[0] instanceof MethodCallSymbol) {
                return path[0]
            }
            if (path[0] instanceof AccessSequenceSymbol) {
                return path[0]
            }
        }

        const sequence = new AccessSequenceSymbol(nodePosition(node))
        sequence.access = path.filter(_ => _ !== undefined) as AccessProperty[]
        return sequence
    }

    protected override visitAssignmentStmt(node: SyntaxNode): BaseSymbol {
        const symbol = new AssignmentStatementSymbol(nodePosition(node))

        const memberNode = getChildren(node).find(_ => _.type.id === terms.MemberPath)
        const expressionNode = this.getFirstExpressionAfter(node, "AssignOp")

        if (expressionNode) {
            symbol.expression = this.visit(expressionNode) as BaseExpressionSymbol
        }

        if (memberNode) {
            symbol.variable = this.visit(memberNode) as VariableSymbol | AccessSequenceSymbol | undefined
        }

        return symbol
    }

    protected override visitReturnStmt(node: SyntaxNode): BaseSymbol {
        const symbol = new ReturnStatementSymbol(nodePosition(node))
        symbol.expression = this.nestedExpression(node)

        return symbol
    }

    protected override visitIfStmt(node: SyntaxNode): BaseSymbol {
        const branchNodes = getChildren(node)
            .filter(_ => _.type.is("IfBranch") || _.type.is("ElseIfBranch") || _.type.is("ElseBranch"))
        const branches: IfBranchSymbol[] = []
        let elseBranch: ElseBranchSymbol | undefined

        for (const branchNode of branchNodes) {
            if (branchNode.type.is("IfBranch") || branchNode.type.is("ElseIfBranch")) {
                const condition = this.nestedExpression(branchNode.getChild("Condition")) as BaseExpressionSymbol
                const body = this.getStatements(branchNode)
                const branch = new IfBranchSymbol(nodePosition(branchNode), condition, body)
                branches.push(branch)
            } else {
                elseBranch = new ElseBranchSymbol(nodePosition(branchNode), this.getStatements(branchNode))
            }
        }

        return new IfStatementSymbol(nodePosition(node), branches, elseBranch)
    }

    protected override visitWhileStmt(node: SyntaxNode): BaseSymbol {
        const condition = this.nestedExpression(node.getChild("Condition")) as BaseExpressionSymbol
        const body = this.getStatements(node)

        return new WhileStatementSymbol(nodePosition(node), condition, body)
    }

    protected override visitForStmt(node: SyntaxNode): BaseSymbol {
        const varName = getChildText(node, terms.VariableName, this.source) as string
        const variable = new VariableSymbol(nodePosition(node), varName)

        const start = this.nestedExpression(node.getChild("Start")) as BaseExpressionSymbol
        const end = this.nestedExpression(node.getChild("End")) as BaseExpressionSymbol
        const body = this.getStatements(node)

        return new ForStatementSymbol(nodePosition(node), variable, start, end, body)
    }

    protected override visitForEachStmt(node: SyntaxNode): BaseSymbol {
        const varName = getChildText(node, terms.VariableName, this.source) as string
        const variable = new VariableSymbol(nodePosition(node), varName)

        const collection = this.nestedExpression(node.getChild("Collection")) as BaseExpressionSymbol
        const body = this.getStatements(node)

        return new ForEachStatementSymbol(nodePosition(node), variable, collection, body)
    }

    protected override visitTryStmt(node: SyntaxNode): BaseSymbol {
        const tryBody = this.getStatements(node.getChild(terms.Block, "try"))
        const exceptBody = this.getStatements(node.getChild(terms.Block, "except"))

        return new TryStatementSymbol(nodePosition(node), tryBody, exceptBody)
    }

    protected override visitGotoStmt(node: SyntaxNode): BaseSymbol {
        const label = getChildText(node, terms.LabelName, this.source) || "UnknownLabel"
        return new GotoStatementSymbol(nodePosition(node), label)
    }

    protected override visitLabelStmt(node: SyntaxNode): BaseSymbol {
        const label = getChildText(node, terms.LabelName, this.source) || "UnknownLabel"
        return new LabelStatementSymbol(nodePosition(node), label)
    }

    protected override visitAddHandlerStmt(node: SyntaxNode): BaseSymbol {
        const event = this.nestedExpression(node.getChild("Event")) as BaseExpressionSymbol
        const handler = this.nestedExpression(node.getChild("Handler")) as BaseExpressionSymbol

        return new AddHandlerStatementSymbol(nodePosition(node), event, handler)
    }

    protected override visitRemoveHandlerStmt(node: SyntaxNode): BaseSymbol {
        const event = this.nestedExpression(node.getChild("Event")) as BaseExpressionSymbol
        const handler = this.nestedExpression(node.getChild("Handler")) as BaseExpressionSymbol
        
        return new RemoveHandlerStatementSymbol(nodePosition(node), event, handler)
    }

    protected override visitExecuteStmt(node: SyntaxNode): BaseSymbol {
        const text = this.getFirstExpression(node) || new VariableSymbol(nodePosition(node), "code")
        const symbol = new ExecuteStatementSymbol(nodePosition(node))
        symbol.text = text

        return symbol
    }

    protected override visitRaiseStmt(node: SyntaxNode): BaseSymbol {
        const error = this.getFirstExpression(node) || new VariableSymbol(nodePosition(node), "error")
        const args = this.getAllExpressions(node).slice(1)
        return new RiseErrorStatementSymbol(nodePosition(node), error, args)
    }

    protected override visitBreakStmt(node: SyntaxNode): BaseSymbol {
        return new BreakStatementSymbol(nodePosition(node))
    }

    protected override visitContinueStmt(node: SyntaxNode): BaseSymbol {
        return new ContinueStatementSymbol(nodePosition(node))
    }

    protected override visitAwaitStmt(node: SyntaxNode): BaseSymbol {
        return this.visit(node.getChild(terms.AwaitExpr)) as BaseSymbol
    }

    //#endregion

    //#region expressions
    protected override visitBinaryExpr(node: SyntaxNode): BaseSymbol {
        const symbol = new BinaryExpressionSymbol(nodePosition(node))
        const expressions = getChildren(node)
            .filter(isBslExpression)
            .map(_ => this.visit(_))
        symbol.left = expressions[0]
        symbol.right = expressions[1]
        symbol.operator = this.getOperator(node)

        return symbol
    }

    protected override visitUnaryExpr(node: SyntaxNode): BaseSymbol {
        const symbol = new UnaryExpressionSymbol(nodePosition(node))
        symbol.operand = this.nestedExpression(node)
        symbol.operator = this.getOperator(node)

        return symbol
    }

    protected override visitTernaryExpr(node: SyntaxNode): BaseSymbol {
        const symbol = new TernaryExpressionSymbol(nodePosition(node))
        const expressions = getChildren(node)
            .filter(isBslExpression)
            .map(_ => this.visit(_))

        symbol.condition = expressions[0]
        symbol.consequence = expressions[1]
        symbol.alternative = expressions[2]

        return symbol
    }

    protected override visitCallExpr(node: SyntaxNode): BaseSymbol {
        const name = getNodeText(node.getChild(terms.Name) ?? node.getChild(terms.PropertyName), this.source) || "UnknownMethod"
        const symbol = new MethodCallSymbol(nodePosition(node), name)

        symbol.arguments = this.collectArguments(node.getChild(terms.ArgList))

        return symbol
    }

    protected override visitNewExpr(node: SyntaxNode): BaseSymbol {
        const typeNameNode = node.getChild("TypeName")
        const argumentsNode = node.getChild("ArgList")

        const typeName = getNodeText(typeNameNode, this.source)!!
        const args = this.collectArguments(argumentsNode)

        const symbol = new ConstructorSymbol(nodePosition(node), typeName || "UnknownType")
        symbol.arguments = args
        return symbol
    }

    protected override visitNewMethodExpr(node: SyntaxNode): BaseSymbol {
        const typeNameNode = node.getChild("TypeName")
        const argumentsNode = node.getChild("Expression", "Comma")

        let typeName = typeNameNode ? this.nestedExpression(typeNameNode)!! : "UnknownType"
        const args = argumentsNode ? this.visit(argumentsNode) : undefined

        if (typeName instanceof ConstSymbol && typeName.type === "Строка") {
            typeName = typeName.value
        }

        const symbol = new ConstructorSymbol(nodePosition(node), typeName)
        symbol.arguments = args
        return symbol
    }

    protected override visitAwaitExpr(node: SyntaxNode): BaseSymbol {
        const expression = this.nestedExpression(node) as BaseExpressionSymbol
        return new AwaitStatementSymbol(nodePosition(node), expression)
    }

    protected override visitParenthesizedExpr(node: SyntaxNode): BaseSymbol | undefined {
        return this.nestedExpression(node)
    }

    //#endregion

    //#region literals
    protected override visitNumber(node: SyntaxNode): BaseSymbol {
        const value = getNodeText(node, this.source)!!
        return new ConstSymbol(nodePosition(node), value, "Число")
    }

    protected override visitBoolean(node: SyntaxNode): BaseSymbol {
        const value = getNodeText(node, this.source)!!
        return new ConstSymbol(nodePosition(node), value, "Булево")
    }

    protected override visitString(node: SyntaxNode): BaseSymbol {
        const raw = getNodeText(node, this.source)!!
        const value = raw.slice(1, -1).replace(/\n\|/g, '\n')
        return new ConstSymbol(nodePosition(node), value, "Строка")
    }

    protected override visitMultilineString(node: SyntaxNode): BaseSymbol {
        const raw = getNodeText(node, this.source)!!
        const value = raw.slice(1, -1).replace(/\n\|/g, '\n')
        return new ConstSymbol(nodePosition(node), value, "Строка")
    }

    protected override visitDate(node: SyntaxNode): BaseSymbol {
        const raw = getNodeText(node, this.source)!!
        const value = raw.slice(1, -1).replace(/[^\d]/g, '')
        return new ConstSymbol(nodePosition(node), value, "Дата")
    }

    protected override visitUndefined(node: SyntaxNode): BaseSymbol {
        const value = getNodeText(node, this.source)!!
        return new ConstSymbol(nodePosition(node), value, "Неопределено")
    }

    protected override visitNull(node: SyntaxNode): BaseSymbol {
        const value = getNodeText(node, this.source)!!
        return new ConstSymbol(nodePosition(node), value, "Null")
    }

    protected override visitParam(node: SyntaxNode): ParameterDefinitionSymbol {
        const name = getChildText(node, terms.Name, this.source)
        const defaultValue = this.nestedExpression(node) as ConstSymbol | undefined

        const symbol = new ParameterDefinitionSymbol(nodePosition(node), name)
        symbol.byVal = hasChild(node, terms.val)

        symbol.defaultValue = defaultValue

        return symbol
    }
    //#endregion

    protected override visitMemberPath(node: SyntaxNode): BaseSymbol {
        const children = getChildren(node)
        const path: AccessProperty[] = []

        for (let index = 0; index < children.length; index++) {
            const child = children[index]

            if (child.type.id === terms.VariableName) {
                const next = children[index + 1]
                if (next?.type.id === terms.ArgList) {
                    path.push(this.methodCallFromNameAndArgs(child, next))
                    index++
                } else {
                    path.push(this.visit(child) as AccessProperty)
                }
                continue
            }

            const symbol = this.visit(child)
            if (symbol) {
                path.push(symbol as AccessProperty)
            }
        }

        if (path.length == 1) {
            if (path[0] instanceof VariableSymbol) {
                return path[0]
            }
            if (path[0] instanceof MethodCallSymbol) {
                return path[0]
            }
        }

        const sequence = new AccessSequenceSymbol(nodePosition(node))
        sequence.access = path.filter(_ => _ !== undefined) as AccessProperty[]
        return sequence
    }

    protected override visitVariableName(node: SyntaxNode): BaseSymbol {
        const name = getNodeText(node, this.source)!!
        // if (name.toLowerCase() === 'null') {
        //     return new ConstSymbol(nodePosition(node), 'null', 'Null')
        // }
        // if (name.toLowerCase() === 'неопределено' || name.toLowerCase() === 'undefined') {
        //     return new ConstSymbol(nodePosition(node), 'неопределено', 'Неопределено')
        // }
        // if (name.toLowerCase() === 'true' || name.toLowerCase() === 'истина') {
        //     return new ConstSymbol(nodePosition(node), 'true', 'Булево')
        // }
        // if (name.toLowerCase() === 'false' || name.toLowerCase() === 'ложь') {
        //     return new ConstSymbol(nodePosition(node), 'false', 'Булево')
        // }
        return new VariableSymbol(nodePosition(node), name)
    }

    protected override visitPropertyName(node: SyntaxNode): BaseSymbol {
        return new PropertySymbol(nodePosition(node), getNodeText(node, this.source)!!)
    }

    protected override visitIndex(node: SyntaxNode): BaseSymbol {
        return new IndexAccessSymbol(nodePosition(node), this.nestedExpression(node))
    }

    protected override visitEmptyArg(node: SyntaxNode): BaseSymbol {
        return new EmptySymbol(nodePosition(node))
    }

    private getStatements(node: SyntaxNode | null): BaseSymbol[] {
        if (!node) return []

        const block = node.type.is(terms.Block) ? node : node.getChild(terms.Block)

        if (block) {
            return getChildren(block)
                .map(_ => this.visit(_))
                .filter(_ => _ !== undefined)
        }
        return []
    }

    private getFirstExpression(node: SyntaxNode): BaseExpressionSymbol | undefined {
        const firstExpression = getChildren(node)
            .find(isBslExpression)
        if (firstExpression) {
            return this.visit(firstExpression)
        } else {
            return undefined
        }
    }

    private getAllExpressions(node: SyntaxNode): BaseExpressionSymbol[] {
        return getChildren(node)
            .filter(isBslExpression)
            .map(_ => this.visit(_))
            .filter(_ => _ !== undefined)
    }

    private getOperator(node: SyntaxNode): string {
        const operator = node.getChild("Operator")
        return operator ? getNodeText(operator, this.source)!! : ""
    }

    private getParameters(node: SyntaxNode): ParameterDefinitionSymbol[] {
        const paramList = node.getChild(terms.ParamList)
        if (!paramList) return []

        return paramList.getChildren(terms.Param)
            .map(_ => this.visit(_))
            .filter(_ => _ !== undefined) as ParameterDefinitionSymbol[]
    }

    private collectArguments(argListNode: SyntaxNode | null | undefined) {
        if (!argListNode) {
            return []
        }

        const argsNode = argListNode.type.is(terms.ArgList) ? argListNode.getChild(terms.Arguments) : argListNode

        const args = this.visitChildren(argsNode)
            .filter(_ => _ !== undefined)

        if (args.length == 1 && args[0] instanceof EmptySymbol) {
            return []
        } else {
            return args
        }
    }

    private nestedExpression(node: SyntaxNode | null) {
        const expression = this.findFirstNestedExpression(node)
        return expression ? this.visit(expression) as BaseExpressionSymbol : undefined
    }

    private getFirstExpressionAfter(node: SyntaxNode, markerTypeName: string): SyntaxNode | undefined {
        let foundMarker = false
        for (const child of getChildren(node)) {
            if (foundMarker && isBslExpression(child)) {
                return child
            }
            foundMarker ||= child.type.name === markerTypeName
        }
        return undefined
    }

    private findFirstNestedExpression(node: SyntaxNode | null): SyntaxNode | undefined {
        if (!node) return undefined

        for (const child of getChildren(node)) {
            if (isBslExpression(child)) {
                return child
            }
            const nested = this.findFirstNestedExpression(child)
            if (nested) {
                return nested
            }
        }

        return undefined
    }

    private methodCallFromNameAndArgs(nameNode: SyntaxNode, argListNode: SyntaxNode): MethodCallSymbol {
        const name = getNodeText(nameNode, this.source) || "UnknownMethod"
        const symbol = new MethodCallSymbol(nodePosition(nameNode), name)
        symbol.arguments = this.collectArguments(argListNode)
        return symbol
    }
}

function nodePosition(node: SyntaxNode): SymbolPosition {
    return {
        startOffset: node.from,
        endOffset: node.to
    }
}

function isBslExpression(node: SyntaxNode): boolean {
    return [
        terms.BinaryExpr,
        terms.UnaryExpr,
        terms.TernaryExpr,
        terms.CallExpr,
        terms.MemberPath,
        terms.NewExpr,
        terms.NewMethodExpr,
        terms.AwaitExpr,
        terms.ParenthesizedExpr,
        terms.Number,
        terms.String,
        terms.MultilineString,
        terms.Date,
        terms.VariableName,
        terms.bool,
        terms._null,
        terms.undefined
    ].includes(node.type.id)
}
