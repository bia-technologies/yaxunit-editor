import { Node } from "web-tree-sitter"

export interface CodeSymbol {
    startLine: number,
    startColumn: number,
    endLine: number,
    endColumn: number,

}
export class BaseSymbol {
    protected node: Node
    constructor(node: Node) {
        this.node = node
    }

    get startLine() { return this.node.startPosition.row }
    get startColumn() { return this.node.startPosition.column }
    get endLine() { return this.node.endPosition.row }
    get endColumn() { return this.node.endPosition.column }
}

export interface ExpressionSymbol extends CodeSymbol {
    type?: string
    value?: string
}

export interface NamedSymbol {
    name: string
}