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
        editor.setModelMarkers(editorModel, "owner", markers);
    }

    private getTestsMarkers(testsModel: TestsModel, editorModel: editor.ITextModel): editor.IMarkerData[] {
        const markers: editor.IMarkerData[] = []

        testsModel.getTests().filter(t => t.errors).forEach(t => {
            (t.errors as Error[]).map(e => {
                let traceMarker: editor.IMarkerData | undefined

                if (e.trace) {
                    const trace = parseTrace(e.trace, editorModel.getEOL())
                    if (trace) {
                        traceMarker = createMarker(trace.message, trace.line, editorModel)
                        markers.push(traceMarker)
                    } else {
                        markers.push(createMarker(e.trace, 1, editorModel))
                    }
                }
                const messageMarker: editor.IMarkerData = {
                    message: `${e.context}: ${e.message}`,
                    severity: MarkerSeverity.Error,
                    startLineNumber: t.lineNumber,
                    startColumn: editorModel.getLineFirstNonWhitespaceColumn(t.lineNumber),
                    endLineNumber: t.lineNumber,
                    endColumn: editorModel.getLineLastNonWhitespaceColumn(t.lineNumber)
                }
                markers.push(messageMarker)
                if (traceMarker) {
                    messageMarker.relatedInformation = [{
                        resource: editorModel.uri,
                        message: traceMarker.message,
                        startLineNumber: traceMarker.startLineNumber,
                        startColumn: traceMarker.startColumn,
                        endLineNumber: traceMarker.endLineNumber,
                        endColumn: traceMarker.endColumn,
                    }]
                }
            }
            )
        })
        return markers
    }
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