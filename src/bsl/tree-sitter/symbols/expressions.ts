import { scopeProvider } from "@/bsl/scopeProvider"
import { Scope } from "@/bsl/scope/scope"
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
    getResultTypeId(scope: Scope | undefined): Promise<string | undefined> | string | undefined
}

export interface Accessible {
    readonly name: string
    readonly path: string[]
}

export interface ArgumentsOwner {
    readonly arguments: ArgumentInfo[]
}

export interface ArgumentInfo {
    startIndex: number,
    endIndex: number
}

abstract class BaseExpression implements Expression {
    readonly type: ExpressionType
    readonly node: Node
    constructor(node: Node, type: ExpressionType) {
        this.type = type
        this.node = node
    }
    abstract getResultTypeId(scope: Scope | undefined): Promise<string | undefined> | string | undefined
}

export class Constant extends BaseExpression {
    valueType: string | undefined
    constructor(node: Node, type: string | undefined) {
        super(node, ExpressionType.constant)
        this.valueType = type
    }
    toString() {
        return 'Константное значение ' + this.node.text
    }

    getResultTypeId(_: Scope | undefined) {
        return this.valueType
    }
}

export class None extends BaseExpression {
    constructor(node: Node) {
        super(node, ExpressionType.none)
    }
    toString() {
        return 'Неизвестный'
    }
    getResultTypeId(_: Scope | undefined) {
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
        return 'Конструктор ' + this.name
    }
    getResultTypeId(_: Scope | undefined) {
        return this.name
    }
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

    async getResultTypeId(scope: Scope | undefined) {
        return scope ? (await scopeProvider.resolveSymbolMember(scope, this))?.type : undefined
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

    async getResultTypeId(scope: Scope | undefined) {
        return scope ? (await scopeProvider.resolveSymbolMember(scope, this))?.type : undefined
    }
}

export class Unknown extends BaseExpression implements Accessible {
    readonly name: string
    readonly path: string[]
    constructor(node: Node, name: string, path: string[]) {
        super(node, ExpressionType.unknown)
        this.name = name
        this.path = path
    }

    toString() {
        return 'Unknown ' + this.name + (this.path.length ? ' of ' + this.path.join('.') : ' global')
    }

    async getResultTypeId(scope: Scope | undefined) {
        return scope ? (await scopeProvider.resolveSymbolMember(scope, this))?.type : undefined
    }
}

export function isAccessible(expression: any): expression is Accessible {
    return (<Accessible>expression).path !== undefined
}

export function isArgumentsOwner(expression: any): expression is ArgumentsOwner {
    return (<ArgumentsOwner>expression).arguments !== undefined
}
