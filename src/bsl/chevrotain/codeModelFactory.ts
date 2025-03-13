import { isModel } from "@/monaco/utils"
import { ModuleModel } from "../moduleModel"
import { parseModule, BslVisitor } from "./parser"
import {
    AccessSequenceSymbol,
    AssignmentStatementSymbol,
    BaseExpressionSymbol,
    BinaryExpressionSymbol,
    BslCodeModel,
    ConstructorSymbol,
    ConstSymbol,
    FunctionDefinitionSymbol,
    IndexAccessSymbol,
    MethodCallSymbol,
    ParameterDefinitionSymbol,
    ProcedureDefinitionSymbol,
    PropertySymbol,
    TernaryExpressionSymbol,
    UnaryExpressionSymbol,
    VariableSymbol
} from "../codeModel"
import { CstChildrenDictionary, CstElement, CstNode, CstNodeLocation, IToken } from "chevrotain"
import { BaseSymbol, SymbolPosition } from "@/common/codeModel"
import { BaseTypes } from "../scope/baseTypes"

export const ChevrotainSitterCodeModelFactory = {
    buildModel(model: ModuleModel | string): BslCodeModel {
        const codeModel = new BslCodeModel()
        this.updateModel(codeModel, model)
        return codeModel
    },

    updateModel(codeModel: BslCodeModel, model: ModuleModel | string): void {
        const start = performance.now()

        codeModel.children.length = 0 // Clear
        const tree = parseModule(isModel(model) ? model.getValue() : model)

        tree.lexErrors.forEach(e => console.error('lexError', e))
        tree.parseErrors.forEach(e => console.error('parseError', e))

        const visitor = new CodeModelFactoryVisitor()
        const children = visitor.visit(tree.cst)

        if (Array.isArray(children)) {
            codeModel.children.push(...children)
        } else if (children) {
            codeModel.children.push(children)
        }
        console.debug('Build code model by chevrotain', performance.now() - start, 'ms')
    }
}

class CodeModelFactoryVisitor extends BslVisitor {

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
        return symbols
    }

    getStatements(nodes: CstElement[]): BaseSymbol[] {
        return this.statements((nodes[0] as CstNode).children).filter(s => s)
    }

    statements(ctx: CstChildrenDictionary) {
        return Object.values(ctx).flatMap(nodes => this.visitAll(nodes))
    }

    procedure(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const symbol = new ProcedureDefinitionSymbol(nodePosition(location))
        symbol.name = firstTokenText(ctx.name)
        symbol.isExport = ctx.Export !== undefined
        if (ctx.parameter) {
            symbol.params = this.visitAll(ctx.parameter) as ParameterDefinitionSymbol[]
        }
        symbol.children = this.getStatements(ctx.statements)
        return symbol
    }

    function(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const symbol = new FunctionDefinitionSymbol(nodePosition(location))
        symbol.name = firstTokenText(ctx.name)
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

    expression(ctx: CstChildrenDictionary) {
        if (ctx.constructorExpression) {
            return this.visitFirst(ctx.constructorExpression)
        } else if (ctx.logicalOrExpression) {
            return this.visitFirst(ctx.logicalOrExpression)
        } else if (ctx.ternaryExpression) {
            return this.visitFirst(ctx.ternaryExpression)
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

    operand(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        let symbol: BaseSymbol | undefined

        if (ctx.literal) {
            symbol = this.visitFirst(ctx.literal)
        }
        if (ctx.qualifiedName) {
            symbol = this.visitFirst(ctx.qualifiedName)
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
        if (ctx.Number) {
            return new ConstSymbol(tokenPosition(token), token.image, BaseTypes.number)
        } else if (ctx.Date) {
            return new ConstSymbol(tokenPosition(token), trimChar(token.image, "'"), BaseTypes.date)
        } else if (ctx.Undefined) {
            return new ConstSymbol(tokenPosition(token), token.image, BaseTypes.undefined)
        } else if (ctx.String) {
            return new ConstSymbol(tokenPosition(token), trimChar(token.image, '"'), BaseTypes.string)
        } else if (ctx.MultilineString) {
            return new ConstSymbol(tokenPosition(token), multilineStringContent(token.image), BaseTypes.string)
        } else if (ctx.Null) {
            return new ConstSymbol(tokenPosition(token), token.image, BaseTypes.null)
        } else if (ctx.True || ctx.False) {
            return new ConstSymbol(tokenPosition(token), token.image, BaseTypes.boolean)
        } else {
            return new ConstSymbol(tokenPosition(token), token.image, BaseTypes.unknown)
        }
    }

    qualifiedName(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        let symbols: any[] = []

        if (ctx.variable) {
            ctx.variable.forEach(s => symbols.push(createVariable(s as IToken)))
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

        if (symbols.length === 0) {
            return undefined
        } else if (symbols.length === 1) {
            return symbols[0]
        }

        symbols = symbols.toSorted((s1: BaseSymbol, s2: BaseSymbol) => s1.startOffset - s2.startOffset)
        const symbol = new AccessSequenceSymbol(nodePosition(location))
        symbol.access = symbols

        return symbol
    }

    methodCall(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const name = firstTokenText(ctx.Identifier)
        const symbol = new MethodCallSymbol(nodePosition(location), name)
        if (ctx.arguments) {
            symbol.arguments = (this.visitFirst(ctx.arguments) as any) as BaseSymbol[]
        }
        return symbol
    }

    indexAccess(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const symbol = new IndexAccessSymbol(nodePosition(location))
        symbol.index = this.visitFirst(ctx.index)
        return symbol
    }

    constructorExpression(ctx: CstChildrenDictionary, location: CstNodeLocation) {
        const name = firstTokenText(ctx.Identifier)
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

    arguments(ctx: CstChildrenDictionary) {
        if (ctx.argument) {
            const args = this.visitAll(ctx.argument)
            if (args.length > 1 || args[0]) {
                return args
            }
        }
        return undefined
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
        if (ctx.rhs) {
            const operators = ctx.operator

            ctx.rhs.forEach((rhsOperand, idx) => {
                // there will be one operator for each rhs operand
                let rhsValue = this.visit(rhsOperand as CstNode)
                let operator = operators[idx]

                const symbol = new BinaryExpressionSymbol({ startOffset: result.startOffset, endOffset: rhsValue.endOffset })
                symbol.left = result
                symbol.right = rhsValue
                symbol.operator = (operator as IToken).image
                result = symbol
            })
        }
        return result
    }
}

function firstTokenText(tokens: CstElement[]) {
    return (tokens[0] as IToken).image
}

function Properties(value: IToken[]): PropertySymbol[] {
    return value.map(token => new PropertySymbol(tokenPosition(token), token.image))
}

function createVariable(token: IToken) {
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

function multilineStringContent(value: string): string {
    value = trimChar(value, '"')
    const lines = value.split('\n')
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index].trimStart();
        if (line.startsWith('|')) {
            lines[index] = line.substring(1)
        } else {
            lines[index] = line
        }
    }
    return lines.join('\n')
}