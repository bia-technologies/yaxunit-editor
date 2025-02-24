import { Node } from "web-tree-sitter"
import { Constant, Constructor, Expression, MethodCall, None } from "./expressions";

export function createSymbol(currentNode: Node): Expression {
    let symbol: Expression | undefined = undefined
    if (currentNode.type === 'source_file' || currentNode.type === 'procedure_definition' || currentNode.type === 'function_definition') {
        symbol = new None(currentNode)
    } else {
        symbol = createSymbolForNode(currentNode)
    }
    if (!symbol) {
        const currentExpression = findParenNode(currentNode, (n) => {
            return n.type === 'call_expression' || n.type === 'property_access' || n.type === 'expression' || n.type === 'arguments' || n.type === 'const_expression' || n.type === 'ERROR' || n.type === 'new_expression'
        });
        if (currentExpression) {
            symbol = createSymbolForNode(currentExpression)
        }
    }

    if (!symbol) {
        symbol = new None(currentNode)
    }

    return symbol
}

function createSymbolForNode(node: Node): Expression | undefined {
    switch (node.type) {
        case 'new_expression':
            return createConstructorExpression(node)
        case 'const_expression':
            return new Constant(node)
        case 'call_expression':
            return createMethodCallExpression(node)
        default:
            return undefined
    }

}

export function createMethodSymbol(currentNode: Node): Expression {
    if (currentNode.type === 'source_file' || currentNode.type === 'procedure_definition' || currentNode.type === 'function_definition') {
        return new None(currentNode)
    } else if (currentNode.type === 'new_expression') {
        return createConstructorExpression(currentNode)
    }
    const currentExpression = findParenNode(currentNode, (n) => {
        return n.type === 'call_expression' || n.type === 'ERROR' || n.type === 'new_expression'
    });
    if (!currentExpression) {
        return new None(currentNode)
    }

    switch (currentExpression.type) {
        case 'new_expression':
            return createConstructorExpression(currentExpression)
        case 'const_expression':
            return new Constant(currentExpression)
        case 'call_expression':
            return createMethodCallExpression(currentExpression)
        default:
            return new None(currentExpression)
    }
}

function createConstructorExpression(node: Node): Expression {
    return new Constructor(node, node.namedChild(1)?.text ?? '')
}

function createMethodCallExpression(node: Node): Expression {
    const tokens = collectTokens(node)
    return new MethodCall(node, tokens.pop() ?? '', tokens)
}

function collectTokens(currentExpression: Node) {
    const tokens: string[] = []
    let node: Node | null = currentExpression.firstChild;
    let containsIndex = false
    while (node) {
        switch (node.type) {
            case 'method_call':
                tokens.push(node.childForFieldName('name')?.text || '')
                break
            case 'identifier':
            case 'property':
                tokens.push(node.text)
                break
            case 'index':
                tokens.push(node.text)
                containsIndex = true
                break
        }
        node = node.nextSibling
    }

    // if (containsIndex) {
    //     console.debug('Unsupport index access')
    //     // TODO support index access
    //     return undefined
    // }
    return tokens
}

function findParenNode(node: Node, predicate: (node: Node) => boolean) {
    let currentNode: Node | null = node

    while (currentNode !== null && (currentNode = currentNode.parent) !== null) {
        if (predicate(currentNode)) {
            return currentNode
        }
    }
    return undefined
}

