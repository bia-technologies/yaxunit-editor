import { MethodSignature, Symbol } from "../../scope";

export function signatureLabel(method: Symbol, signature: MethodSignature) {
    return method.name + '(' + signature.params.map(p => p.name + ':' + p.type).join(', ') + ')'
}

export function signatureDocumentation(method: Symbol, signature: MethodSignature) {
    return signature.description === '' ? method.description : signature.description
}