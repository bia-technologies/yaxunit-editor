import './styles/style.css'
import '@fontsource/jetbrains-mono/index.css'
import './polyfill .js'

import '@/bsl/editor/language/contribution.js'
import '@/yaxunit'
import '@/bsl/scope/platform'
// import '@/bsl/scope/configuration'
import { YAxUnitEditor } from '@/yaxunit'

const bslEditor = new YAxUnitEditor();
(window as any).bslEditor = bslEditor;

bslEditor.content =
  `Процедура ИсполняемыеСценарии() Экспорт
    
    ЮТТесты.ДобавитьТест("Сложение");

КонецПроцедуры

Процедура Сложение() Экспорт

КонецПроцедуры
`