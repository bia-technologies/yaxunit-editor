/**
 * Типы и интерфейсы для системы диагностики
 */

/**
 * Диагностическое сообщение - общий формат для всех видов ошибок
 */
export interface DiagnosticMessage {
    /** Текст сообщения об ошибке */
    message: string
    /** Начальное смещение в тексте */
    startOffset: number
    /** Конечное смещение в тексте */
    endOffset: number
    /** Уровень серьезности */
    severity: DiagnosticSeverity
    /** Источник диагностики */
    source: DiagnosticSource
    /** Код ошибки (опционально) */
    code?: string
}

/**
 * Уровень серьезности диагностического сообщения
 */
export enum DiagnosticSeverity {
    /** Ошибка - критическая проблема */
    Error = 'error',
    /** Предупреждение - потенциальная проблема */
    Warning = 'warning',
    /** Информация - некритическая информация */
    Info = 'info',
    /** Подсказка - рекомендация */
    Hint = 'hint'
}

/**
 * Источник диагностического сообщения
 */
export enum DiagnosticSource {
    /** Ошибка лексического анализа */
    Lexer = 'lexer',
    /** Ошибка синтаксического анализа */
    Parser = 'parser',
    /** Семантическая ошибка */
    Semantic = 'semantic',
    /** Ошибка валидации */
    Validation = 'validation'
}
