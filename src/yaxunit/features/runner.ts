import { BslEditor } from '@/bsl/editor'
import V8Proxy from '../../onec/V8Proxy'
import { Report, TestsModel } from '../test-model'

(window as any).V8Proxy = V8Proxy

export function registerCommands(bslEditor: BslEditor, testsModel: TestsModel) {
    const commandId = bslEditor.editor.addCommand(0, (_: any, methodName: string) => {
        runTest(methodName, bslEditor, testsModel)
    })

    return commandId
}

function runTest(methodName: string, editor: BslEditor, testsModel: TestsModel) {
    testsModel.onRunTest(methodName)
    V8Proxy.fetch('runTest', {
        method: methodName, module: editor.getText()
    }).then((response) => {
        var result = <Report>response.json()
        testsModel.loadReport(result)
    })
}
