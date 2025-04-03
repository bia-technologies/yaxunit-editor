import { TestsModel } from '../test-model'
import { editor, MarkerSeverity, Uri } from 'monaco-editor-core'
import { TestModelRender } from '../interfaces'
import { Error } from '../test-model/report'
import { parseTrace } from './stackTrace'


export class TestMessageMarkersProvider implements TestModelRender {
    editor: editor.IStandaloneCodeEditor

    constructor(editor: editor.IStandaloneCodeEditor) {
        this.editor = editor
    }

    update(model: TestsModel): void {
        const editorModel = this.editor.getModel()
        if (!editorModel) {
            return
        }
        const markers: editor.IMarkerData[] = this.getTestsMarkers(model, editorModel)
        editor.setModelMarkers(editorModel, "runtime-errors", markers);
    }

    private getTestsMarkers(testsModel: TestsModel, editorModel: editor.ITextModel): editor.IMarkerData[] {
        const markers: editor.IMarkerData[] = []

        testsModel.getTests().filter(t => t.errors).forEach(t => {
            (t.errors as Error[]).map(e => {
                const messageMarker: editor.IMarkerData = {
                    message: `${e.context}: ${e.message}`,
                    severity: MarkerSeverity.Error,
                    startLineNumber: t.lineNumber,
                    startColumn: editorModel.getLineFirstNonWhitespaceColumn(t.lineNumber),
                    endLineNumber: t.lineNumber,
                    endColumn: editorModel.getLineLastNonWhitespaceColumn(t.lineNumber)
                }
                markers.push(messageMarker)
                markers.push(...createErrorMarkers(e, editorModel, messageMarker))
            })
        })
        testsModel.getErrors().forEach(e => markers.push(...createErrorMarkers(e, editorModel)))
        return markers
    }
}

function createErrorMarkers(e: Error, editorModel: editor.ITextModel, rootMarker?: editor.IMarkerData) {
    const trace = e.trace ? parseTrace(e.trace) : undefined
    const markers = []
    if (trace) {
        const attachRelatedInformation = []
        if (rootMarker) {
            rootMarker.relatedInformation = []
            attachRelatedInformation.push(rootMarker)
        }
        for (const line of trace) {
            if (!line.module) { break }
            if (line.module.startsWith('ВнешняяОбработка.ЗапускТестовогоМодуля')) {
                const marker = createMarker(`${e.context}: ${e.message}`, line.line, editorModel)
                markers.push(marker)
                const relatedInformation = {
                    resource: editorModel.uri,
                    message: line.shortMessage,
                    startLineNumber: marker.startLineNumber,
                    startColumn: marker.startColumn,
                    endLineNumber: marker.endLineNumber,
                    endColumn: marker.endColumn,
                }
                attachRelatedInformation.forEach(marker => marker.relatedInformation?.push(relatedInformation))
                marker.relatedInformation = []
                attachRelatedInformation.push(marker)
            } else {
                const relatedInformation = {
                    resource: Uri.parse(line.module),
                    message: line.shortMessage,
                    startLineNumber: line.line,
                    startColumn: 0,
                    endLineNumber: line.line,
                    endColumn: 0,
                }
                attachRelatedInformation.forEach(marker => marker.relatedInformation?.push(relatedInformation))
            }
        }
    } else if (!rootMarker) {
        markers.push(createMarker(`${e.context}: ${e.message}`, 1, editorModel))
    }
    return markers
}

function createMarker(message: string, line: number, editorModel: editor.ITextModel): editor.IMarkerData {
    return {
        message: message,
        severity: MarkerSeverity.Error,
        startLineNumber: line,
        startColumn: editorModel.getLineFirstNonWhitespaceColumn(line),
        endLineNumber: line,
        endColumn: editorModel.getLineLength(line)
    }
}
