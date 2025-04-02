import { TestDefinition, TestsModel, TestStatus } from '../test-model'
import { editor, Range } from 'monaco-editor'
import { TestModelRender } from '../interfaces'


export class TestStatusDecorator implements TestModelRender{
    editor: editor.IStandaloneCodeEditor
    decorations:string[] = [];
    constructor(editor: editor.IStandaloneCodeEditor) {
        this.editor = editor
    }
    update(model: TestsModel): void {
        const newDecorations = model.getTests().map(t => {
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

        this.decorations = this.editor.deltaDecorations( this.decorations, newDecorations)
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