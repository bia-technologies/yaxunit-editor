import { Node } from "web-tree-sitter";

export function expressionTokens(expression: Node) {
    const child = expression.firstChild
    if (!child) {
        return [];
    }
    const tokens: (string | undefined)[] = []

    if (child.type === 'member_access') {
        child.children.forEach(n => tokens.push(nodeToken(n)))
    }
    else if (child.type === 'call_expression' || child.type === 'member_access') {
        child.children.forEach(n => tokens.push(nodeToken(n)))
        if (tokens.length >= 3) {
            tokens[tokens.length - 2] = tokens[tokens.length - 1]
            tokens.length--
        }
    } else if (child.type === 'identifier' || child.type === 'methodCall') {
        tokens.push(nodeToken(child))
    }
    return tokens
}

function nodeToken(node: Node | null) {
    if (!node) {
        return undefined
    }
    switch (node.type) {
        case 'identifier':
            return node.text
        case 'access':
            return nodeToken(node.child(0))
        case 'accessCall':
            return nodeToken(node.child(1))
        case 'accessProperty':
        case 'methodCall':
            return node.childForFieldName('name')?.text
        case 'accessIndex':
            return node.childForFieldName('index')?.text
        case '.':
            return '.'
        default:
            undefined

    }
}