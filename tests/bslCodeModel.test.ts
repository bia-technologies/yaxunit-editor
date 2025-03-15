import { ChevrotainSitterCodeModelFactory } from '../src/bsl/chevrotain'
import { BslCodeModel } from '../src/bsl/codeModel'
import { descendantByOffset } from '../src/common/codeModel/utils'
import { describe, expect, test } from 'vitest'

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
    return ChevrotainSitterCodeModelFactory.buildModel(content) as BslCodeModel
}