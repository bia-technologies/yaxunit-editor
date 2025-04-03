import { IDisposable } from "monaco-editor-core";

export class AutoDisposable implements IDisposable {
    protected _disposables: IDisposable[] = []
    dispose(): void {
        while (this._disposables.length) {
            this._disposables.pop()?.dispose();
        }
    }
}