import { TestsModel, TestStatus } from '../TestDefinition'
import { editor, Range } from 'monaco-editor'


export class TestStatusDecorator {
    editor: editor.IStandaloneCodeEditor
    decorationsIds: editor.IEditorDecorationsCollection | undefined
    constructor(editor: editor.IStandaloneCodeEditor) {
        this.editor = editor
    }
    updateDecorations(model: TestsModel): void {
        const decorations = model.getTests().map(t => {
            return {
                range: new Range(t.lineNumber, 1, t.lineNumber, 1),
                options: {
                    isWholeLine: false,
                    glyphMarginClassName: getGlyphClass(t.status),
                    glyphMarginHoverMessage: {
                        value: 'Run test'
                    },
                }
            }
        })
        if (this.decorationsIds) {
            this.decorationsIds.set(decorations)
        } else {
            this.decorationsIds = this.editor.createDecorationsCollection(decorations)
        }
    }
}

function getGlyphClass(status: TestStatus) {
    switch (status) {
        case TestStatus.pending:
            return 'codicon-debug-start pending'
        case TestStatus.execution:
            return 'codicon-issue-draft execution'
        case TestStatus.passed:
            return 'codicon-pass passed'
        case TestStatus.failed:
            return 'codicon-error failed'
        case TestStatus.broken:
            return 'codicon-error broken'
        case TestStatus.skipped:
            return 'codicon-circle-slash skipped'
        case TestStatus.notImplemented:
            return 'codicon-error skipped'
    }
}