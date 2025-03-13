import { editor, IPosition, Token } from 'monaco-editor-core';
import { TokenType } from '../editor/language/tokenTypes';

export enum TokensSequenceType {
    expression,
    new,
    nothing
}

export interface TokensSequence {
    tokens: string[],
    type: TokensSequenceType,
    lastSymbol: string,
    closed: boolean,
    start?: IPosition,
    end?: IPosition,
    left: string,
    right: string
}

export default {
    resolve: collectTokens,
    currentTokens,
    currentMethod
}

function currentMethod(model: editor.ITextModel, startPosition: IPosition): TokensSequence | undefined {
    let isMethod = false

    const seq = walkTokens(model, startPosition, (state: State, value: string, token: Token) => {

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

    seq.type = TokensSequenceType.expression
    return seq
}

function currentTokens(model: editor.ITextModel, position: IPosition): TokensSequence | undefined {
    const word = model.getWordAtPosition(position)
    if (word) {
        position = {
            lineNumber: position.lineNumber,
            column: word.endColumn
        }
    }

    const result = walkTokens(model, position, checkState)
    console.log('currentTokens', result)
    return result
}

function collectTokens(model: editor.ITextModel, startPosition: IPosition): TokensSequence | undefined {
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

type checkStateType = (state: State, value: string, token: Token) => void

function walkTokens(model: editor.ITextModel, startPosition: IPosition, fn: checkStateType) {
    let line = model.getLineContent(startPosition.lineNumber)

    const right = line.substring(startPosition.column - 1)
    line = line.substring(0, startPosition.column - 1)

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
                    state.start = {
                        lineNumber: state.lineNumber,
                        column: token.offset
                    }
                }
                lastTokenOffset = token.offset
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

    const left = line.substring(0, state.start?.column)

    return {
        tokens: tokens.map(cleanToken),
        closed: state.lastToken === '.',
        lastSymbol: state.lastToken,
        start: state.start,
        end: state.end,
        type: TokensSequenceType.nothing,
        right,
        left
    }
}

function updateState(state: State, value: string, token: Token): void {
    console.debug('Token: ', token)
    if (!state.lastToken && !tokenIs(token, TokenType.Source)) {
        state.lastToken = value
        state.isLastToken = true
        state.end = {
            lineNumber: state.lineNumber,
            column: token.offset + value.length
        }
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
    start?: IPosition,
    end?: IPosition
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

function cleanToken(token: string): string {
    const pos1 = token.indexOf('(')
    const pos2 = token.indexOf('[')

    if (pos1 > 0 && pos2 > 0) {
        return token.substring(0, Math.min(pos1, pos2))
    } else if (pos1 > 0) {
        return token.substring(0, pos1)
    } else if (pos2 > 0) {
        return token.substring(0, pos2)
    }
    return token;
}