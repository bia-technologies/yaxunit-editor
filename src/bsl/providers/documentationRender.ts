import { Member, Parameter, Signature } from "@/common/scope"

export function signatureLabel(method: Member | string, signature: Signature) {
    const name = (method as Member).name ?? method
    return name + '(' + signature.params.map(p => p.name + ':' + p.type).join(', ') + ')'
}

export function signatureDocumentation(method: Member, signature: Signature) {
    return signature.description === '' ? method.description : signature.description
}

export function parameterDocumentation(p: Parameter) {
    if (p.description) {
        return {
            value: p.description + '  \n**Тип:** ' + p.type
        }
    }
    return {
        value: '**Тип:** ' + p.type
    }
}