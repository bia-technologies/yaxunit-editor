import tokensProvider from '../src/bsl/tokensProvider';
import { editor, Position } from 'monaco-editor';
import { expect, test } from 'vitest'

const model = editor.createModel('ЮТест.ОжидаетЧто(ТаблицаТоваров).ИмеетТип("ТаблицаЗначений")', 'bsl');

test('Начало последовательности', ()=>{
    const result = tokensProvider.resolve(model, new Position(1,1))
    expect(result?.tokens).toStrictEqual([])
    expect(1+1).toBe(2)
})

test('Перед точкой точки', ()=>{
    const result = tokensProvider.resolve(model, new Position(1,6))
    expect(result?.closed).toBe(false)
    expect(result?.tokens).toStrictEqual(['ЮТест'])
    expect(1+1).toBe(2)
})

test('После точки', ()=>{
    const result = tokensProvider.resolve(model, new Position(1,7))
    expect(result?.closed).toBe(true)
    expect(result?.tokens).toStrictEqual(['ЮТест'])
    expect(1+1).toBe(2)
})

test('Начало последовательности', ()=>{
    const result = tokensProvider.resolve(model, new Position(1,32))
    expect(result?.tokens).toStrictEqual(['ЮТест', 'ОжидаетЧто(ТаблицаТоваров)'])
    expect(1+1).toBe(2)
})