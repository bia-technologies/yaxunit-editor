import { CstParser, Rule, CstNode, IToken } from "chevrotain"
import { tokens, allTokens, operators, keywords } from './tokens'
import { BSLLexer } from "./lexer";

class BSLParser extends CstParser {
    constructor() {
        super(allTokens);
        this.performSelfAnalysis();
    }

    // In TypeScript the parsing rules are explicitly defined as class instance properties
    // This allows for using access control (public/private/protected) and more importantly "informs" the TypeScript compiler
    // about the API of our Parser, so referencing an invalid rule name (this.SUBRULE(this.oopsType);)
    // is now a TypeScript compilation error.
    public module = this.RULE("module", () => {
        this.MANY(() => this.SUBRULE(this.statement))
    });

    public statement = this.RULE("statement", () => this.choice(
        () => this.SUBRULE(this.assignment_statement),
    ))

    assignment_statement = this.RULE("assignment_statement", () => {
        this.SUBRULE(this.qualifiedName)
        this.CONSUME(tokens.Assign)
        this.SUBRULE(this.expression)
    })

    public expression = this.RULE("expression", () => {
        this.SUBRULE(this.operand)
        this.MANY(() => {
            this.SUBRULE1(this.operator)
            this.SUBRULE2(this.operand)
        })
    })

    boolean_literal = this.RULE('boolean', () => this.choice(
        () => this.CONSUME(keywords.TRUE),
        () => this.CONSUME(keywords.FALSE),
    ))

    string_literal = this.RULE('string_literal', () => this.choice(
        () => this.CONSUME(tokens.String),
        () => this.CONSUME(tokens.MultilineString)
    ))

    private qualifiedName = this.RULE("qualifiedName", () => {
        this.CONSUME(tokens.Identifier)
        this.MANY({
            // The gate condition is in addition to basic grammar lookahead, so this.LA(1) === dot
            // is always checked
            //   GATE: () => this.LA(2).tokenType === tokens.identifier,
            DEF: () => {
                this.CONSUME(tokens.Dot)
                this.CONSUME2(tokens.Identifier)
            }
        });
    });

    private literal = this.RULE('literal', () => this.choice(
        () => this.CONSUME(tokens.Number),
        () => this.CONSUME(tokens.Date),
        () => this.SUBRULE(this.boolean_literal),
        () => this.SUBRULE(this.string_literal),
        () => this.CONSUME(keywords.UNDEFINED),
        () => this.CONSUME(keywords.NULL),
    ))

    private operand = this.RULE('operand', () => this.choice(
        () => this.SUBRULE(this.literal),
        () => this.SUBRULE(this.methodCall),
        () => this.SUBRULE(this.qualifiedName),
    ))

    private methodCall = this.RULE('methodCall', () => {
        this.CONSUME(tokens.Identifier)
        this.CONSUME(tokens.LParen)
        this.MANY_SEP({
            SEP: tokens.Comma,
            DEF: () => this.SUBRULE(this.expression)
        })
        this.CONSUME(tokens.RParen)
    })

    private operator = this.RULE('operator', () => this.choice(...operators.map(t => { return () => this.CONSUME(t) })))

    private choice(...tokens: (() => (IToken | CstNode))[]) {
        const items = tokens.map(t => { return { ALT: t } })
        this.OR(items)
    }
}

// reuse the same parser instance.
const parser = new BSLParser();

export const productions: Record<string, Rule> = parser.getGAstProductions();

export function parseModule(text: string) {
    const start = performance.now()

    const lexResult = BSLLexer.tokenize(text);
    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens;
    // any top level rule may be used as an entry point
    const cst = parser.module();
    console.debug('parse time: ', performance.now() - start, 'ms')
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

export function parseExpression(text: string) {
    const start = performance.now()

    const lexResult = BSLLexer.tokenize(text);
    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens;
    // any top level rule may be used as an entry point
    const cst = parser.expression();
    console.debug('parse time: ', performance.now() - start, 'ms')
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