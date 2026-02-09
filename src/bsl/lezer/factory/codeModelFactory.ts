import { isModel } from "@/monaco/utils"
import { ModuleModel } from "../../moduleModel"
import { BslCodeModel, isMethodDefinition, MethodDefinition } from "../../codeModel"
import { editor, MarkerSeverity } from 'monaco-editor-core'
import { AutoDisposable } from "@/common/utils/autodisposable"
import { parser, terms } from "lezer-bsl"
import { TreeFragment, SyntaxNode, type Tree } from "@lezer/common"
import { LezerCodeModelFactoryVisitor } from "./codeModelFactoryVisitor"
import { FastLezerVisitor } from "./fastVisitor"
import { IModelContentChange } from "../../chevrotain/parser"
import { BaseSymbol } from "@/common/codeModel"
import updateUtils from "@/bsl/codeModel/utils/updateUtils"

interface ErrorInfo {
    message: string
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
}

interface ChangedRange {
    fromA: number
    toA: number
    fromB: number
    toB: number
}

export class LezerCodeModelFactory extends AutoDisposable {
    private fastVisitor = new FastLezerVisitor()
    private fullVisitor = new LezerCodeModelFactoryVisitor()
    errors: ErrorInfo[] = []
    private tree?: Tree
    private fragments: readonly TreeFragment[] = []
    private sourceText = ''

    buildModel(model: ModuleModel | string): BslCodeModel {
        const codeModel = new BslCodeModel()
        this.reBuildModel(codeModel, model)
        return codeModel
    }

    reBuildModel(codeModel: BslCodeModel, model: ModuleModel | string) {
        const start = performance.now()
        const text = isModel(model) ? model.getValue() : model
        this.sourceText = text

        try {
            this.tree = parser.parse(text)
            this.fragments = TreeFragment.addTree(this.tree)
            this.errors = []

            if (isModel(model)) {
                editor.setModelMarkers(model, 'lezer', [])
            }

            const visitorStart = performance.now()
            // Используем FAST visitor - только декларации
            const children = this.fastVisitor.module(this.tree.topNode, text)

            codeModel.children.length = 0
            if (Array.isArray(children)) {
                codeModel.children.push(...children)
            } else if (children) {
                codeModel.children.push(children)
            }
            const end = performance.now()
            console.log('Fast build by lezer. Parse:', visitorStart - start, 'ms; model build:', end - visitorStart, '; full:', end - start)

            codeModel.children
                .filter(isMethodDefinition)
                .forEach(method => {
                    method.ensureBody = () => this.ensureMethodBody(method)
                    updateUtils.updateMethodChildrenOffset(method)
                })

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

    /**
     * Ленивая загрузка тела метода
     */
    ensureMethodBody(method: MethodDefinition): void {
        if (method.bodyParsed || !this.tree) return

        const start = performance.now()
        
        // Найти узел метода в дереве
        let node = this.tree.resolve(method.startOffset, 1)
        
        // Найти родительский ProcedureDef/FunctionDef
        while (node && !node.type.is(terms.ProcedureDef) && !node.type.is(terms.FunctionDef)) {
            node = node.parent
        }
        
        if (node) {
            this.fullVisitor.source = this.sourceText
            const body = this.getMethodBody(node)
            method.children = body
            method.markBodyParsed()
            
            updateUtils.updateMethodChildrenOffset(method)
            
            console.log(`Loaded body for ${method.name}:`, performance.now() - start, 'ms')
        }
    }

    private getMethodBody(node: SyntaxNode): BaseSymbol[] {
        const block = this.findChild(node, terms.Block)
        if (!block) return []
        
        const children: BaseSymbol[] = []
        for (let child = block.firstChild; child; child = child.nextSibling) {
            const symbol = this.fullVisitor.visit(child)
            if (symbol) children.push(symbol)
        }
        return children
    }

    private findChild(node: SyntaxNode, termId: number): SyntaxNode | null {
        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (child.type.id === termId) return child
        }
        return null
    }

    updateModel(codeModel: BslCodeModel, model: ModuleModel, changes: IModelContentChange[]): boolean {
        if (!codeModel.children.length) {
            console.debug('Model empty -> rebuild')
            return false
        }

        if (updateUtils.isReplace(codeModel, changes)) {
            console.debug('Text replaced -> rebuild')
            return false
        }

        const start = performance.now()
        const text = model.getValue()
        this.sourceText = text

        try {
            const lezerChanges = this.convertChangesToLezer(changes)
            this.fragments = TreeFragment.applyChanges(this.fragments, lezerChanges)
            this.tree = parser.parse(text, this.fragments)
            this.fragments = TreeFragment.addTree(this.tree)
            
            const visitorStart = performance.now()

            // Быстрое обновление - только декларации
            const newChildren = this.fastVisitor.module(this.tree.topNode, text)
            
            // Обновляем измененные методы
            this.updateChangedMethods(codeModel, newChildren, lezerChanges)
            
            codeModel.children
                .filter(isMethodDefinition)
                .forEach(method => {
                    method.ensureBody = () => this.ensureMethodBody(method)
                    updateUtils.updateMethodChildrenOffset(method)
                })

            // codeModel.afterUpdate(codeModel)
        
            const end = performance.now()
            console.log('Incremental update: Parse:', visitorStart - start, 'ms; model build:', end - visitorStart, '; full:', end - start)
            return true
        } catch (error) {
            console.error('Incremental update failed:', error)
            return false
        }
    }

    private updateChangedMethods(codeModel: BslCodeModel, newChildren: BaseSymbol[], changes: ChangedRange[]) {
        for (const change of changes) {
            // Найти затронутый метод в старой модели
            const oldMethod = this.findMethodByOffset(codeModel.children, change.fromA)
            const newMethod = this.findMethodByOffset(newChildren, change.fromB)
            
            if (oldMethod && newMethod && isMethodDefinition(oldMethod) && isMethodDefinition(newMethod)) {
                // Если тело было загружено - сбросить флаг
                if (oldMethod.bodyParsed) {
                    (newMethod as any)._bodyParsed = false
                }
                
                const diff = (change.toB - change.fromB) - (change.toA - change.fromA)
                updateUtils.replaceSymbol(codeModel, oldMethod, newMethod, diff)
            }
        }
        
        // Обновить методы, которые не изменились
        for (let i = 0; i < newChildren.length; i++) {
            if (!codeModel.children[i]) {
                codeModel.children[i] = newChildren[i]
            }
        }
    }

    private findMethodByOffset(children: BaseSymbol[], offset: number): BaseSymbol | undefined {
        return children.find(child => 
            child.startOffset <= offset && child.endOffset >= offset
        )
    }

    private convertChangesToLezer(changes: IModelContentChange[]): ChangedRange[] {
        return changes.map(c => ({
            fromA: c.rangeOffset,
            toA: c.rangeOffset + c.rangeLength,
            fromB: c.rangeOffset,
            toB: c.rangeOffset + c.text.length
        }))
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
