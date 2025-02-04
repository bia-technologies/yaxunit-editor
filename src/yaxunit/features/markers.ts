import { TestsModel } from '../test-model'
import { editor, MarkerSeverity } from 'monaco-editor-core'
import { TestModelRender } from './interfaces'
import { Error } from '../test-model/report'


export class TestMessageMarkersProvider implements TestModelRender {
    editor: editor.IStandaloneCodeEditor
    decorationsIds: editor.IEditorDecorationsCollection | undefined
    constructor(editor: editor.IStandaloneCodeEditor) {
        this.editor = editor
    }

    update(model: TestsModel): void {
        const editorModel = this.editor.getModel()
        if (!editorModel) {
            return
        }
        const markers: editor.IMarkerData[] = this.getTestsMarkers(model, editorModel)
        const errorsMarkers: editor.IMarkerData[] = this.getErrorsMarkers(model, editorModel)
        markers.push(...errorsMarkers)
        editor.setModelMarkers(editorModel, "owner", markers);
    }

    private getTestsMarkers(testsModel: TestsModel, editorModel: editor.ITextModel): editor.IMarkerData[] {
        return testsModel.getTests().filter(t => t.errors).flatMap(t => {
            return (t.errors as Error[]).map(e => {
                return {
                    code: '123',
                    message: `${e.context}: ${e.message}`,
                    severity: MarkerSeverity.Error,
                    startLineNumber: t.lineNumber,
                    startColumn: editorModel.getLineFirstNonWhitespaceColumn(t.lineNumber),
                    endLineNumber: t.lineNumber,
                    endColumn: editorModel.getLineLastNonWhitespaceColumn(t.lineNumber),
                    relatedInformation: [{
                        resource: editorModel.uri,
                        message: e.trace,
                        startLineNumber: t.lineNumber + 2,
                        startColumn: editorModel.getLineFirstNonWhitespaceColumn(t.lineNumber),
                        endLineNumber: t.lineNumber + 2,
                        endColumn: editorModel.getLineLastNonWhitespaceColumn(t.lineNumber),
                        }]
                }
            }
            )
        })
    }
    private getErrorsMarkers(testsModel: TestsModel, editorModel: editor.ITextModel): editor.IMarkerData[] {
        return testsModel.getErrors().filter(e => e).map(t => getErrorMarker(t, editorModel))
    }
}

function getErrorMarker(error: string, editorModel: editor.ITextModel): editor.IMarkerData {
    const trace = parseTrace(error, editorModel.getEOL())
    if (trace) {
        return {
            message: trace.message,
            severity: MarkerSeverity.Error,
            startLineNumber: trace.line,
            startColumn: editorModel.getLineFirstNonWhitespaceColumn(trace.line),
            endLineNumber: trace.line,
            endColumn: editorModel.getLineLength(trace.line)
        }
    } else {
        return {
            message: error ?? '',
            severity: MarkerSeverity.Error,
            startLineNumber: 1,
            startColumn: editorModel.getLineFirstNonWhitespaceColumn(1),
            endLineNumber: 1,
            endColumn: editorModel.getLineLength(1)
        }
    }
}

function parseTrace(traceMessage: string, EOL: string) {
    const lines = traceMessage.split(EOL)

    let endLine = 0
    for (let index = lines.length - 1; index >= 0; index--) {
        const line = lines[index];
        if (line.startsWith('{ВнешняяОбработка.')) {
            endLine = index
            break
        }
    }

    if (endLine) {
        const match = /\((\d+)\)\}/.exec(lines[endLine])
        if (match) {
            lines.length = endLine + 1
            return {
                line: parseInt(match[1]),
                message: lines.join('\n')
            }
        }
    }
    return undefined
}