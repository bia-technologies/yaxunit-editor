export enum MemberType {
    property = 0,
    function = 1,
    procedure = 2,
    enum = 3,
    variable = 4,
}

export interface Member {
    kind: MemberType,
    name: string,
    type?: string | Promise<string | undefined>,
    description?: string
}

export interface MethodMember extends Member, Signature {
}

export interface PlatformMethodSymbol extends Member {
    signatures: Signature[],
}

export interface Constructor {
    name: string,
    type: string,
    signatures: Signature[],
}

export interface Signature {
    name: string,
    description?: string,
    params: Parameter[],
}

export interface Parameter {
    name: string,
    type: string,
    description?: string
}

export function isPlatformMethod(member: Member): member is PlatformMethodSymbol {
    return (<PlatformMethodSymbol>member).signatures !== undefined
}

export function isMethod(member: Member): member is MethodMember {
    return (<MethodMember>member).params !== undefined
}

