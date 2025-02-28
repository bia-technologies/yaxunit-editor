import { Node } from "web-tree-sitter"

export class BaseSymbol {
    node: Node
    constructor(node: Node) {
        this.node = node
    }

    get startLine() { return this.node.startPosition.row }
    get startColumn() { return this.node.startPosition.column }
    get endLine() { return this.node.endPosition.row }
    get endColumn() { return this.node.endPosition.column }
}

export class NamedSymbol extends BaseSymbol {
    name: string

    constructor(node: Node, name?: string) {
        super(node)
        this.name = name ?? ''
    }
}