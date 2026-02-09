import { ModuleModel } from '../../src/bsl/moduleModel'

export function createMockModel(initialValue: string): ModuleModel {
    let value = initialValue
    return {
        getValue: () => value,
        setValue: (newValue: string) => { value = newValue },
        getVersionId: () => 1,
        getAlternativeVersionId: () => 1
    } as ModuleModel
}

export function generateLargeCode(lines: number): string {
    const procedures = []
    for (let i = 0; i < lines / 10; i++) {
        procedures.push(`
Процедура Процедура${i}()
    Перем Переменная${i};
    Переменная${i} = ${i};
    Возврат Переменная${i};
КонецПроцедуры`)
    }
    return procedures.join('\n\n')
}
