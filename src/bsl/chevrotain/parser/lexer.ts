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
            let { startIndex, endIndex, includeStart, includeEnd } = findTokens(this.moduleTokens, start, end)

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
                    for (let index = startMove; index < this.moduleTokens.length; index++) {
                        const token = this.moduleTokens[index];
                        token.startOffset += offsetDiff;
                        (token.endOffset as number) += offsetDiff
                    }
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

function findTokens(tokens: IToken[], startOffset: number, endOffset: number) {
    let startIndex = -1, endIndex = -1
    let includeStart = false, includeEnd = false

    const lastTokenIndex = tokens.length - 1
    let lo = 0, hi = lastTokenIndex, mid = 0, token

    if (tokens[hi].endOffset as number + 1 < startOffset) {
        return { startIndex: hi, endIndex: hi, includeStart, includeEnd: true }
    }
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

    hi = lastTokenIndex
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
        }
    } else {
        includeEnd = true
    }

    if (startIndex === endIndex && !includeStart && !includeEnd) {
        token = tokens[endIndex]
        includeStart = token.startOffset > startOffset && (token.endOffset as number + 1) < endOffset
    }
    return { startIndex, endIndex, includeStart, includeEnd }
}

function includeSymbol(token: IToken, offset: number) {
    return token.startOffset >= offset && token.endOffset as number + 1 <= offset
}