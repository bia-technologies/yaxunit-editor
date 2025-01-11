import { editor, Position, Token } from 'monaco-editor';
import { TokenType } from "../languages/bsl/tokenTypes";

export interface TokensSequence {
    tokens: string[],
    lastSymbol: string,
    closed: boolean,
    start?: Position,
    end?: Position
}

export default {
    resolve: collectTokens,
    findMethod,
    getParameterNumber
}

type checkStateType = (state: State, value: string, token: Token) => void

function findMethod(model: editor.ITextModel, startPosition: Position): TokensSequence | undefined {
    let isMethod = false

    return walkTokens(model, startPosition, (state: State, value: string, token: Token) => {

        if (isMethod) {
            state.skipSymbol = false
            checkState(state, value, token)
        } else {
            if (tokenIs(token, TokenType.MetaTag) || value === ';') {
                state.done = true
            } else if (value === '(' && state.parenthesisLevel < 0) {
                isMethod = true
                state.lastToken = ''
                state.parenthesisLevel = 0
                state.squareLevel = 0
                state.skipSymbol = true
            } else {
                state.skipSymbol = true
            }
        }
    })
}

function collectTokens(model: editor.ITextModel, startPosition: Position): TokensSequence | undefined {
    return walkTokens(model, startPosition, checkState)
}

function checkState(state: State, value: string, token: Token) {
    if (state.squareLevel < 0) {
        state.done = true
    } else if (state.parenthesisLevel < 0) {
        state.done = true
    } else if (isBreak(token, value)) {
        state.done = true
    } else if (state.isLastToken && isString(token)) {
        state.done = true
    }
}

function walkTokens(model: editor.ITextModel, startPosition: Position, fn: checkStateType) {
    let line = model.getLineContent(startPosition.lineNumber).substring(0, startPosition.column - 1);

    const symbols: string[] = []

    const state: State = baseState(startPosition.lineNumber)

    while (!state.done && state.lineNumber > 0) {
        if (line !== '') {
            const lineTokens = getTokens(line)
            let lastTokenOffset = line.length;

            for (let index = lineTokens.length - 1; index >= 0; index--) {
                const token = lineTokens[index];
                const value = line.substring(token.offset, lastTokenOffset);

                updateState(state, value, token)
                fn(state, value, token)

                if (state.done) {
                    break;
                }

                if (!state.skipSymbol) {
                    if (value === '.') {
                        symbols.push(state.currentSymbol)
                        state.currentSymbol = ''
                    } else {
                        state.currentSymbol = value + state.currentSymbol;
                    }
                }
                lastTokenOffset = token.offset
                console.debug('Tokens resolve state: ', state)
            }
        }
        if (state.lineNumber === 1) {
            state.done = true
        }

        if (!state.done) {
            state.lineNumber--;
            line = model.getLineContent(state.lineNumber)
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
        lastSymbol: state.lastToken,
        start: state.start,
        end: state.end
    }
}

function updateState(state: State, value: string, token: Token): void {
    console.debug('Token: ', token)
    if (!state.lastToken && !tokenIs(token, TokenType.Source)) {
        state.lastToken = value
        state.isLastToken = true
        state.end = new Position(state.lineNumber, token.offset + value.length)
    } else if (state.isLastToken) {
        state.isLastToken = false
    }

    updateBaseState(state, value)
}

function updateBaseState(state: BaseState, value: string): void {
    if (value === ']') {
        state.squareLevel++;
    } else if (value === ')') {
        state.parenthesisLevel++;
    } else if (value === '[') {
        state.squareLevel--;
    } else if (value === '(') {
        state.parenthesisLevel--;
    }
}

function baseState(lineNumber: number): State {
    return {
        parenthesisLevel: 0,
        squareLevel: 0,
        done: false,
        currentSymbol: '',
        lastToken: '',
        lineNumber: lineNumber,
        skipSymbol: false,
        isLastToken: false,
    }
}

interface State extends BaseState {
    currentSymbol: string,
    lastToken: string,
    isLastToken: boolean
    lineNumber: number,
    skipSymbol: boolean,
    start?: Position,
    end?: Position
}

interface BaseState {
    squareLevel: number,
    parenthesisLevel: number,
    done: boolean,

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

function getParameterNumber(model: editor.ITextModel, start: Position, end: Position): number {

    const text = model.getValueInRange({
        startColumn: start.column + 1,
        startLineNumber: start.lineNumber,
        endColumn: end.column,
        endLineNumber: end.lineNumber
    }).split(model.getEOL()).join('')

    const tokens = getTokens(text + ' ')

    const state: BaseState = {
        done: false,
        parenthesisLevel: 0,
        squareLevel: 0,
    }
    let lastTokenOffset = 0
    let parameterNumber = 0
    tokens.forEach(token => {
        const value = text.substring(token.offset, lastTokenOffset);
        lastTokenOffset = token.offset
        updateBaseState(state, value)
        if (value === ',' && state.parenthesisLevel === -1 && state.squareLevel === 0) {
            parameterNumber++;
        }
    });

    return parameterNumber
}