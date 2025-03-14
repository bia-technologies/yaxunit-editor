import { CstParser, EMPTY_ALT, Rule } from "chevrotain"
import { tokens, allTokens, keywords } from './tokens'
import { BSLLexer } from "./lexer";

export class BSLParser extends CstParser {
    constructor() {
        super(allTokens, {
            nodeLocationTracking: "onlyOffset",
            recoveryEnabled: true
        });
        this.performSelfAnalysis();
    }

    // In TypeScript the parsing rules are explicitly defined as class instance properties
    // This allows for using access control (public/private/protected) and more importantly "informs" the TypeScript compiler
    // about the API of our Parser, so referencing an invalid rule name (this.SUBRULE(this.oopsType);)
    // is now a TypeScript compilation error.
    public module = this.RULE("module", () => {
        this.MANY(() => {
            this.choice(
                () => this.SUBRULE(this.procedure),
                () => this.SUBRULE(this.function),
                () => this.SUBRULE(this.statements))
            this.OPTION(() => this.CONSUME(tokens.Semicolon))
        })
    });

    // #region definitions
    procedure = this.RULE('procedure', () => {
        this.OPTION(() => this.CONSUME(tokens.Async))
        this.CONSUME(tokens.Procedure)
        this.CONSUME(tokens.Identifier, { LABEL: 'name' })
        this.CONSUME(tokens.LParen)
        this.MANY_SEP({
            SEP: tokens.Comma,
            DEF: () => this.SUBRULE(this.parameter)
        })
        this.CONSUME(tokens.RParen)
        this.OPTION1(() => this.CONSUME(tokens.Export))
        this.SUBRULE(this.statements)
        this.CONSUME(tokens.EndProcedure)
    })

    function = this.RULE('function', () => {
        this.OPTION(() => this.CONSUME(tokens.Async))
        this.CONSUME(tokens.Function)
        this.CONSUME(tokens.Identifier, { LABEL: 'name' })
        this.CONSUME(tokens.LParen)
        this.MANY_SEP({
            SEP: tokens.Comma,
            DEF: () => this.SUBRULE(this.parameter)
        })
        this.CONSUME(tokens.RParen)
        this.OPTION1(() => this.CONSUME(tokens.Export))
        this.SUBRULE(this.statements)
        this.CONSUME(tokens.EndFunction)
    })

    parameter = this.RULE('parameter', () => {
        this.OPTION(() => this.CONSUME(tokens.Val))
        this.CONSUME(tokens.Identifier, { LABEL: 'name' })
        this.OPTION1(() => { this.CONSUME(tokens.Assign), this.SUBRULE(this.literal, { LABEL: 'default' }) })
    })

    // #endregion

    // #region statements
    statements = this.RULE('statements', () => this.MANY(() => {
        this.choice(...this.statement)
        this.OPTION(() => this.CONSUME(tokens.Semicolon))
    }))

    private statement = [
        () => this.SUBRULE(this.constructorExpression),
        () => this.SUBRULE(this.constructorMethodExpression),
        () => this.SUBRULE(this.returnStatement),
        () => this.SUBRULE(this.tryStatement),
        () => this.SUBRULE(this.riseErrorStatement),
        () => this.SUBRULE(this.varStatement),
        () => this.SUBRULE(this.ifStatement),
        () => this.SUBRULE(this.whileStatement),
        () => this.SUBRULE(this.forStatement),
        () => this.SUBRULE(this.forEachStatement),
        () => this.SUBRULE(this.continueStatement),
        () => this.SUBRULE(this.breakStatement),
        () => this.SUBRULE(this.gotoStatement),
        () => this.SUBRULE(this.labelStatement),
        () => this.SUBRULE(this.addHandlerStatement),
        () => this.SUBRULE(this.removeHandlerStatement),
        () => this.SUBRULE(this.preprocessor),
        () => this.SUBRULE(this.awaitStatement),
        () => this.SUBRULE(this.executeStatement),
        () => this.SUBRULE(this.assignmentStatement),
    ]

    private assignmentStatement = this.RULE("assignmentStatement", () => {
        this.SUBRULE(this.qualifiedName)
        this.OPTION(() => {
            this.CONSUME(tokens.Assign)
            this.SUBRULE(this.expression)
        }
        )
    })

    private returnStatement = this.RULE("returnStatement", () => {
        this.CONSUME(tokens.Return)
        this.OPTION(() => this.SUBRULE(this.expression))
    })

    private executeStatement = this.RULE("executeStatement", () => {
        this.CONSUME(tokens.Execute)
        this.SUBRULE(this.expression)
    })

    private tryStatement = this.RULE("tryStatement", () => {
        this.CONSUME(tokens.Try)
        this.SUBRULE(this.statements)
        this.CONSUME(tokens.Except)
        this.SUBRULE1(this.statements, { LABEL: 'handler' })
        this.CONSUME(tokens.EndTry)
    })

    private riseErrorStatement = this.RULE("riseErrorStatement", () => {
        this.CONSUME(tokens.Raise)
        this.choice(
            () => this.SUBRULE(this.literal, { LABEL: 'error' }),
            () => this.SUBRULE(this.qualifiedName, { LABEL: 'error' }),
            () => this.SUBRULE(this.arguments),
            EMPTY_ALT
        )
    })

    private ifStatement = this.RULE("ifStatement", () => {
        this.SUBRULE(this.ifBrunch, { LABEL: 'brunch' })
        this.MANY(() => {
            this.SUBRULE(this.elsifBrunch, { LABEL: 'brunch' })
        })
        this.OPTION(() => this.SUBRULE(this.elseBrunch))
        this.CONSUME(tokens.Endif)
    })

    private ifBrunch = this.RULE('ifBrunch', () => {
        this.CONSUME(tokens.If)
        this.SUBRULE(this.expression, { LABEL: 'condition' })
        this.CONSUME(tokens.Then)
        this.SUBRULE(this.statements, { LABEL: 'body' })
    })

    private elsifBrunch = this.RULE('elsifBrunch', () => {
        this.CONSUME(tokens.Elsif)
        this.SUBRULE1(this.expression, { LABEL: 'condition' })
        this.CONSUME1(tokens.Then)
        this.SUBRULE1(this.statements, { LABEL: 'body' })
    })

    private elseBrunch = this.RULE('elseBrunch', () => {
        this.CONSUME(tokens.Else)
        this.SUBRULE2(this.statements, { LABEL: 'body' })
    })

    private varStatement = this.RULE("varStatement", () => {
        this.CONSUME(tokens.Var)
        this.MANY_SEP({
            SEP: tokens.Comma,
            DEF: () => this.CONSUME(tokens.Identifier)
        })
    })

    private whileStatement = this.RULE("whileStatement", () => {
        this.CONSUME(tokens.While)
        this.SUBRULE(this.expression)
        this.CONSUME(tokens.Do)
        this.SUBRULE(this.statements)
        this.CONSUME(tokens.EndDo)
    })

    private forStatement = this.RULE("forStatement", () => {
        this.CONSUME(tokens.For)
        this.CONSUME(tokens.Identifier, { LABEL: 'variable' })
        this.CONSUME(tokens.Assign)
        this.SUBRULE(this.expression, { LABEL: 'start' })
        this.CONSUME(tokens.To)
        this.SUBRULE1(this.expression, { LABEL: 'end' })
        this.CONSUME(tokens.Do)
        this.SUBRULE(this.statements)
        this.CONSUME(tokens.EndDo)
    })

    private forEachStatement = this.RULE("forEachStatement", () => {
        this.CONSUME(tokens.For)
        this.CONSUME(tokens.Each)
        this.CONSUME(tokens.Identifier, { LABEL: 'variable' })
        this.CONSUME(tokens.In)
        this.SUBRULE(this.expression, { LABEL: 'collection' })
        this.CONSUME(tokens.Do)
        this.SUBRULE(this.statements)
        this.CONSUME(tokens.EndDo)
    })

    private continueStatement = this.RULE("continueStatement", () => {
        this.CONSUME(tokens.Continue)
    })

    private breakStatement = this.RULE("breakStatement", () => {
        this.CONSUME(tokens.Break)
    })

    private gotoStatement = this.RULE("gotoStatement", () => {
        this.CONSUME(tokens.Goto)
        this.CONSUME(tokens.Tilde)
        this.CONSUME(tokens.Identifier)
    })

    private labelStatement = this.RULE("labelStatement", () => {
        this.CONSUME(tokens.Tilde)
        this.CONSUME(tokens.Identifier)
        this.CONSUME(tokens.Сolon)
    })

    private addHandlerStatement = this.RULE("addHandlerStatement", () => {
        this.CONSUME(tokens.AddHandler)
        this.SUBRULE(this.expression, { LABEL: 'event' })
        this.CONSUME(tokens.Comma)
        this.SUBRULE1(this.expression, { LABEL: 'handler' })
    })

    private removeHandlerStatement = this.RULE("removeHandlerStatement", () => {
        this.CONSUME(tokens.RemoveHandler)
        this.SUBRULE(this.expression, { LABEL: 'event' })
        this.CONSUME(tokens.Comma)
        this.SUBRULE1(this.expression, { LABEL: 'handler' })
    })

    private preprocessor = this.RULE("preprocessor", () => this.choice(
        () => { this.CONSUME(tokens.PreprocRegion); this.CONSUME(tokens.Identifier) },
        () => this.CONSUME(tokens.PreprocEndregion),
        () => { this.CONSUME(tokens.PreprocIf); this.SUBRULE(this.expression); this.CONSUME(tokens.Then) },
        () => { this.CONSUME(tokens.PreprocElsif); this.SUBRULE1(this.expression); this.CONSUME1(tokens.Then) },
        () => this.CONSUME(tokens.PreprocElse),
        () => this.CONSUME(tokens.PreprocEndif),
    ))

    private awaitStatement = this.RULE("awaitStatement", () => {
        this.CONSUME(tokens.Await)
        this.SUBRULE(this.expression)
    })
    // #endregion

    // #region Expressions
    public expression = this.RULE("expression", () => this.choice(
        () => this.SUBRULE(this.constructorExpression),
        () => this.SUBRULE(this.constructorMethodExpression),
        () => this.SUBRULE(this.logicalOrExpression),
    ))


    private operand = this.RULE('operand', () => {
        this.OPTION(() => this.choice(
            () => this.CONSUME(tokens.Not),
            () => this.CONSUME(tokens.Minus),
            () => this.CONSUME(tokens.Plus),
        ))
        this.choice1(
            () => this.SUBRULE(this.ternaryExpression),
            () => this.SUBRULE(this.literal),
            () => this.SUBRULE(this.qualifiedName),
            () => this.SUBRULE(this.parenthesisExpression),
        )
    })

    multiplicationExpression = this.RULE("multiplicationExpression", this.binaryExpression(this.operand, tokens.MultiplicationOperator))

    additionExpression = this.RULE("additionExpression", this.binaryExpression(this.multiplicationExpression, tokens.AdditionOperator))

    compareExpression = this.RULE("compareExpression", this.binaryExpression(this.additionExpression, tokens.CompareOperator))

    logicalAndExpression = this.RULE("logicalAndExpression", this.binaryExpression(this.compareExpression, tokens.And))

    logicalOrExpression = this.RULE("logicalOrExpression", this.binaryExpression(this.logicalAndExpression, tokens.Or))

    parenthesisExpression = this.RULE("parenthesisExpression", () => {
        this.CONSUME(tokens.LParen)
        this.SUBRULE(this.expression)
        this.CONSUME(tokens.RParen)
    });

    private qualifiedName = this.RULE("qualifiedName", () => {
        this.choice(
            () => this.SUBRULE(this.methodCall),
            () => this.CONSUME(tokens.Identifier, { LABEL: 'variable' }),
        )
        this.MANY(() => this.choice1(
            () => { this.CONSUME2(tokens.Dot), this.SUBRULE3(this.methodCall2, { LABEL: 'methodCall' }) },
            () => { this.CONSUME3(tokens.Dot), this.CONSUME1(tokens.Identifier) },
            () => this.SUBRULE(this.indexAccess),
        ))
        this.OPTION(() => this.CONSUME(tokens.Dot, { LABEL: 'UNCLOSED' }))
    })

    private indexAccess = this.RULE('indexAccess', () => { this.CONSUME(tokens.LSquare), this.SUBRULE(this.expression, { LABEL: 'index' }), this.CONSUME(tokens.RSquare) }
    )

    private literal = this.RULE('literal', () => this.choice(
        () => this.CONSUME(tokens.Number),
        () => this.CONSUME(tokens.Date),
        () => this.CONSUME(keywords.True),
        () => this.CONSUME(keywords.False),
        () => this.CONSUME(tokens.String),
        () => this.CONSUME(tokens.MultilineString),
        () => this.CONSUME(keywords.Undefined),
        () => this.CONSUME(keywords.Null),
    ))

    private methodCall = this.RULE('methodCall', () => {
        this.CONSUME(tokens.Identifier)
        this.SUBRULE(this.arguments)
    })

    private methodCall2 = this.RULE('methodCall2', () => {
        this.choice(
            () => this.CONSUME(tokens.Execute, { LABEL: 'Identifier' }),
            () => this.CONSUME(tokens.Identifier)
        )
        this.SUBRULE(this.arguments)
    })

    private ternaryExpression = this.RULE("ternaryExpression", () => {
        this.CONSUME(tokens.Question)
        this.CONSUME(tokens.LParen)
        this.SUBRULE(this.expression, { LABEL: 'condition' })
        this.CONSUME(tokens.Comma)
        this.SUBRULE1(this.expression, { LABEL: 'consequence' })
        this.CONSUME1(tokens.Comma)
        this.SUBRULE2(this.expression, { LABEL: 'alternative' })
        this.CONSUME(tokens.RParen)
    })

    private constructorExpression = this.RULE("constructorExpression", () => {
        this.CONSUME(tokens.New)
        this.CONSUME(tokens.Identifier)
        this.OPTION(() => this.SUBRULE(this.arguments))
    })

    private constructorMethodExpression = this.RULE("constructorMethodExpression", () => {
        this.CONSUME(tokens.New)
        this.CONSUME(tokens.LParen)
        this.SUBRULE1(this.expression, { LABEL: 'type' })
        this.OPTION(() => {
            this.CONSUME(tokens.Comma)
            this.SUBRULE2(this.expression, { LABEL: 'arguments' })
        })
        this.CONSUME(tokens.RParen)
    })

    private arguments = this.RULE('arguments', () => {
        this.CONSUME(tokens.LParen)
        this.MANY_SEP({
            SEP: tokens.Comma,
            DEF: () => this.SUBRULE(this.argument, { LABEL: 'argument' })
        })
        this.CONSUME(tokens.RParen)
    })
    private argument = this.RULE('argument', () => this.OPTION(
        () => this.SUBRULE(this.expression)
    ))

    // #endregion

    private choice(...tokens: (() => any)[]) {
        const items = tokens.map(t => { return { ALT: t } })
        this.OR(items)
    }
    private choice1(...tokens: (() => any)[]) {
        const items = tokens.map(t => { return { ALT: t } })
        this.OR1(items)
    }

    binaryExpression(operand: any, operator: any) {
        return () => {
            this.SUBRULE(operand, { LABEL: "lhs" })
            this.MANY(() => {
                this.CONSUME(operator, { LABEL: 'operator' })
                this.SUBRULE1(operand, { LABEL: "rhs" })
            })
        }
    }
}

// reuse the same parser instance.
const parser = new BSLParser();

export const productions: Record<string, Rule> = parser.getGAstProductions();

export function parseModule(text: string) {
    const start = performance.now()

    const lexResult = BSLLexer.tokenize(text);
    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens
    // any top level rule may be used as an entry point
    const cst = parser.module();
    console.log('Parse by chevrotain time: ', performance.now() - start, 'ms')
    // this would be a TypeScript compilation error because our parser now has a clear API.
    // let value = parser.json_OopsTypo()

    return {
        // This is a pure grammar, the value will be undefined until we add embedded actions
        // or enable automatic CST creation.
        cst: cst,
        lexErrors: lexResult.errors,
        parseErrors: parser.errors,
    };
}