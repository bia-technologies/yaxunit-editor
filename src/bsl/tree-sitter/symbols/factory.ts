import { Node } from "web-tree-sitter"
import { ArgumentInfo, Constant, Constructor, Expression, FieldAccess, MethodCall, None, Unknown } from "../../expressions/expressions";
import { BslTokenTypes } from "../bslTokenTypes";

export function resolveSymbol(currentNode: Node, position: number | undefined = undefined): Expression {
    return createSymbolForSuitableNode(currentNode, position, (n) => {
        return n.type === BslTokenTypes.call_expression
            || n.type === BslTokenTypes.method_call
            || n.type === BslTokenTypes.property_access
            || n.type === BslTokenTypes.expression
            || n.type === BslTokenTypes.const_expression
            || n.type === BslTokenTypes.ERROR
            || n.type === BslTokenTypes.new_expression
            || n.type === BslTokenTypes.access
            || n.type === BslTokenTypes.arguments
            || n.type === BslTokenTypes.assignment_statement
    })
}

export function resolveMethodSymbol(currentNode: Node): Constructor | MethodCall | undefined {
    const expression = createSymbolForSuitableNode(currentNode, undefined, (n) => {
        return n.type === BslTokenTypes.method_call
            || n.type === BslTokenTypes.new_expression
    })

    return (expression as Constructor | MethodCall)
}

function createSymbolForSuitableNode(node: Node, position: number | undefined, predicate: (node: Node) => boolean) {
    let symbol: Expression | undefined = undefined
    if (node.type === BslTokenTypes.source_file
        || node.type === BslTokenTypes.procedure_definition
        || node.type === BslTokenTypes.function_definition) {
        symbol = new None(node)
    } else if (predicate(node)) {
        symbol = createSymbolForNode(node, position)
    }
    if (!symbol) {
        const currentExpression = findParenNode(node, predicate)
        if (currentExpression) {
            if (node.type === BslTokenTypes.identifier && currentExpression.type === BslTokenTypes.assignment_statement) {
                symbol = createSymbolForNode(node, position)
            } else {
                symbol = createSymbolForNode(currentExpression, position)
                node = currentExpression
            }
        }
    }

    if (!symbol) {
        symbol = new None(node)
    }

    return symbol
}

export function createSymbolForNode(node: Node, position: number | undefined = undefined): Expression | undefined {
    switch (node.type) {
        case BslTokenTypes.expression:
            return node.firstNamedChild ? createSymbolForNode(node.firstNamedChild, position) : undefined
        case BslTokenTypes.new_expression:
            return createConstructorExpression(node)
        case BslTokenTypes.const_expression:
            return createConstantExpression(node)
        case BslTokenTypes.method_call:
        case BslTokenTypes.call_expression:
            return createMethodCallExpression(node, position)
        case BslTokenTypes.access:
        case BslTokenTypes.identifier:
        case BslTokenTypes.property_access:
            return createFiledAccessExpression(node, position)
        case BslTokenTypes.ERROR:
            return createUnknownExpression(node, position)
        case BslTokenTypes.arguments:
            return new None(node)
        default:
            return undefined
    }
}

function createConstantExpression(node: Node): Expression {
    let type: string | undefined
    if (node.firstNamedChild) {
        type = constValues()[node.firstNamedChild.type]
    }
    return new Constant(node, type)
}

function constValues() {
    const res: { [key: string]: string } = {}
    res[BslTokenTypes.number] = 'Число'
    res[BslTokenTypes.date] = 'Дата'
    res[BslTokenTypes.string] = 'Строка'
    res[BslTokenTypes.boolean] = 'Булево'
    res[BslTokenTypes.undefined_keyword] = 'Неопределено'
    res[BslTokenTypes.null_keyword] = 'NULL'

    return res
}

function createConstructorExpression(node: Node): Expression {
    const typeNode = node.childForFieldName("type")
    const args = collectArguments(node)
    return new Constructor(node, typeNode?.text ?? '', args)
}

function createMethodCallExpression(node: Node, _: number | undefined): Expression {
    if (node.type === BslTokenTypes.call_expression) {
        const tokens = collectAccessTokens(node, undefined)
        const args = collectArguments(node.lastNamedChild as Node)
        return new MethodCall(node, tokens.pop() ?? '', tokens, args)
    } else {
        const nameNode = node.childForFieldName("name")
        const tokens = node.parent ? collectPathTokens(node) : []
        const args = collectArguments(node)
        return new MethodCall(node, nameNode?.text ?? '', tokens, args)
    }
}

function createFiledAccessExpression(node: Node, position: number | undefined): Expression {
    const tokens = collectAccessTokens(node, position)
    return new FieldAccess(node, tokens.pop() ?? '', tokens)
}

function createUnknownExpression(node: Node, position: number | undefined): Expression {

    let tokens: string[]
    const child = node.firstNamedChild
    if (child && child.type === BslTokenTypes.identifier) {
        tokens = [child.text]
    } else if (child && child.type === 'access') {
        tokens = collectAccessTokens(node, position)
        tokens.push('')
    } else {
        tokens = collectAccessTokens(node, position)
    }

    return new Unknown(node, tokens.pop() ?? '', tokens)
}

function collectArguments(node: Node): ArgumentInfo[] {
    const argumentsNode = node.childForFieldName(BslTokenTypes.arguments)
    if (!argumentsNode) {
        return []
    }
    const args: ArgumentInfo[] = []
    let start = argumentsNode.startIndex + 1
    for (const child of argumentsNode.children) {
        if (!child || (child.text !== ',' && child.text !== ')')) { // Считаем запятые, потому что могут быть пропущены значения параметров метода
            continue
        }
        args.push({
            startIndex: start,
            endIndex: child.startIndex
        })
        if (child.text === ')') {
            return args
        }
        start = child.endIndex
    }
    if (args.length) { // Незакрытые аргументы
        args.push({
            startIndex: start,
            endIndex: argumentsNode.endIndex
        })
    }
    return args
}

function collectPathTokens(currentNode: Node) {
    if (!currentNode.parent) {
        return []
    }
    const accessNode = currentNode.parent.firstNamedChild
    if (!accessNode || accessNode.type !== BslTokenTypes.access) {
        return []
    }
    return collectAccessTokens(accessNode, undefined)
}

function collectAccessTokens(accessNode: Node, position: number | undefined) {
    const tokens: string[] = []
    let node: Node | null = accessNode.type !== BslTokenTypes.identifier ? accessNode.firstChild : accessNode;
    // let containsIndex = false
    let lastNode: Node | undefined = undefined
    while (node) {
        if (position && node.startIndex > position) {
            break
        }
        lastNode = node
        switch (node.type) {
            case BslTokenTypes.method_call:
                tokens.push(node.childForFieldName('name')?.text ?? '')
                break
            case BslTokenTypes.access:
                tokens.push(...collectAccessTokens(node, position))
                break
            case BslTokenTypes.identifier:
            case BslTokenTypes.property:
                tokens.push(node.text)
                break
            case BslTokenTypes.index:
                tokens.push(node.text)
                // containsIndex = true
                break
        }
        node = node.nextSibling
    }
    if (lastNode?.text === '.') {
        tokens.push('')
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