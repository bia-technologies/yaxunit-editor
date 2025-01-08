import { editor, Position, Token } from 'monaco-editor';
import { TokenType } from "../languages/bsl/tokenTypes";

export interface TokensSequence {
    tokens: string[],
    lastSymbol: string,
    closed: boolean
}
export default {
    resolve: collectTokens
}

function collectTokens(model: editor.ITextModel, startPosition: Position): TokensSequence | undefined {
    let line = model.getLineContent(startPosition.lineNumber).substring(0, startPosition.column - 1);

    const symbols: string[] = []

    let lineNumber = startPosition.lineNumber
    let isFirst = true

    const state: State = { parenthesisLevel: 0, squareLevel: 0, done: false, currentSymbol: '', lastToken: '' }

    while (!state.done && lineNumber > 0) {
        if (line !== '') {
            const lineTokens = getTokens(line)
            if (isFirst) {
                if (isString(lineTokens[lineTokens.length - 1])) {
                    return undefined
                }
                isFirst = false
            }
            let lastTokenOffset = line.length;

            for (let index = lineTokens.length - 1; index >= 0; index--) {
                const token = lineTokens[index];
                const value = line.substring(token.offset, lastTokenOffset);

                updateState(state, value, token)

                if (state.done || isBreak(token, value)) {
                    state.done = true
                    break;
                }
                if (value === '.') {
                    symbols.push(state.currentSymbol)
                    state.currentSymbol = ''
                } else {
                    state.currentSymbol = value + state.currentSymbol;
                }
                lastTokenOffset = token.offset
                console.debug('Tokens resolve state: ', state)
            }
        }
        if (lineNumber === 1) {
            state.done = true
        }

        if (!state.done) {
            lineNumber--;
            line = model.getLineContent(lineNumber)
        }
    }
    if (state.currentSymbol !== '') {
        symbols.push(state.currentSymbol);
    }

    const tokens = symbols.map(s => s.trim())
        .filter(s => s)

    console.debug(tokens);

    return {
        tokens: tokens,
        closed: state.lastToken === '.',
        lastSymbol: state.lastToken
    }
}

function updateState(state: State, value: string, token: Token): void {
    console.debug('Token: ', token)
    if (!state.lastToken && !tokenIs(token, TokenType.Source)) {
        state.lastToken = value
    }
    if (value === ']') {
        state.squareLevel++;
    }
    else if (value === ')') {
        state.parenthesisLevel++;
    }
    else if (value === '[') {
        state.squareLevel--;
        if (state.squareLevel < 0) {
            state.done = true
        }
    }
    else if (value === '(') {
        state.parenthesisLevel--;
        if (state.parenthesisLevel < 0) {
            state.done = true
        }
    }
}

interface State {
    squareLevel: number,
    parenthesisLevel: number,
    done: boolean,
    currentSymbol: string,
    lastToken: string,
}

function getTokens(line: string): Token[] {
    const tokens = editor.tokenize(line, 'bsl');
    return tokens[0];
}

function tokenIs(token: Token, type: TokenType): boolean {
    return token.type === type + '.bsl'
}

function isBreak(token: Token, value: string): boolean {
    const type = token.type.substring(0, token.type.length - 4)

    if (type === TokenType.MetaTag || type === TokenType.Operator) {
        return true;
    }

    if (tokenIs(token, TokenType.Delimiter) && value === ';') {
        return true;
    }

    return false;
}

function isString(token: Token): boolean {
    const type = token.type.substring(0, token.type.length - 4)
    return type === TokenType.String
        || type === TokenType.StringEscape
        || type === TokenType.StringEscapeInvalid
        || type === TokenType.StringInvalid
        || type === TokenType.StringQuote;
}
