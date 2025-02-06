import { YAxUnitEditor } from '../index'
import V8Proxy from '../../onec/V8Proxy'
import './lensProvider'
import { Report } from '../test-model'

(window as any).V8Proxy = V8Proxy

export function registerCommands(bslEditor: YAxUnitEditor) {
    const commandId = bslEditor.editor.addCommand(0, (_: any, methodName: string) => {
        runTest(methodName, bslEditor)
    })

    return commandId
}

function runTest(methodName: string, editor: YAxUnitEditor) {
    editor.testsModel.onRunTest(methodName)
    V8Proxy.fetch('runTest', {
        method: methodName, module: editor.getText()
    }).then((response) => {
        var result = <Report>response.json()
        editor.testsModel.loadReport(result)
    })
}

