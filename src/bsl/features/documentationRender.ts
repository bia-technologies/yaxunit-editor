import { MethodSignature, Parameter, Symbol } from "../../scope";

export function signatureLabel(method: Symbol, signature: MethodSignature) {
    return method.name + '(' + signature.params.map(p => p.name + ':' + p.type).join(', ') + ')'
}

export function signatureDocumentation(method: Symbol, signature: MethodSignature) {
    return signature.description === '' ? method.description : signature.description
}
export function parameterDocumentation(p: Parameter) {
    if(p.description){
        return {
            value: p.description + '  \n**Тип:** ' + p.type
        }
    }
    return {
        value: '**Тип:** ' + p.type
    }
}