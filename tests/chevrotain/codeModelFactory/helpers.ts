import { ChevrotainCodeModelFactory } from '../../../src/bsl/chevrotain'
import { expect, vi } from 'vitest'
import { ModuleModel } from '../../../src/bsl/moduleModel'
import { BslCodeModel } from '../../../src/bsl/codeModel'
import { editor } from 'monaco-editor-core'

/**
 * Настройка тестового окружения: создает фабрику и мокирует зависимости
 */
export function setupTestEnvironment() {
    const codeModelFactory = new ChevrotainCodeModelFactory()
    vi.spyOn(editor, 'setModelMarkers').mockImplementation(() => { })
    vi.spyOn(console, 'log').mockImplementation(() => { })
    vi.spyOn(console, 'debug').mockImplementation(() => { })
    vi.spyOn(console, 'error').mockImplementation(() => { })
    return codeModelFactory
}

/**
 * Создает мок ModuleModel
 */
export function createMockModuleModel(content: string): ModuleModel {
    return {
        getValue: () => content,
        getPositionAt: () => ({ lineNumber: 1, column: 1 })
    } as unknown as ModuleModel
}

/**
 * Проверяет, что модель содержит процедуру с указанным именем
 */
export function expectProcedure(model: BslCodeModel, name: string) {
    expect(model.children.length).toBeGreaterThan(0)
    expect(model.children[0].name).toBe(name)
    return model.children[0]
}

/**
 * Проверяет, что выражение соответствует ожидаемому значению
 */
export function expectExpression(expression: any, expected: any) {
    expect(expression).toMatchObject(expected)
}

/**
 * Проверяет, что присваивание содержит переменную и выражение
 */
export function expectAssignment(assignment: any, variableName: string, expression: any) {
    expect(assignment.variable.name).toBe(variableName)
    expectExpression(assignment.expression, expression)
}
