import { SymbolPosition } from "@/common/codeModel"
import { SyntaxNode } from "lezer-bsl"

export function nodePosition(node: SyntaxNode): SymbolPosition {
    return {
        startOffset: node.from,
        endOffset: node.to
    }
}

export function getNodeText(node: SyntaxNode | null, source: string): string | undefined {
    return node ? source.slice(node.from, node.to) : undefined
}

export function findChildByType(node: SyntaxNode, typeId: number): SyntaxNode | null {
    for (let child = node.firstChild; child; child = child.nextSibling) {
        if (child.type.id === typeId) {
            return child
        }
    }
    return null
}

export function findAllChildrenByType(node: SyntaxNode, typeId: number): SyntaxNode[] {
    const children: SyntaxNode[] = []
    for (let child = node.firstChild; child; child = child.nextSibling) {
        if (child.type.id === typeId) {
            children.push(child)
        }
    }
    return children
}

export function hasChildOfType(node: SyntaxNode, typeId: number): boolean {
    return findChildByType(node, typeId) !== null
}

export function sort(symbols: { position: SymbolPosition }[]): void {
    symbols.sort((a, b) => a.position.startOffset - b.position.startOffset)
}
