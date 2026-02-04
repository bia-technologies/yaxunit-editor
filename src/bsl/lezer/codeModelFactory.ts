import { isModel } from "@/monaco/utils"
import { ModuleModel } from "../moduleModel"
import { BslCodeModel } from "../codeModel"
import { editor, MarkerSeverity } from 'monaco-editor-core'
import { AutoDisposable } from "@/common/utils/autodisposable"
import { parser } from "lezer-bsl"
import { LezerCodeModelFactoryVisitor } from "./codeModelFactoryVisitor"

interface ErrorInfo {
    message: string
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
}

export class LezerCodeModelFactory extends AutoDisposable {
    visitor = new LezerCodeModelFactoryVisitor()
    errors: ErrorInfo[] = []

    buildModel(model: ModuleModel | string): BslCodeModel {
        const codeModel = new BslCodeModel()
        this.reBuildModel(codeModel, model)
        return codeModel
    }

    reBuildModel(codeModel: BslCodeModel, model: ModuleModel | string) {
        const text = isModel(model) ? model.getValue() : model
        
        try {
            const tree = parser.parse(text)
            this.errors = []

            if (isModel(model)) {
                editor.setModelMarkers(model, 'lezer', [])
            }

            const children = this.visitor.module(tree.topNode, text)

            codeModel.children.length = 0
            if (Array.isArray(children)) {
                codeModel.children.push(...children)
            } else if (children) {
                codeModel.children.push(children)
            }

            codeModel.afterUpdate(codeModel)
        } catch (error) {
            this.errors = [{
                message: error instanceof Error ? error.message : 'Unknown parsing error',
                startLine: 1,
                startColumn: 1,
                endLine: 1,
                endColumn: 1
            }]

            if (isModel(model)) {
                const markers = this.convertErrorsToMarkers(this.errors, model)
                editor.setModelMarkers(model, 'lezer', markers)
            }
        }
    }

    private convertErrorsToMarkers(errors: ErrorInfo[], model: ModuleModel): editor.IMarkerData[] {
        return errors.map(error => ({
            severity: MarkerSeverity.Error,
            message: error.message,
            startLineNumber: error.startLine,
            startColumn: error.startColumn,
            endLineNumber: error.endLine,
            endColumn: error.endColumn
        }))
    }
}