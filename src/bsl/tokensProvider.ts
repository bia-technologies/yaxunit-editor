import { editor, Position } from 'monaco-editor-core';
import { EditorScope } from '@/scope';
import { Node } from 'web-tree-sitter';

export interface TokensSequence {
    tokens: string[],
    lastSymbol: string,
    closed: boolean,
    start?: Position,
    end?: Position
}

export default {
    resolve: collectTokens,
    currentMethod
}

function currentMethod(model: editor.ITextModel, startPosition: Position): TokensSequence | undefined {
    const tree = EditorScope.getScope(model).getAst()
    const pos = model.getOffsetAt(startPosition)

    const currentNode = tree.getCurrentNode(pos)
    if (!currentNode) {
        return undefined
    }

    const currentExpression = tree.findParenNode(currentNode, (n) => {
        return n.type === 'call_expression'
    });
    if (!currentExpression) {
        return
    }

    const tokens: string[] = []
    let node: Node | null = currentExpression.firstChild;
    let containsIndex = false
    while (node) {
        if (node.startIndex > pos) {
            break
        }
        switch (node.type) {
            case 'method_call':
                tokens.push(node.childForFieldName('name')?.text || '')
                break
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

    if(containsIndex){
        // TODO support index access
        return undefined
    }
    return {
        tokens: tokens.reverse(), closed: true, lastSymbol: tokens[0]
    }
}

function currentProperty(model: editor.ITextModel, startPosition: Position): TokensSequence | undefined {
    const tree = EditorScope.getScope(model).getAst()
    const pos = model.getOffsetAt(startPosition)

    const currentNode = tree.getCurrentNode(pos)
    if (!currentNode) {
        return undefined
    }

    if (currentNode.type === 'source_file' || currentNode.type === 'procedure_definition' || currentNode.type === 'function_definition') {
        return {
            closed: false,
            tokens: [],
            lastSymbol: ''
        }
    }
    const currentExpression = tree.findParenNode(currentNode, (n) => {
        return n.type === 'call_expression' || n.type === 'property_access' || n.type === 'expression' || n.type === 'arguments' || n.type === 'const_expression' || n.type === 'ERROR'
    });
    if (!currentExpression || currentExpression.type === 'const_expression') {
        return
    }

    const tokens: string[] = []
    let node: Node | null = currentExpression.firstChild;
    let containsIndex = false
    while (node) {
        if (node.endIndex >= pos) {
            break
        }
        switch (node.type) {
            case 'method_call':
                tokens.push(node.childForFieldName('name')?.text || '')
                break
            // case 'identifier':
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

    if(containsIndex){
        // TODO support index access
        return undefined
    }
    return {
        tokens: tokens.reverse(), closed: true, lastSymbol: tokens[0]
    }
}

function collectTokens(model: editor.ITextModel, startPosition: Position): TokensSequence | undefined {
    return currentProperty(model, startPosition)
}
