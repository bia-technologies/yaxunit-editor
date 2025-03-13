import { IPosition } from "monaco-editor-core";
import { ROOT_METHOD, TestsModel } from "../test-model";
import { YAxUnitEditor } from "../editor";
import { Method } from "@/common/codeModel";
import { ModuleModel } from "@/bsl/moduleModel";
import { BslCodeModel } from "@/bsl/codeModel";

const REGISTERED_TEST_PATTERN = /\.\s*(?:ДобавитьТест|ДобавитьСерверныйТест|ДобавитьКлиентскийТест)\s*\(\s*"([\w\dА-Яа-я_]+)"\s*\)/guim

export class TestsResolver {
    editor: YAxUnitEditor
    model: TestsModel

    constructor(editor: YAxUnitEditor, tests: TestsModel) {
        this.editor = editor
        this.model = tests
    }

    onDidChangeContent(_:BslCodeModel): void {
        this.model.updateTests(this.getTestMethods() ?? [], this.getPosition.bind(this))
    }

    private getTestMethods(): Method[] | undefined {
        const methods = this.editor.scope.getMethods()
        const rootMethod = methods.find(isRootMethod)
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

        return methods.filter(m => m.isExport && (isRootMethod(m) || hash[m.name.toLowerCase()]))
    }

    private getMethodContent(method: Method): string | undefined {
        const startPosition = this.getPosition(method.startOffset)
        const endPosition = this.getPosition(method.endOffset)

        return this.editor.editor.getModel()?.getValueInRange({
            startColumn: startPosition.column, startLineNumber: startPosition.lineNumber,
            endColumn: endPosition.column, endLineNumber: endPosition.lineNumber
        })
    }

    private getPosition(offset: number): IPosition {
        const model = this.editor.editor.getModel() as ModuleModel
        return model.getPositionAt(offset)
    }
}

function isRootMethod(method: Method): boolean {
    return ROOT_METHOD.localeCompare(method.name, undefined, { sensitivity: 'accent' }) === 0
}