import { editor } from "monaco-editor-core";
import { ROOT_METHOD, TestsModel } from "../test-model";
import { ModelChangeHandler } from "../features/interfaces";
import { YAxUnitEditor } from "../editor";
import { Method } from "@/bsl/Symbols";

const REGISTERED_TEST_PATTERN = /\.\s*(?:ДобавитьТест|ДобавитьСерверныйТест|ДобавитьКлиентскийТест)\s*\(\s*"([\w\dА-Яа-я_]+)"\s*\)/guim

export class TestsResolver implements ModelChangeHandler {
    editor: YAxUnitEditor
    model: TestsModel

    constructor(editor: YAxUnitEditor, tests: TestsModel) {
        this.editor = editor
        this.model = tests
    }

    onDidChangeContent(_: editor.IModelContentChangedEvent): void {
        this.model.updateTests(this.getTests() ?? [])
    }

    getTests(): Method[] | undefined {
        const rootMethod = this.editor.scope.getMethods().find(isRootMethod)
        if (!rootMethod) {
            return
        }

        const methodContent = this.getMethodContent(rootMethod)
        if (!methodContent) {
            return
        }

        var hash: { [key: string]: boolean } = {}
        let match;
        while ((match = REGISTERED_TEST_PATTERN.exec(methodContent)) !== null) {
            hash[match[1].toLowerCase()] = true
        }

        return this.editor.scope.getMethods().filter(m => m.isExport && (isRootMethod(m) || hash[m.name.toLowerCase()]))
    }

    getMethodContent(method: Method): string | undefined {
        return this.editor.editor.getModel()?.getValueInRange({
            startColumn: method.startColumn, startLineNumber: method.startLine,
            endColumn: method.endColumn, endLineNumber: method.endLine
        })
    }
}

function isRootMethod(method: Method): boolean {
    return ROOT_METHOD.localeCompare(method.name, undefined, { sensitivity: 'accent' }) === 0
}