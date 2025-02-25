import { Node } from "web-tree-sitter"

export function expressionTokens(expression: Node) {
    const child = expression.firstChild
    if (!child) {
        return [];
    }
    let tokens: (string | undefined)[] = []

    if (child.type === 'member_access') {
        child.children.forEach(n => tokens.push(nodeToken(n)))
    }
    else if (child.type === 'call_expression' || child.type === 'member_access') {
        child.children.forEach(n => tokens.push(nodeToken(n)))
        if (tokens.length >= 3) {
            tokens = tokens.filter(t => t !== '.')
        }
    } else if (child.type === 'identifier' || child.type === 'methodCall') {
        tokens.push(nodeToken(child))
    }
    return tokens
}

export function symbolPosition(node: Node) {
    return {
        startLine: node.startPosition.row + 1,
        startColumn: node.startPosition.column + 1,
        endLine: node.endPosition.row + 1,
        endColumn: node.endPosition.column + 1,
    }
}

function nodeToken(node: Node | null) {
    if (!node) {
        return undefined
    }
    switch (node.type) {
        case 'property':
            return node.text
        case 'method_call':
            return node.childForFieldName('name')?.text
        case 'index':
            return node.text
        case '.':
            return '.'
        default:
            return undefined
    }
}