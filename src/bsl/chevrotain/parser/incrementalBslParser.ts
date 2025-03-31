import { CstNode, IToken } from "chevrotain";
import { IncrementLexer } from "./lexer";
import { BSLParser } from "./parser";

export class IncrementalBslParser extends BSLParser {
    lexer: IncrementLexer = new IncrementLexer()

    public parseModule(text: string) {
        const start = performance.now()

        const lexResult = this.lexer.tokenize(text)
        this.input = this.lexer.moduleTokens
        const cst = this.module();

        const end = performance.now()
        console.log('Parse time: ', end - start, 'ms')

        return {
            cst: cst,
            lexErrors: lexResult.errors,
            parseErrors: this.errors,
        };
    }

    public updateTokens(changes: IModelContentChange[]) {
        return this.lexer.updateTokens(changes)

    }
    public parseChanges(rule: string, startOffset: number, endOffset: number) {
        let { startIndex, endIndex } = findSymbolTokens(this.lexer.moduleTokens, startOffset, endOffset)
        this.input = this.lexer.moduleTokens.slice(startIndex, endIndex + 1)
        const ruleMethod = (this as any)[rule] as (() => CstNode)
        const result = ruleMethod.bind(this)()
        return {
            cst: result,
            parseErrors: this.errors,
        };
    }
}

/**
 * Locates the tokens that encompass a given offset range.
 *
 * This function performs binary searches on a sorted array of tokens to determine
 * the token index for the startOffset and, if different, the token index for the endOffset.
 * It returns the indices along with flags indicating whether the tokens at those indices
 * exactly include the specified offsets. If startOffset equals endOffset, both indices and
 * inclusion flags will be the same.
 *
 * @param tokens - Sorted array of tokens, each with defined startOffset and endOffset.
 * @param startOffset - The starting offset of the range to locate.
 * @param endOffset - The ending offset of the range to locate.
 * @returns An object containing:
 *   - startIndex: The index of the token overlapping or adjacent to startOffset.
 *   - endIndex: The index of the token overlapping or adjacent to endOffset.
 *   - includeStart: Indicates if the token at startIndex exactly covers startOffset.
 *   - includeEnd: Indicates if the token at endIndex exactly covers endOffset.
 */
function findSymbolTokens(tokens: IToken[], startOffset: number, endOffset: number) {
    let startIndex = -1, endIndex = -1
    let includeStart = false, includeEnd = false

    let lo = 0, hi = tokens.length - 1, mid = 0, token

    if (tokens[hi].endOffset as number + 1 < startOffset) {
        return { startIndex: hi, endIndex: hi, includeStart, includeEnd }
    }
    while (lo <= hi) {
        mid = Math.floor((lo + hi) / 2)
        token = tokens[mid]
        if (token.startOffset > startOffset) {
            hi = mid - 1
        } else if (token.endOffset as number + 1 <= startOffset) {
            lo = mid + 1
        } else {
            startIndex = mid
            includeStart = true
            break
        }
    }

    if (startIndex === -1) {
        if (!token) {
            startIndex = mid - 1
        } else if (token.endOffset as number + 1 <= startOffset) {
            startIndex = mid + 1
        } else {
            startIndex = mid
        }
    }

    if (startOffset === endOffset) {
        return { startIndex, endIndex: startIndex, includeStart, includeEnd: includeStart }
    }

    hi = tokens.length - 1
    while (lo <= hi) {
        mid = Math.floor((lo + hi) / 2)
        if (tokens[mid].startOffset >= endOffset)
            hi = mid - 1
        else if (tokens[mid].endOffset as number < endOffset)
            lo = mid + 1
        else {
            endIndex = mid
            includeEnd = true
            break
        }
    }
    if (endIndex === -1) {
        endIndex = tokens[mid].startOffset >= endOffset ? mid - 1 : mid
    }
    return { startIndex, endIndex, includeStart, includeEnd }
}

export interface IModelContentChange {
    /**
     * The offset of the range that got replaced.
     */
    readonly rangeOffset: number;
    /**
    * The length of the range that got replaced.
    */
    readonly rangeLength: number;
    /**
     * The new text for the range.
     */
    readonly text: string;
}