import './styles/style.css'
import './styles/glyphs.css'

// import {Registry} from 'monaco-editor/esm/vs/platform/registry/common/platform.js'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
// import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
// import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import './languages/bsl/contribution'
import './yaxunit'
import {YAxUnitEditor} from './yaxunit'


self.MonacoEnvironment = {
  getWorker(_): Worker {
    // if (label === 'json') {
    //   return new jsonWorker()
    // }
    // if (label === 'css' || label === 'scss' || label === 'less') {
    //   return new cssWorker()
    // }
    // if (label === 'html' || label === 'handlebars' || label === 'razor') {
    //   return new htmlWorker()
    // }
    // if (label === 'typescript' || label === 'javascript') {
    //   return new tsWorker()
    // }
    return new editorWorker()
  }
};

const content:string =
`
Процедура ИсполняемыеСценарии() Экспорт

	ЮТТесты
		.ДобавитьТест("ТестУспешно")
		.ДобавитьТест("ТестОшибка")
		.ДобавитьТест("ТестСломан")
	;

КонецПроцедуры

Процедура ТестУспешно() Экспорт
	ЮТест.ОжидаетЧто(1).Равно(1);
КонецПроцедуры

Процедура ТестОшибка() Экспорт
	ЮТест.ОжидаетЧто(1).Равно(2);
КонецПроцедуры

Процедура ТестСломан() Экспорт
	ЮТест.ОжидаетЧто(1).ОтсутствующийМетод(2);
КонецПроцедуры
`;

// const bslEditor = new YAxUnitEditor(content)
(window as any).bslEditor = new YAxUnitEditor(content);

