import './styles/style.css';
import './polyfill .js';

import editorWorker from 'monaco-editor-core/esm/vs/editor/editor.worker?worker'
import '@/bsl/editor/language/contribution.js'
import '@/yaxunit'
import '@/bsl/scope'
import { YAxUnitEditor } from '@/yaxunit'


(self as any).MonacoEnvironment = {
  getWorker(): Worker {
    return new editorWorker()
  }
};

const bslEditor = new YAxUnitEditor();
(window as any).bslEditor = bslEditor;

if (import.meta.env.DEV) {
  bslEditor.content =
    `
Процедура ИсполняемыеСценарии() Экспорт
    
    ЮТТесты.ДобавитьТест("Сложение");

КонецПроцедуры

Процедура Сложение() Экспорт

КонецПроцедуры
`
} else {
  bslEditor.content =
    `
Процедура ИсполняемыеСценарии() Экспорт
    
    ЮТТесты.ДобавитьТест("Сложение");

КонецПроцедуры

Процедура Сложение() Экспорт

КонецПроцедуры
`
}
