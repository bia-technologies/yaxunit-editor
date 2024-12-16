import { editor, Position, Token } from 'monaco-editor';
import { TokenType } from "./tokenTypes";

export default {
    resolve(model: editor.ITextModel, position: Position): string[] | undefined {
        return collectTokens(model, position);
    }
}

function collectTokens(model: editor.ITextModel, startPosition: Position) {
    let line = model.getLineContent(startPosition.lineNumber).substring(0, startPosition.column - 1);

    const symbols: string[] = []

    let currentSymbol = ''

    let squareLevel = 0;
    let parenthesisLevel = 0;
    let done = false
    let lineNumber = startPosition.lineNumber
    let isFirst = true

    while (!done && lineNumber > 0) {
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

                if (tokenIs(token, TokenType.DelimiterSquare)) {
                    if (value === ']') {
                        squareLevel++;
                    }
                    else {
                        squareLevel--;
                    }
                }
                if (tokenIs(token, TokenType.DelimiterParenthesis)) {
                    if (value === ')') {
                        parenthesisLevel++;
                    }
                    else {
                        parenthesisLevel--;
                    }
                }
                if (isBreak(token, value)) {
                    done = true
                    break;
                }
                if (tokenIs(token, TokenType.Delimiter) && value === '.') {
                    symbols.push(currentSymbol)
                    currentSymbol = ''
                } else {
                    currentSymbol = value + currentSymbol;
                }
                lastTokenOffset = token.offset
                console.log(value + ': ' + token);
            }
        }
        if (lineNumber === 1) {
            done = true
        }
        if (!done) {
            lineNumber--;
            line = model.getLineContent(lineNumber)
        }
    }
    if (currentSymbol !== '') {
        symbols.push(currentSymbol);
    }
    console.log(symbols);
    return symbols
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

    if (type === TokenType.MetaTag || type === TokenType.Number || type === TokenType.NumberFloat) {
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
