import { ChevrotainSitterCodeModelFactory } from '../src/bsl/chevrotain'
import { BslCodeModel } from '../src/bsl/codeModel'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

describe('descendantByOffset', () => {

    test('start', () => {
        const model = buildModel('a = 2')
        const symbol = model.descendantByOffset(0)

        expect(symbol).toMatchObject({ name: 'a' })
    })

    test('end', () => {
        const model = buildModel('a = 2')
        const symbol = model.descendantByOffset(5)

        expect(symbol).toMatchObject({ value: '2' })
    })

})

function buildModel(content: string) {
    return ChevrotainSitterCodeModelFactory.buildModel(content) as BslCodeModel
}