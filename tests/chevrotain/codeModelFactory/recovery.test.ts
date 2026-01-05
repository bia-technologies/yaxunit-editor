import { describe, expect, test, vi } from 'vitest'
import { editor } from 'monaco-editor-core'
import { ChevrotainCodeModelFactory } from '../../../src/bsl/chevrotain'
import { BslCodeModel, ProcedureDefinitionSymbol } from '../../../src/bsl/codeModel'

describe('Parser recovery', () => {
    const factory = new ChevrotainCodeModelFactory()

    // В тестах фабрика может дергать Monaco markers/logs — глушим, чтобы не шуметь.
    vi.spyOn(editor, 'setModelMarkers').mockImplementation(() => { })
    vi.spyOn(console, 'log').mockImplementation(() => { })
    vi.spyOn(console, 'debug').mockImplementation(() => { })
    vi.spyOn(console, 'error').mockImplementation(() => { })

    test('procedure with syntax error keeps body inside procedure', () => {
        const text = `Процедура ТестУспешно() Экспорт

    /f = 1;
    a = 2;
КонецПроцедуры`

        const model = factory.buildModel(text) as BslCodeModel

        // Должна быть одна процедура, а не "заголовок процедуры + куски тела снаружи".
        expect(model.children.length).toBe(1)
        const proc = model.children[0] as ProcedureDefinitionSymbol

        expect(proc).toBeInstanceOf(ProcedureDefinitionSymbol)
        expect(proc.name).toBe('ТестУспешно')
        expect(proc.isExport).toBe(true)

        // Тело должно содержать хотя бы корректное присваивание `a = 2`
        expect(proc.children.some((s: any) => s?.variable?.name === 'a')).toBe(true)

        // Граница процедуры должна включать `КонецПроцедуры`, а не заканчиваться на заголовке.
        expect(proc.endOffset).toBeGreaterThan(30)
    })
})

