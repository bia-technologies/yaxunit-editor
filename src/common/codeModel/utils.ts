import { BaseSymbol, CodeSymbol, CompositeSymbol } from "./base";

export function descendantByOffset(offset: number, ...symbols: (BaseSymbol | undefined)[]): CodeSymbol | undefined {
    const symbol = symbols.find(s => s?.hitOffset(offset))
    if (symbol && isCompositeSymbol(symbol)) {
        const descendant = symbol.descendantByOffset(offset)
        if (descendant) {
            return descendant
        }
    }
    return symbol
}

export function isCompositeSymbol(symbol: CodeSymbol): symbol is CompositeSymbol {
    return (symbol as CompositeSymbol).descendantByOffset !== undefined
}