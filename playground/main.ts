import '../src/styles/style.css'
import '@fontsource/jetbrains-mono/index.css'

import editorWorker from 'monaco-editor-core/esm/vs/editor/editor.worker?worker'
import '@/bsl/editor/language/contribution.js'
import '@/yaxunit'
import '@/bsl/scope/platform'
import { ModelView } from './modelView'
import { symbolRange } from '@/bsl/codeModel/utils'
import { YAxUnitEditor } from '@/yaxunit'

(self as any).MonacoEnvironment = {
  getWorker(): Worker {
    return new editorWorker()
  }
};

const bslEditor = new YAxUnitEditor();
(window as any).bslEditor = bslEditor;

bslEditor.content =
  `
Процедура ИсполняемыеСценарии() Экспорт
    
    ЮТТесты.ДобавитьТест("Сложение");

КонецПроцедуры

Процедура Сложение() Экспорт
  Документ = НовыйДокумент(ТекущаяДата());
КонецПроцедуры

Функция НовыйДокумент(Дата)
	
	Документ = ЮТест.Данные().КонструкторОбъекта(Справочники.Номенклатура)
		.ФикцияОбязательныхПолей()
		.Записать();
	
	Возврат Документ;

КонецФункции
`
const view = new ModelView('model-tree')
bslEditor.getModel().getCodeModel().onDidChangeModel(() => {
  view.render(bslEditor.getModel().getCodeModel())
})
view.selector = (symbol) => {
  const range = symbolRange(symbol, bslEditor.getModel())
  bslEditor.editor.setSelection(range)
}