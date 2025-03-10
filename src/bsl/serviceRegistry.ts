import { BslCodeModelProvider, provider, factory } from "./codeModel/bslCodeModelProvider"
import { CodeModelFactory } from "./codeModel/codeModelFactory"

export default {
    get codeModelProvider(): BslCodeModelProvider {
        return provider
    },

    get codeModelFactory(): CodeModelFactory | undefined {
        return factory
    }
}