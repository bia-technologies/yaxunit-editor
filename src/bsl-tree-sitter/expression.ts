import { Node } from "web-tree-sitter"

export function symbolPosition(node: Node) {
    return {
        startLine: node.startPosition.row + 1,
        startColumn: node.startPosition.column + 1,
        endLine: node.endPosition.row + 1,
        endColumn: node.endPosition.column + 1,
    }
}
