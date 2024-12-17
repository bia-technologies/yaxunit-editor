import { YAxUnitEditor } from '../index'
import V8Proxy from '../../onec/V8Proxy'
import './codeLensProvider'

export function runTest(methodName: string) {
    V8Proxy.fetch('runTest', methodName)
}

export function registerCommands(bslEditor: YAxUnitEditor) {
    const commandId = bslEditor.editor.addCommand(0, () => {
        const position = bslEditor.editor.getPosition()
        const method = position === null ? undefined : bslEditor.module.getMethodAtLine(position?.lineNumber)
        if (method !== undefined) {
            console.log(method.name)
            V8Proxy.fetch('runTest', method.name)
        }
    })

    return commandId
}

