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
        this.CONSUME(tokens.ASSIGN)
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

    // multiline_string = this.RULE('multiline_string', () => {
    //     this.CONSUME(tokens.string_start)
    //     this.MANY(() => this.CONSUME(tokens.string_part))
    //     this.CONSUME2(tokens.string_tail)
    // })

    string_literal = this.RULE('string_literal', () => this.choice(
        () => this.CONSUME(tokens.string),
        () => this.CONSUME(tokens.multilineString)
    ))

    private qualifiedName = this.RULE("qualifiedName", () => {
        this.CONSUME(tokens.identifier)
        this.MANY({
            // The gate condition is in addition to basic grammar lookahead, so this.LA(1) === dot
            // is always checked
            //   GATE: () => this.LA(2).tokenType === tokens.identifier,
            DEF: () => {
                this.CONSUME(tokens.DOT)
                this.CONSUME2(tokens.identifier)
            }
        });
    });

    private literal = this.RULE('literal', () => this.choice(
        () => this.CONSUME(tokens.number),
        () => this.CONSUME(tokens.date),
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
        this.CONSUME(tokens.identifier)
        this.CONSUME(tokens.LPAREN)
        this.MANY_SEP({
            SEP: tokens.COMMA,
            DEF: () => this.SUBRULE(this.expression)
        })
        this.CONSUME(tokens.RPAREN)
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