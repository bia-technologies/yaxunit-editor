import { BaseSymbol, SymbolPosition } from "@/common/codeModel"
import {
    AccessSequenceSymbol,
    AddHandlerStatementSymbol,
    AssignmentStatementSymbol,
    AwaitStatementSymbol,
    BaseExpressionSymbol,
    BinaryExpressionSymbol,
    BreakStatementSymbol,
    ConstructorSymbol,
    ConstSymbol,
    ContinueStatementSymbol,
    ElseBranchSymbol,
    EmptySymbol,
    ExecuteStatementSymbol,
    ForEachStatementSymbol,
    ForStatementSymbol,
    FunctionDefinitionSymbol,
    GotoStatementSymbol,
    IfBranchSymbol,
    IfStatementSymbol,
    IndexAccessSymbol,
    LabelStatementSymbol,
    MethodCallSymbol,
    ParameterDefinitionSymbol,
    ProcedureDefinitionSymbol,
    PropertySymbol,
    RemoveHandlerStatementSymbol,
    ReturnStatementSymbol,
    RiseErrorStatementSymbol,
    TernaryExpressionSymbol,
    TryStatementSymbol,
    UnaryExpressionSymbol,
    VariableDefinitionSymbol,
    VariableSymbol,
    WhileStatementSymbol
} from "../codeModel"

import { CstChildrenDictionary, CstElement, CstNode, CstNodeLocation, IToken } from "chevrotain"
import { BslVisitor } from "./parser"
import { BaseTypes } from "../scope/baseTypes"

export class CodeModelFactoryVisitor extends BslVisitor {

    module(ctx: CstChildrenDictionary) {
        const symbols: BaseSymbol[] = []
        if (ctx.procedure) {
            symbols.push(...this.visitAll(ctx.procedure))
        }
        if (ctx.function) {
            symbols.push(...this.visitAll(ctx.function))
        }
        if (ctx.statements) {
            symbols.push(...this.getStatements(ctx.statements))
        }
        sort(symbols)
        return symbols
    }

    getStatements(nodes: CstElement[] | CstElement): BaseSymbol[] {
        let statements: BaseSymbol[]
        if (Array.isArray(nodes)) {
            statements = this.statements((nodes[0] as CstNode).children).filter(s => s)
        } else if (nodes) {
            statements = this.statements((nodes as CstNode).children).filter(s => s)
        } else {
            statements = []
        }
        sort(statements)
        return statements
    }

    getArguments(nodes: CstElement[] | CstElement): BaseSymbol[] {
        if (!nodes) {
            return []
        }
        const node = (Array.isArray(nodes) ? nodes[0] : nodes) as CstNode
        const result = this.arguments(node.children, node.location as CstNodeLocation)
        return result ?? []
    }

    // #region module definitions
    procedure(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const name = firstTokenText(ctx.name)
        const symbol = new ProcedureDefinitionSymbol(nodePosition(location), name)

        symbol.isExport = ctx.Export !== undefined
        if (ctx.parameter) {
            symbol.params = this.visitAll(ctx.parameter) as ParameterDefinitionSymbol[]
        }
        symbol.children = this.getStatements(ctx.statements)
        return symbol
    }

    function(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const name = firstTokenText(ctx.name)
        const symbol = new FunctionDefinitionSymbol(nodePosition(location), name)

        symbol.isExport = ctx.Export !== undefined
        if (ctx.parameter) {
            symbol.params = this.visitAll(ctx.parameter) as ParameterDefinitionSymbol[]
        }
        symbol.children = this.getStatements(ctx.statements)
        return symbol
    }

    parameter(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const name = firstTokenText(ctx.name)
        const symbol = new ParameterDefinitionSymbol(nodePosition(location), name)
        symbol.byVal = ctx.Val !== undefined
        if (ctx.default) {
            symbol.defaultValue = this.visitFirst(ctx.default) as ConstSymbol
        }

        return symbol
    }
    // #endregion

    // #region statements
    statements(ctx: CstChildrenDictionary) {
        const result: BaseSymbol[] = []
        Object.values(ctx).forEach(nodes => result.push(...this.visitAll(nodes)))
        return result
    }

    assignmentStatement(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const qualifiedName = this.visitFirst(ctx.qualifiedName) as (VariableSymbol | AccessSequenceSymbol)
        if (ctx.Assign) {
            const symbol = new AssignmentStatementSymbol(nodePosition(location))

            symbol.variable = qualifiedName
            symbol.expression = this.visitFirst(ctx.expression)
            return symbol
        } else {
            return qualifiedName;
        }
    }

    executeStatement(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const symbol = new ExecuteStatementSymbol(nodePosition(location))
        symbol.text = this.visitFirst(ctx.expression)
        return symbol
    }

    returnStatement(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const symbol = new ReturnStatementSymbol(nodePosition(location))
        symbol.expression = this.visitFirst(ctx.expression)
        return symbol
    }

    tryStatement(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        return new TryStatementSymbol(nodePosition(location)
            , this.getStatements(ctx.statements)
            , this.getStatements(ctx.handler))
    }

    riseErrorStatement(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const error = this.visitFirst(ctx.expression)
        const args = this.getArguments(ctx.arguments)

        return new RiseErrorStatementSymbol(nodePosition(location), error as BaseExpressionSymbol, args)
    }

    varStatement(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const symbol = new VariableDefinitionSymbol(nodePosition(location));
        symbol.vars = (ctx.Identifier as IToken[]).map((token: IToken) => new VariableSymbol(tokenPosition(token), token.image))
        return symbol
    }

    // #region if statement
    ifStatement(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const branches = this.visitAll(ctx.branch)
        const elseBranch = this.visitFirst(ctx.elseBranch)
        return new IfStatementSymbol(nodePosition(location), branches as IfBranchSymbol[], elseBranch as ElseBranchSymbol)
    }

    ifBranch(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        return new IfBranchSymbol(nodePosition(location), this.visitFirst(ctx.condition) as BaseExpressionSymbol, this.getStatements(ctx.body))
    }

    elsifBranch(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        return new IfBranchSymbol(nodePosition(location),
            this.visitFirst(ctx.condition) as BaseExpressionSymbol,
            this.getStatements(ctx.body))
    }

    elseBranch(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        return new ElseBranchSymbol(nodePosition(location), this.getStatements(ctx.body))
    }
    // #endregion

    whileStatement(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        return new WhileStatementSymbol(nodePosition(location),
            this.visitFirst(ctx.expression) as BaseExpressionSymbol,
            this.getStatements(ctx.statements))
    }

    forStatement(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        return new ForStatementSymbol(nodePosition(location),
            createVariable(ctx.variable),
            this.visitFirst(ctx.start) as BaseExpressionSymbol,
            this.visitFirst(ctx.end) as BaseExpressionSymbol,
            this.getStatements(ctx.statements))
    }

    forEachStatement(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        return new ForEachStatementSymbol(nodePosition(location),
            createVariable(ctx.variable),
            this.visitFirst(ctx.collection) as BaseExpressionSymbol,
            this.getStatements(ctx.statements))
    }

    continueStatement(_: CstChildrenDictionary, location: CstNodeLocation) {
        return new ContinueStatementSymbol(nodePosition(location))
    }

    breakStatement(_: CstChildrenDictionary, location: CstNodeLocation) {
        return new BreakStatementSymbol(nodePosition(location))
    }

    gotoStatement(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const label = ctx.Identifier ? firstTokenText(ctx.Identifier) : ''
        return new GotoStatementSymbol(nodePosition(location), label)
    }

    labelStatement(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const label = ctx.Identifier ? firstTokenText(ctx.Identifier) : ''
        return new LabelStatementSymbol(nodePosition(location), label)
    }

    addHandlerStatement(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        return new AddHandlerStatementSymbol(nodePosition(location),
            this.visitFirst(ctx.event) as BaseExpressionSymbol,
            this.visitFirst(ctx.handler) as BaseExpressionSymbol)
    }

    removeHandlerStatement(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        return new RemoveHandlerStatementSymbol(nodePosition(location),
            this.visitFirst(ctx.event) as BaseExpressionSymbol,
            this.visitFirst(ctx.handler) as BaseExpressionSymbol)
    }

    awaitStatement(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        return new AwaitStatementSymbol(nodePosition(location), this.visitFirst(ctx.expression) as BaseExpressionSymbol)
    }
    // #endregion

    // #region preprocessor and annotations
    preprocessor() { }
    // #endregion

    // #region expressions
    expression(ctx: CstChildrenDictionary) {
        if (ctx.constructorExpression) {
            return this.visitFirst(ctx.constructorExpression)
        } else if (ctx.constructorMethodExpression) {
            return this.visitFirst(ctx.constructorMethodExpression)
        } else if (ctx.constructorBad) {
            return this.visitFirst(ctx.constructorBad)
        } else if (ctx.logicalOrExpression) {
            return this.visitFirst(ctx.logicalOrExpression)
        }
    }

    additionExpression(ctx: CstChildrenDictionary) {
        return this.createBinaryExpression(ctx)
    }

    multiplicationExpression(ctx: CstChildrenDictionary) {
        return this.createBinaryExpression(ctx)
    }

    compareExpression(ctx: CstChildrenDictionary) {
        return this.createBinaryExpression(ctx)
    }

    logicalAndExpression(ctx: CstChildrenDictionary) {
        return this.createBinaryExpression(ctx)
    }

    logicalOrExpression(ctx: CstChildrenDictionary) {
        return this.createBinaryExpression(ctx)
    }

    parenthesisExpression(ctx: CstChildrenDictionary) {
        return this.visitFirst(ctx.expression)
    }

    ternaryExpression(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const symbol = new TernaryExpressionSymbol(nodePosition(location))
        symbol.condition = this.visitFirst(ctx.condition)
        symbol.consequence = this.visitFirst(ctx.consequence)
        symbol.alternative = this.visitFirst(ctx.alternative)

        return symbol
    }

    // #endregion

    operand(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        let symbol: BaseSymbol | undefined

        if (ctx.literal) {
            symbol = this.visitFirst(ctx.literal)
        } else if (ctx.qualifiedName) {
            symbol = this.visitFirst(ctx.qualifiedName)
        } else if (ctx.parenthesisExpression) {
            symbol = this.visitFirst(ctx.parenthesisExpression)
        } else if (ctx.ternaryExpression) {
            return this.visitFirst(ctx.ternaryExpression)
        }
        let modifier: string | undefined;
        if (ctx.Minus) {
            modifier = '-'
        } else if (ctx.Not) {
            modifier = firstTokenText(ctx.Not)
        }
        if (modifier) {
            const unaryExpression = new UnaryExpressionSymbol(nodePosition(location))
            unaryExpression.operator = modifier
            unaryExpression.operand = symbol
            return unaryExpression
        } else {
            return symbol
        }
    }

    literal(ctx: CstChildrenDictionary) {
        const token = BslVisitor.firstToken(ctx)
        if (!token) {
            return undefined
        }
        switch (token.tokenType.name) {
            case 'Number':
                return new ConstSymbol(tokenPosition(token), token.image, BaseTypes.number)
            case 'Date':
                return new ConstSymbol(tokenPosition(token), trimChar(token.image, "'").replace(/\D/g, ''), BaseTypes.date)
            case 'Undefined':
                return new ConstSymbol(tokenPosition(token), token.image, BaseTypes.undefined)
            case 'String':
            case 'UnclosingString':
                return new ConstSymbol(tokenPosition(token), trimChar(token.image, '"'), BaseTypes.string)
            case 'MultilineString':
                return new ConstSymbol(tokenPosition(token), multilineStringContent(token.image), BaseTypes.string)
            case 'Null':
                return new ConstSymbol(tokenPosition(token), token.image, BaseTypes.null)
            case 'True':
            case 'False':
                return new ConstSymbol(tokenPosition(token), token.image, BaseTypes.boolean)
            default:
                return new ConstSymbol(tokenPosition(token), token.image, BaseTypes.unknown)
        }
    }

    qualifiedName(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        let symbols: any[] = []

        if (ctx.variable) {
            symbols.push(createVariable(ctx.variable))
        }

        if (ctx.methodCall) {
            symbols.push(...this.visitAll(ctx.methodCall))
        }

        if (ctx.Identifier) {
            symbols.push(...Properties(ctx.Identifier as IToken[]))
        }

        if (ctx.indexAccess) {
            symbols.push(...this.visitAll(ctx.indexAccess))
        }

        const unclosed = ctx.UNCLOSED !== undefined

        if (symbols.length === 0) {
            return undefined
        } else if (symbols.length === 1 && !unclosed) {
            return symbols[0]
        }

        symbols = symbols.sort((s1: BaseSymbol, s2: BaseSymbol) => s1.startOffset - s2.startOffset)
        const symbol = new AccessSequenceSymbol(nodePosition(location))
        symbol.access = symbols
        symbol.unclosed = unclosed
        return symbol
    }

    methodCall(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const name = firstTokenText(ctx.Identifier)
        const symbol = new MethodCallSymbol(nodePosition(location), name)
        if (ctx.arguments) {
            symbol.arguments = this.getArguments(ctx.arguments)
        }
        return symbol
    }

    methodCall2 = this.methodCall

    indexAccess(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const symbol = new IndexAccessSymbol(nodePosition(location))
        symbol.index = this.visitFirst(ctx.index)
        return symbol
    }

    constructorExpression(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const name = ctx.Identifier ? firstTokenText(ctx.Identifier) : ''
        const symbol = new ConstructorSymbol(nodePosition(location), name, name)
        if (ctx.arguments) {
            symbol.arguments = this.visitFirst(ctx.arguments)
        }
        return symbol
    }

    constructorMethodExpression(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const type = this.visitFirst(ctx.type)
        const args = this.visitFirst(ctx.arguments)
        let symbol: ConstructorSymbol

        if (type instanceof ConstSymbol && type.type === BaseTypes.string) {
            symbol = new ConstructorSymbol(nodePosition(location), type.value, type.value)
        } else {
            symbol = new ConstructorSymbol(nodePosition(location), type as BaseExpressionSymbol)
        }
        symbol.arguments = args
        return symbol
    }

    constructorBad(_: CstChildrenDictionary, location: CstNodeLocation) {
        return new ConstructorSymbol(nodePosition(location), '')
    }

    arguments(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        if (!ctx.argument && !ctx.Comma) {
            return []
        }

        if (!ctx.Comma) {
            const args = this.visitAll(ctx.argument)
            if (args.length > 1 || args[0]) {
                return args
            } else {
                return []
            }
        }

        const args: BaseSymbol[] = []
        const commas = ctx.Comma
        let leftPosition = location.startOffset + 1 // TODO use LPAREN

        commas.forEach((comma, idx) => {
            let arg = this.visit(ctx.argument[idx] as CstNode)
            const commaPosition = (comma as IToken).startOffset
            if (!arg) {
                arg = new EmptySymbol({ startOffset: leftPosition, endOffset: commaPosition })
            } else {
                arg.position.startOffset = leftPosition
            }
            leftPosition = commaPosition + 1
            args.push(arg)
        })
        let arg = this.visit(ctx.argument[commas.length] as CstNode)
        if (!arg) {
            arg = new EmptySymbol({ startOffset: leftPosition, endOffset: (location.endOffset ?? 0) + 1 })
        } else {
            arg.position.startOffset = leftPosition
        }
        args.push(arg)

        return args
    }

    argument(ctx: CstChildrenDictionary) {
        if (ctx.expression) {
            return this.visitFirst(ctx.expression)
        } else {
            return undefined
        }
    }

    createBinaryExpression(ctx: CstChildrenDictionary) {
        let result: BaseSymbol = this.visitFirst(ctx.lhs) as BaseSymbol
        try {
            if (ctx.rhs) {
                const operators = ctx.operator

                ctx.rhs.forEach((rhsOperand, idx) => {
                    // there will be one operator for each rhs operand
                    let rhsValue = this.visit(rhsOperand as CstNode)
                    let operator = operators[idx] as IToken

                    const symbol = new BinaryExpressionSymbol({ startOffset: result.startOffset, endOffset: rhsValue?.endOffset ?? operator.endOffset })
                    symbol.left = result
                    symbol.right = rhsValue
                    symbol.operator = (operator as IToken).image
                    result = symbol
                })
            }
        } catch (error) {
            console.error('binary expression error', ctx.lhs, error)
        }
        return result
    }
}

function firstToken(tokens: CstElement[]) {
    return tokens[0] as IToken
}

function firstTokenText(tokens: CstElement[]) {
    return (tokens[0] as IToken).image
}

function Properties(value: IToken[]): PropertySymbol[] {
    return value.map(token => new PropertySymbol(tokenPosition(token), token.image))
}

function createVariable(tokens: CstElement[]) {
    const token = firstToken(tokens)
    return new VariableSymbol(tokenPosition(token), token.image)
}

function tokenPosition(token: IToken): SymbolPosition {
    return {
        startOffset: token.startOffset, endOffset: (token.endOffset ?? 0) + 1
    }
}

function nodePosition(nodeLocation: CstNodeLocation): SymbolPosition {
    return { startOffset: nodeLocation.startOffset, endOffset: (nodeLocation.endOffset ?? 0) + 1 }
}

function trimChar(value: string, char: string) {
    if (value.startsWith(char) && value.endsWith(char)) {
        return value.substring(1, value.length - 1)
    } else if (value.startsWith(char)) {
        return value.substring(1)
    } else if (value.endsWith(char)) {
        return value.substring(0, value.length - 1)
    } else {
        return value
    }
}

/**
 * Cleans up a multiline string literal by removing its enclosing quotes and optional line prefixes.
 *
 * This function removes surrounding double quotes, splits the string into lines, and left-trims each line.
 * If a trimmed line begins with a pipe ('|'), that character is removed. The processed lines are then rejoined
 * using newline characters to produce the final content.
 *
 * @param value - The multiline string literal to process.
 * @returns The cleaned multiline string content.
 */
function multilineStringContent(value: string): string {
    value = trimChar(value, '"')
    const lines = value.split('\n')
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index].trimLeft();
        if (line.startsWith('|')) {
            lines[index] = line.substring(1)
        } else {
            lines[index] = line
        }
    }
    return lines.join('\n')
}

function sort(symbols: BaseSymbol[]) {
    symbols.sort((s1, s2) => {
        return s1.startOffset - s2.startOffset
    })

}