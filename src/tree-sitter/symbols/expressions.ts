import { TypeDefinition } from "@/scope"
import { Node } from "web-tree-sitter"

export enum ExpressionType {
    constructor,
    methodCall,
    constant,
    none
}

export interface Expression {
    readonly node: Node
    readonly type: ExpressionType
    toString(): string
    getResultTypeId(): Promise<string | undefined> | string | undefined
}

abstract class BaseExpression implements Expression {
    readonly type: ExpressionType
    readonly node: Node
    constructor(node: Node, type: ExpressionType) {
        this.type = type
        this.node = node
    }
    abstract getResultTypeId(): Promise<string | undefined> | string | undefined
}

export class Constant extends BaseExpression {
    constructor(node: Node) {
        super(node, ExpressionType.constant)
    }
    toString() {
        return 'Constant'
    }

    getResultTypeId() {
        return 'Число'
    }
}

export class None extends BaseExpression {
    constructor(node: Node) {
        super(node, ExpressionType.none)
    }
    toString() {
        return 'None'
    }
    getResultTypeId() {
        return undefined
    }
}

export class Constructor extends BaseExpression {
    readonly name: string

    constructor(node: Node, name: string) {
        super(node, ExpressionType.constructor)
        this.name = name
    }
    toString() {
        return 'NEW ' + this.name
    }
    getResultTypeId() {
        return this.name
    }
}

export class MethodCall extends BaseExpression {
    readonly name: string
    readonly path: string[]
    constructor(node: Node, name: string, path: string[]) {
        super(node, ExpressionType.methodCall)
        this.name = name
        this.path = path
    }

    toString() {
        return 'Call ' + this.name + (this.path.length ? ' of ' + this.path.join('.') : ' global')
    }
    getResultTypeId() {
        return undefined
    }
}