import { TestDefinition, TestsModel, TestStatus } from '../test-model'
import { editor, Range } from 'monaco-editor-core'
import { TestModelRender } from './interfaces'


export class TestStatusDecorator implements TestModelRender{
    editor: editor.IStandaloneCodeEditor
    decorationsIds: editor.IEditorDecorationsCollection | undefined
    constructor(editor: editor.IStandaloneCodeEditor) {
        this.editor = editor
    }
    update(model: TestsModel): void {
        const decorations = model.getTests().map(t => {
            return {
                range: new Range(t.lineNumber, 1, t.lineNumber, 1),
                options: {
                    isWholeLine: false,
                    glyphMarginClassName: getGlyphClass(t.status),
                    glyphMarginHoverMessage: {
                        value: getHover(t)
                    }
                }
            }
        })
        if (this.decorationsIds) {
            console.debug('update decorations', decorations)
            this.decorationsIds.set(decorations)
        } else {
            console.debug('new decorations', decorations)
            this.decorationsIds = this.editor.createDecorationsCollection(decorations)
        }
    }
}

function getHover(test: TestDefinition): string {
    const lines = []
    lines.push(`Статус: ${test.status}`, `Продолжительность: ${test.duration} мс`)
    
    if(test.errors){
        test.errors.forEach(e=>lines.push(`**Ошибка(${e.context})**: ${e.message}`))
    }
    return lines.join('  \n')
}

function getGlyphClass(status: TestStatus) {
    switch (status) {
        case TestStatus.pending:
            return 'codicon-debug-start pending'
        case TestStatus.execution:
            return 'codicon-record execution'
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