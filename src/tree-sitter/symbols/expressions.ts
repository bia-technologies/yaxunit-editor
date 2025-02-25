import { Node } from "web-tree-sitter"

export enum ExpressionType {
    ctor,
    methodCall,
    fieldAccess,
    constant,
    unknown,
    none
}

export interface Expression {
    readonly node: Node
    readonly type: ExpressionType
    toString(): string
    getResultTypeId(): Promise<string | undefined> | string | undefined
}

export interface Accessible {
    readonly path: string[]
}

export interface ArgumentsOwner {
    readonly arguments: ArgumentInfo[]
}

export function isAccessible(expression: any): expression is Accessible {
    return (<Accessible>expression).path !== undefined
}

export function isArgumentsOwner(expression: any): expression is ArgumentsOwner {
    return (<ArgumentsOwner>expression).arguments !== undefined
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
    valueType: string|undefined
    constructor(node: Node, type: string|undefined) {
        super(node, ExpressionType.constant)
        this.valueType = type
    }
    toString() {
        return 'Constant'
    }

    getResultTypeId() {
        return this.valueType
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

export class Constructor extends BaseExpression implements ArgumentsOwner {
    readonly name: string
    readonly arguments: ArgumentInfo[]

    constructor(node: Node, name: string, args: ArgumentInfo[]) {
        super(node, ExpressionType.ctor)
        this.name = name
        this.arguments = args
    }
    toString() {
        return 'NEW ' + this.name
    }
    getResultTypeId() {
        return this.name
    }
}

export interface ArgumentInfo {
    startIndex: number,
    endIndex: number
}

export class FieldAccess extends BaseExpression implements Accessible {
    readonly name: string
    readonly path: string[]
    constructor(node: Node, name: string, path: string[]) {
        super(node, ExpressionType.fieldAccess)
        this.name = name
        this.path = path
    }
    toString() {
        return 'Filed ' + this.name + (this.path.length ? ' of ' + this.path.join('.') : ' global')
    }
    getResultTypeId() {
        return undefined
    }
}

export class Unknown extends BaseExpression implements Accessible {
    readonly name: string
    readonly path: string[]
    constructor(node: Node, name: string, path: string[]) {
        super(node, ExpressionType.fieldAccess)
        this.name = name
        this.path = path
    }
    toString() {
        return 'Unknown ' + this.name + (this.path.length ? ' of ' + this.path.join('.') : ' global')
    }
    getResultTypeId() {
        return undefined
    }
}

export class MethodCall extends BaseExpression implements Accessible, ArgumentsOwner {
    readonly name: string
    readonly path: string[]
    readonly arguments: ArgumentInfo[]

    constructor(node: Node, name: string, path: string[], args: ArgumentInfo[]) {
        super(node, ExpressionType.methodCall)
        this.name = name
        this.path = path
        this.arguments = args
    }

    toString() {
        return 'Call ' + this.name + (this.path.length ? ' of ' + this.path.join('.') : ' global')
    }
    getResultTypeId() {
        return undefined
    }
}