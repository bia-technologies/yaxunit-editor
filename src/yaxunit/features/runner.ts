import { YAxUnitEditor } from '../index'
import V8Proxy from '../../onec/V8Proxy'
import './lensProvider'
import { RunResult } from '../TestDefinition'

(window as any).V8Proxy = V8Proxy

export function registerCommands(bslEditor: YAxUnitEditor) {
    const commandId = bslEditor.editor.addCommand(0, (_, methodName) => {
        runTest(methodName, bslEditor)
    })

    return commandId
}

async function runTest(methodName: string, editor: YAxUnitEditor) {
    var response = await V8Proxy.fetch('runTest', {
        method: methodName, module: editor.getText()
    })
    var result = <RunResult>response.json()

    editor.tests.updateTestsStatus(result)
}

