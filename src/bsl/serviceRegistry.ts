import { BslCodeModelProvider, provider } from "./codeModel/bslCodeModelProvider"

export default {
    get codeModelProvider(): BslCodeModelProvider {
        return provider
    }
}