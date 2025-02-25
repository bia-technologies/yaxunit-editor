import { Node } from "web-tree-sitter"
import { ArgumentInfo, Constant, Constructor, Expression, FieldAccess, MethodCall, None } from "./expressions";

export function resolveSymbol(currentNode: Node): Expression {
    return createSymbolForSuitableNode(currentNode, (n) => {
        return n.type === 'call_expression' || n.type === 'method_call' || n.type === 'property_access' || n.type === 'expression' || n.type === 'const_expression' || n.type === 'ERROR' || n.type === 'new_expression' || n.type === 'access'
    })
}

export function resolveMethodSymbol(currentNode: Node): Constructor | MethodCall | undefined {
    const expression = createSymbolForSuitableNode(currentNode, (n) => {
        return n.type === 'method_call' || n.type === 'new_expression'
    })

    return (expression as Constructor | MethodCall)
}

function createSymbolForSuitableNode(node: Node, predicate: (node: Node) => boolean) {
    let symbol: Expression | undefined = undefined
    if (node.type === 'source_file' || node.type === 'procedure_definition' || node.type === 'function_definition') {
        symbol = new None(node)
    } else if (predicate(node)) {
        symbol = createSymbolForNode(node)
    }
    if (!symbol) {
        const currentExpression = findParenNode(node, predicate);
        if (currentExpression) {
            node = currentExpression
            symbol = createSymbolForNode(node)
        }
    }

    if (!symbol) {
        symbol = new None(node)
    }

    return symbol
}

function createSymbolForNode(node: Node): Expression | undefined {
    switch (node.type) {
        case 'new_expression':
            return createConstructorExpression(node)
        case 'const_expression':
            return createConstantExpression(node)
        case 'method_call':
            return createMethodCallExpression(node)
        case 'access':
        case 'expression':
        case 'property_access':
            return createFiledAccessExpression(node)
        default:
            return undefined
    }
}

function createConstantExpression(node: Node): Expression {
    let type: string | undefined
    if (node.firstNamedChild) {
        type = {'number': 'Число',
            'date': 'Дата',
            'string': 'Строка',
            'boolean': 'Булево',
            'UNDEFINED_KEYWORD': 'Неопределено',
            'NULL_KEYWORD': 'NULL',
        }[node.firstNamedChild.type]
    }
    return new Constant(node, type)
}

function createConstructorExpression(node: Node): Expression {
    const typeNode = node.childForFieldName("type")
    const args = collectArguments(node)
    return new Constructor(node, typeNode?.text ?? '', args)
}

function createMethodCallExpression(node: Node): Expression {
    const nameNode = node.childForFieldName("name")
    const tokens = node.parent ? collectPathTokens(node) : []
    const args = collectArguments(node)
    return new MethodCall(node, nameNode?.text ?? '', tokens, args)
}

function createFiledAccessExpression(node: Node): Expression {
    const tokens = collectAccessTokens(node)
    return new FieldAccess(node, tokens.pop() ?? '', tokens)
}

function collectArguments(node: Node): ArgumentInfo[] {
    const argumentsNode = node.childForFieldName("arguments")
    const args: ArgumentInfo[] = argumentsNode?.namedChildren
        .filter(n => n != null)
        .map(n => {
            return {
                startIndex: n.previousSibling?.endIndex ?? n.startIndex,
                endIndex: n.endIndex
            }
        }) ?? []
    return args
}

function collectPathTokens(currentNode: Node) {
    if (!currentNode.parent) {
        return []
    }
    const accessNode = currentNode.parent.firstNamedChild
    if (!accessNode || accessNode.type !== 'access') {
        return []
    }
    return collectAccessTokens(accessNode)
}

function collectAccessTokens(accessNode: Node) {
    const tokens: string[] = []
    let node: Node | null = accessNode.firstChild;
    // let containsIndex = false
    while (node) {
        switch (node.type) {
            case 'method_call':
                tokens.push(node.childForFieldName('name')?.text || '')
                break
            case 'access':
                tokens.push(...collectAccessTokens(node))
                break
            case 'identifier':
            case 'property':
                tokens.push(node.text)
                break
            case 'index':
                tokens.push(node.text)
                // containsIndex = true
                break
        }
        node = node.nextSibling
    }
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