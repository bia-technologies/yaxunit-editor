import { editor } from 'monaco-editor-core'
import { DiagnosticMessage } from '@/bsl/diagnostics'
import { SeverityMapper } from './severityMapper'

/**
 * Менеджер для управления маркерами Monaco.
 * Отвечает за конвертацию диагностических сообщений в маркеры и их установку в редакторе.
 */
export class MarkersManager {
    private readonly source = 'bsl-diagnostics'

    constructor(private model: editor.ITextModel) {}

    /**
     * Конвертирует диагностические сообщения в маркеры Monaco
     */
    convertToMarkers(diagnostics: DiagnosticMessage[]): editor.IMarkerData[] {
        return diagnostics.map(diagnostic => {
            const startPosition = this.model.getPositionAt(diagnostic.startOffset)
            const endPosition = this.model.getPositionAt(diagnostic.endOffset)

            return {
                severity: SeverityMapper.toMonaco(diagnostic.severity),
                message: diagnostic.message,
                startLineNumber: startPosition.lineNumber,
                startColumn: startPosition.column,
                endLineNumber: endPosition.lineNumber,
                endColumn: endPosition.column,
                source: diagnostic.source,
                code: diagnostic.code
            }
        })
    }

    /**
     * Обновляет маркеры в редакторе
     */
    updateMarkers(diagnostics: DiagnosticMessage[]): void {
        const markers = this.convertToMarkers(diagnostics)
        editor.setModelMarkers(this.model, this.source, markers)
    }

    /**
     * Очищает все маркеры
     */
    clearMarkers(): void {
        editor.setModelMarkers(this.model, this.source, [])
    }
}
