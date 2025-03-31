import { ILexingError, ILexingResult, IToken, Lexer } from "chevrotain"
import { allTokens } from "./tokens"
import { IModelContentChange } from "./incrementalBslParser"

export class IncrementLexer extends Lexer {
    moduleTokens: IToken[] = []

    constructor() {
        super(allTokens, { ensureOptimizations: true, positionTracking: "full" })
    }

    public tokenize(text: string, initialMode?: string | undefined): ILexingResult {
        const result = super.tokenize(text, initialMode)
        this.moduleTokens = result.tokens
        return result
    }

    public updateTokens(changes: IModelContentChange[]) {
        const ranges: { start: number, end: number, diff: number, errors?: ILexingError[] }[] = []
        for (const change of changes) {
            let start = change.rangeOffset
            let end = change.rangeLength + start
            const offsetDiff = change.text.length - change.rangeLength
            const { startIndex, endIndex, includeStart, includeEnd } = findTokens(this.moduleTokens, start, end)

            let text = change.text

            if (includeStart || includeEnd) {
                const startToken = this.moduleTokens[startIndex]
                const endToken = this.moduleTokens[endIndex]

                const leftText = includeStart ? startToken.image.substring(0, start - startToken.startOffset) : ''
                const rightText = includeEnd ? endToken.image.substring(end - endToken.startOffset) : ''
                text = leftText + change.text + rightText
                if (includeStart) {
                    start = startToken.startOffset
                }
                if (includeEnd) {
                    end = endToken.endOffset as number
                }
            }

            const lexingResult = (!text || text.trim() === '') ? undefined : super.tokenize(text)
            const textTokens = lexingResult?.tokens ?? []
            textTokens.forEach(t => { t.startOffset += start; (t.endOffset as number) += start })

            if (start === 0 && !includeStart && !includeEnd && startIndex === 0 && endIndex === 0) {
                if (offsetDiff) {
                    this.moduleTokens.forEach(t => { t.startOffset += offsetDiff; (t.endOffset as number) += offsetDiff })
                }
                this.moduleTokens = textTokens.concat(this.moduleTokens)
            } else if (!includeStart && startIndex === this.moduleTokens.length - 1) {
                this.moduleTokens = this.moduleTokens.concat(textTokens)
            } else {
                this.moduleTokens.splice(startIndex + (!includeStart ? 1 : 0), endIndex - startIndex + (includeStart ? 1 : 0), ...textTokens)
                if (offsetDiff) {
                    const startMove = startIndex + textTokens.length + (!includeStart ? 1 : 0)
                    moveTokens(this.moduleTokens, startMove, offsetDiff)
                } else {
                    console.log('no offset')
                }
            }
            ranges.push({
                start,
                end,
                errors: lexingResult?.errors,
                diff: offsetDiff
            })
        }
        return ranges
    }
}

function moveTokens(tokens: IToken[], start: number, diff: number) {
    for (let index = start; index < tokens.length; index++) {
        const token = tokens[index];
        token.startOffset += diff;
        (token.endOffset as number) += diff
    }
}

/**
 * Finds the token boundaries overlapping a specified range.
 *
 * This function searches a sorted list of tokens to determine the indices corresponding to the boundary
 * tokens that intersect or are adjacent to the given start and end offsets. It also specifies whether the
 * tokens at these boundaries should be included.
 *
 * @param tokens - The array of tokens, each having numeric start and end offsets.
 * @param startOffset - The starting offset of the target range.
 * @param endOffset - The ending offset of the target range.
 * @returns An object containing:
 *   - startIndex: The index of the token at or near the start offset.
 *   - endIndex: The index of the token at or near the end offset.
 *   - includeStart: True if the token at startIndex should be included.
 *   - includeEnd: True if the token at endIndex should be included.
 */
function findTokens(tokens: IToken[], startOffset: number, endOffset: number) {
    const lastTokenIndex = tokens.length - 1

    if (tokens[lastTokenIndex].endOffset as number + 1 < startOffset) {
        return { startIndex: lastTokenIndex, endIndex: lastTokenIndex, includeStart: false, includeEnd: true }
    } else if (tokens[0].startOffset > endOffset) {
        return { startIndex: 0, endIndex: 0, includeStart: false, includeEnd: false }
    }

    let { startIndex, includeStart } = getFirstTokenIndex(tokens, startOffset)
    let { endIndex, includeEnd } = getLastTokenIndex(tokens, endOffset)

    if (startIndex === endIndex && !includeStart && !includeEnd) {
        const token = tokens[endIndex]
        includeStart = token.startOffset > startOffset && (token.endOffset as number + 1) < endOffset
    }
    return { startIndex, endIndex, includeStart, includeEnd }
}

function getFirstTokenIndex(tokens: IToken[], startOffset: number) {
    let startIndex = -1
    let includeStart = false

    const lastTokenIndex = tokens.length - 1
    let lo = 0, hi = lastTokenIndex, mid = 0, token

    while (lo <= hi) {
        mid = Math.floor((lo + hi) / 2)
        token = tokens[mid]
        if (token.startOffset > startOffset) {
            hi = mid - 1
        } else if (token.endOffset as number + 1 < startOffset) {
            lo = mid + 1
        } else {
            startIndex = mid
            break
        }
    }

    if (startIndex === -1) {
        startIndex = mid
    }

    token = tokens[startIndex]
    if (token.startOffset > startOffset) {
        if (startIndex) {
            startIndex--
            includeStart = includeSymbol(tokens[startIndex], startIndex)
        }
    } else if ((token.endOffset as number + 1) < startOffset) {
        if (startIndex < lastTokenIndex) {
            startIndex++
            includeStart = includeSymbol(tokens[startIndex], startIndex)
            if (!includeStart) startIndex--
        }
    } else {
        includeStart = true
    }
    return { startIndex, includeStart }
}

function getLastTokenIndex(tokens: IToken[], endOffset: number) {
    let endIndex = -1
    let includeEnd = false

    const lastTokenIndex = tokens.length - 1
    let lo = 0, hi = lastTokenIndex, mid = 0, token

    while (lo <= hi) {
        mid = Math.floor((lo + hi) / 2)
        token = tokens[mid]
        if (token.startOffset > endOffset)
            hi = mid - 1
        else if (token.endOffset as number + 1 <= endOffset)
            lo = mid + 1
        else {
            endIndex = mid
            break
        }
    }
    if (endIndex === -1) {
        endIndex = mid
    }

    token = tokens[endIndex]
    if (token.startOffset > endOffset) {
        if (endIndex) {
            endIndex--
            includeEnd = includeSymbol(tokens[endIndex], endOffset)
        }
    } else if ((token.endOffset as number + 1) < endOffset) {
        if (endIndex < lastTokenIndex) {
            endIndex++
            includeEnd = includeSymbol(tokens[endIndex], endOffset)
            if (!includeEnd) endIndex--
        }
    } else {
        includeEnd = true
    }
    return { endIndex, includeEnd }
}

/**
 * Checks if the provided token encompasses the specified offset.
 *
 * A token is considered to encompass the offset if the token's start offset is less than or equal to the offset and the token's end offset (plus one) is greater than or equal to the offset.
 *
 * @param token - The token with defined start and end offsets.
 * @param offset - The offset to verify against the token's boundaries.
 * @returns True if the token fully encompasses the offset; otherwise, false.
 */
function includeSymbol(token: IToken, offset: number) {
    return token.startOffset >= offset && token.endOffset as number + 1 <= offset
}