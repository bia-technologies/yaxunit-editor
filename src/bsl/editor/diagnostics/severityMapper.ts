import { MarkerSeverity } from 'monaco-editor-core'
import { DiagnosticSeverity } from '@/bsl/diagnostics'

/**
 * Маппер для конвертации уровней серьезности диагностики в Monaco MarkerSeverity
 */
export class SeverityMapper {
    /**
     * Конвертирует DiagnosticSeverity в Monaco MarkerSeverity
     */
    static toMonaco(severity: DiagnosticSeverity): MarkerSeverity {
        switch (severity) {
            case DiagnosticSeverity.Error:
                return MarkerSeverity.Error
            case DiagnosticSeverity.Warning:
                return MarkerSeverity.Warning
            case DiagnosticSeverity.Info:
                return MarkerSeverity.Info
            case DiagnosticSeverity.Hint:
                return MarkerSeverity.Hint
            default:
                return MarkerSeverity.Info
        }
    }
}
