import { ChevrotainSitterCodeModelFactory } from '../src/bsl/chevrotain'
import { BslCodeModel } from '../src/bsl/codeModel'
import { descendantByOffset } from '../src/bsl/chevrotain/utils'
import { describe, expect, test } from 'vitest'

const factory = new ChevrotainSitterCodeModelFactory()

describe('descendantByOffset', () => {

    test('start', () => {
        const model = buildModel('a = 2')
        const symbol = descendantByOffset(0, model)

        expect(symbol).toMatchObject({ name: 'a' })
    })

    test('end', () => {
        const model = buildModel('a = 2')
        const symbol = descendantByOffset(5, model)

        expect(symbol).toMatchObject({ value: '2' })
    })
})

function buildModel(content: string) {
    return factory.buildModel(content) as BslCodeModel
}