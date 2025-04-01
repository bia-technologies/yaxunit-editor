import { CstParser, EMPTY_ALT } from "chevrotain"
import { tokens, allTokens, keywords } from './tokens'

export class BSLParser extends CstParser {
    constructor() {
        super(allTokens, {
            nodeLocationTracking: "onlyOffset",
            recoveryEnabled: true
        });
        this.performSelfAnalysis();
    }

    protected module = this.RULE("module", () => {
        this.MANY(() => {
            this.choice(
                () => this.SUBRULE(this.procedure),
                () => this.SUBRULE(this.function),
                () => this.SUBRULE(this.statements))
            this.OPTION(() => this.CONSUME(tokens.Semicolon))
        })
    });

    // #region definitions
    protected procedure = this.RULE('procedure', () => {
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

    protected function = this.RULE('function', () => {
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

    protected parameter = this.RULE('parameter', () => {
        this.OPTION(() => this.CONSUME(tokens.Val))
        this.CONSUME(tokens.Identifier, { LABEL: 'name' })
        this.OPTION1(() => { this.CONSUME(tokens.Assign), this.SUBRULE(this.literal, { LABEL: 'default' }) })
    })

    // #endregion

    // #region statements
    protected statements = this.RULE('statements', () => this.MANY(() => {
        this.choice(...this.statement)
        this.OPTION(() => this.CONSUME(tokens.Semicolon))
    }))

    protected statement = [
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
        EMPTY_ALT,
    ]

    protected assignmentStatement = this.RULE("assignmentStatement", () => {
        this.SUBRULE(this.qualifiedName)
        this.OPTION(() => {
            this.CONSUME(tokens.Assign)
            this.SUBRULE(this.expression)
        })
    })

    protected returnStatement = this.RULE("returnStatement", () => {
        this.CONSUME(tokens.Return)
        this.OPTION(() => this.SUBRULE(this.expression))
    })

    protected executeStatement = this.RULE("executeStatement", () => {
        this.CONSUME(tokens.Execute)
        this.SUBRULE(this.expression)
    })

    protected tryStatement = this.RULE("tryStatement", () => {
        this.CONSUME(tokens.Try)
        this.SUBRULE(this.statements)
        this.CONSUME(tokens.Except)
        this.SUBRULE1(this.statements, { LABEL: 'handler' })
        this.CONSUME(tokens.EndTry)
    })

    protected riseErrorStatement = this.RULE("riseErrorStatement", () => {
        this.CONSUME(tokens.Raise)
        this.SUBRULE(this.expression) // TODO support raise as method
    })

    protected ifStatement = this.RULE("ifStatement", () => {
        this.SUBRULE(this.ifBranch, { LABEL: 'branch' })
        this.MANY(() => {
            this.SUBRULE(this.elsifBranch, { LABEL: 'branch' })
        })
        this.OPTION(() => this.SUBRULE(this.elseBranch))
        this.CONSUME(tokens.Endif)
    })

    protected ifBranch = this.RULE('ifBranch', () => {
        this.CONSUME(tokens.If)
        this.SUBRULE(this.expression, { LABEL: 'condition' })
        this.CONSUME(tokens.Then)
        this.SUBRULE(this.statements, { LABEL: 'body' })
    })

    protected elsifBranch = this.RULE('elsifBranch', () => {
        this.CONSUME(tokens.Elsif)
        this.SUBRULE1(this.expression, { LABEL: 'condition' })
        this.CONSUME1(tokens.Then)
        this.SUBRULE1(this.statements, { LABEL: 'body' })
    })

    protected elseBranch = this.RULE('elseBranch', () => {
        this.CONSUME(tokens.Else)
        this.SUBRULE2(this.statements, { LABEL: 'body' })
    })

    protected varStatement = this.RULE("varStatement", () => {
        this.CONSUME(tokens.Var)
        this.MANY_SEP({
            SEP: tokens.Comma,
            DEF: () => this.CONSUME(tokens.Identifier)
        })
    })

    protected whileStatement = this.RULE("whileStatement", () => {
        this.CONSUME(tokens.While)
        this.SUBRULE(this.expression)
        this.CONSUME(tokens.Do)
        this.SUBRULE(this.statements)
        this.CONSUME(tokens.EndDo)
    })

    protected forStatement = this.RULE("forStatement", () => {
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

    protected forEachStatement = this.RULE("forEachStatement", () => {
        this.CONSUME(tokens.For)
        this.CONSUME(tokens.Each)
        this.CONSUME(tokens.Identifier, { LABEL: 'variable' })
        this.CONSUME(tokens.In)
        this.SUBRULE(this.expression, { LABEL: 'collection' })
        this.CONSUME(tokens.Do)
        this.SUBRULE(this.statements)
        this.CONSUME(tokens.EndDo)
    })

    protected continueStatement = this.RULE("continueStatement", () => {
        this.CONSUME(tokens.Continue)
    })

    protected breakStatement = this.RULE("breakStatement", () => {
        this.CONSUME(tokens.Break)
    })

    protected gotoStatement = this.RULE("gotoStatement", () => {
        this.CONSUME(tokens.Goto)
        this.CONSUME(tokens.Tilde)
        this.CONSUME(tokens.Identifier)
    })

    protected labelStatement = this.RULE("labelStatement", () => {
        this.CONSUME(tokens.Tilde)
        this.CONSUME(tokens.Identifier)
        this.CONSUME(tokens.Colon)
    })

    protected addHandlerStatement = this.RULE("addHandlerStatement", () => {
        this.CONSUME(tokens.AddHandler)
        this.SUBRULE(this.expression, { LABEL: 'event' })
        this.CONSUME(tokens.Comma)
        this.SUBRULE1(this.expression, { LABEL: 'handler' })
    })

    protected removeHandlerStatement = this.RULE("removeHandlerStatement", () => {
        this.CONSUME(tokens.RemoveHandler)
        this.SUBRULE(this.expression, { LABEL: 'event' })
        this.CONSUME(tokens.Comma)
        this.SUBRULE1(this.expression, { LABEL: 'handler' })
    })

    protected preprocessor = this.RULE("preprocessor", () => this.choice(
        () => { this.CONSUME(tokens.PreprocRegion); this.CONSUME(tokens.Identifier) },
        () => this.CONSUME(tokens.PreprocEndregion),
        () => { this.CONSUME(tokens.PreprocIf); this.SUBRULE(this.expression); this.CONSUME(tokens.Then) },
        () => { this.CONSUME(tokens.PreprocElsif); this.SUBRULE1(this.expression); this.CONSUME1(tokens.Then) },
        () => this.CONSUME(tokens.PreprocElse),
        () => this.CONSUME(tokens.PreprocEndif),
    ))

    protected awaitStatement = this.RULE("awaitStatement", () => {
        this.CONSUME(tokens.Await)
        this.SUBRULE(this.expression)
    })
    // #endregion

    // #region Expressions
    protected expression = this.RULE("expression", () => this.choice(
        () => this.SUBRULE(this.constructorExpression),
        () => this.SUBRULE(this.constructorMethodExpression),
        () => this.SUBRULE(this.logicalOrExpression),
    ))


    protected operand = this.RULE('operand', () => {
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

    protected multiplicationExpression = this.RULE("multiplicationExpression", this.binaryExpression(this.operand, tokens.MultiplicationOperator))

    protected additionExpression = this.RULE("additionExpression", this.binaryExpression(this.multiplicationExpression, tokens.AdditionOperator))

    protected compareExpression = this.RULE("compareExpression", this.binaryExpression(this.additionExpression, tokens.CompareOperator))

    protected logicalAndExpression = this.RULE("logicalAndExpression", this.binaryExpression(this.compareExpression, tokens.And))

    protected logicalOrExpression = this.RULE("logicalOrExpression", this.binaryExpression(this.logicalAndExpression, tokens.Or))

    protected parenthesisExpression = this.RULE("parenthesisExpression", () => {
        this.CONSUME(tokens.LParen)
        this.SUBRULE(this.expression)
        this.CONSUME(tokens.RParen)
    });

    protected qualifiedName = this.RULE("qualifiedName", () => {
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

    protected indexAccess = this.RULE('indexAccess', () => { this.CONSUME(tokens.LSquare), this.SUBRULE(this.expression, { LABEL: 'index' }), this.CONSUME(tokens.RSquare) }
    )

    protected literal = this.RULE('literal', () => this.choice(
        () => this.CONSUME(tokens.Number),
        () => this.CONSUME(tokens.Date),
        () => this.CONSUME(keywords.True),
        () => this.CONSUME(keywords.False),
        () => this.CONSUME(tokens.StringLiteral),
        () => this.CONSUME(keywords.Undefined),
        () => this.CONSUME(keywords.Null),
    ))

    protected methodCall = this.RULE('methodCall', () => {
        this.CONSUME(tokens.Identifier)
        this.SUBRULE(this.arguments)
    })

    protected methodCall2 = this.RULE('methodCall2', () => {
        this.choice(
            () => this.CONSUME(tokens.Execute, { LABEL: 'Identifier' }),
            () => this.CONSUME(tokens.Identifier)
        )
        this.SUBRULE(this.arguments)
    })

    protected ternaryExpression = this.RULE("ternaryExpression", () => {
        this.CONSUME(tokens.Question)
        this.CONSUME(tokens.LParen)
        this.SUBRULE(this.expression, { LABEL: 'condition' })
        this.CONSUME(tokens.Comma)
        this.SUBRULE1(this.expression, { LABEL: 'consequence' })
        this.CONSUME1(tokens.Comma)
        this.SUBRULE2(this.expression, { LABEL: 'alternative' })
        this.CONSUME(tokens.RParen)
    })

    protected constructorExpression = this.RULE("constructorExpression", () => {
        this.CONSUME(tokens.New)
        this.CONSUME(tokens.Identifier)
        this.OPTION(() => this.SUBRULE(this.arguments))
    })

    protected constructorMethodExpression = this.RULE("constructorMethodExpression", () => {
        this.CONSUME(tokens.New)
        this.CONSUME(tokens.LParen)
        this.SUBRULE1(this.expression, { LABEL: 'type' })
        this.OPTION(() => {
            this.CONSUME(tokens.Comma)
            this.SUBRULE2(this.expression, { LABEL: 'arguments' })
        })
        this.CONSUME(tokens.RParen)
    })

    protected arguments = this.RULE('arguments', () => {
        this.CONSUME(tokens.LParen)
        this.MANY_SEP({
            SEP: tokens.Comma,
            DEF: () => this.SUBRULE(this.argument)
        })
        this.CONSUME(tokens.RParen)
    })

    protected argument = this.RULE('argument', () => this.OPTION(
        () => this.SUBRULE(this.expression)
    ))

    // #endregion

    protected choice(...tokens: (() => any)[]) {
        const items = tokens.map(t => { return { ALT: t } })
        this.OR(items)
    }

    protected choice1(...tokens: (() => any)[]) {
        const items = tokens.map(t => { return { ALT: t } })
        this.OR1(items)
    }

    private binaryExpression(operand: any, operator: any) {
        return () => {
            this.SUBRULE(operand, { LABEL: "lhs" })
            this.MANY(() => {
                this.CONSUME(operator, { LABEL: 'operator' })
                this.SUBRULE1(operand, { LABEL: "rhs" })
            })
        }
    }
}