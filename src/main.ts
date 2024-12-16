import './styles/style.css'
import './styles/glyphs.css'

import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
// import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
// import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import './languages/bsl/contribution'
import './yaxunit'
import {createEditorScope} from './scope/scopeStore'

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

const container = document.getElementById('container')
if (container === null) {
  throw 'Error!';
}
const content =
  `Функция УстановитьТелоКакСтроку(Строка) Экспорт
  
ОписанияТипов = Новый Соответствие;
ОписанияТипов.Вставить("Товар", Новый ОписаниеТипов("СправочникСсылка.Товары"));
ОписанияТипов.Вставить("Цена", Новый ОписаниеТипов("Число"));
ОписанияТипов.Вставить("Количество", Новый ОписаниеТипов("Число"));
ОписанияТипов.Вставить("Сумма", Новый ОписаниеТипов("Число"));

ТаблицаТоваров = ЮТест.Данные().ЗагрузитьИзМакета("ОбщийМакет.ЮТ_МакетТестовыхДанных", ОписанияТипов);

ЮТест.ОжидаетЧто(ТаблицаТоваров)
    .ИмеетТип("ТаблицаЗначений")
    .ИмеетДлину(5)
    .Свойство("[0].Товар.Наименование").Равно("Товар 1")
    .Свойство("[0].Товар.Поставщик.Наименование").Равно("Поставщик")
    .Свойство("[0].Товар.Вид").Равно(Перечисления.ВидыТоваров.Товар)
    .Свойство("[0].Количество").Равно(1)
    .Свойство("[0].Цена").Равно(100)
    .Свойство("[0].Сумма").Равно(100)
    .Свойство("[1].Товар").Равно(ТаблицаТоваров[0].Товар)
    .Свойство("[1].Количество").Равно(2)
    .Свойство("[1].Цена").Равно(100)
    .Свойство("[1].Сумма").Равно(200)
    .Свойство("[2].Товар").Равно(ТаблицаТоваров[0].Товар)
    .Свойство("[2].Количество").Равно(3)
    .Свойство("[2].Цена").Равно(100)
    .Свойство("[2].Сумма").Равно(300)
    .Свойство("[3].Товар.Наименование").Равно("Товар 2")
    .Свойство("[3].Товар.Поставщик.Наименование").Равно("Поставщик")
    .Свойство("[3].Товар.Вид").Равно(Перечисления.ВидыТоваров.Товар)
    .Свойство("[3].Количество").Равно(1)
    .Свойство("[3].Цена").Равно(2000)
    .Свойство("[3].Сумма").Равно(2000)
    .Свойство("[4].Товар.Наименование").Равно("Услуга")
    .Свойство("[4].Товар.Поставщик").НеЗаполнено()
    .Свойство("[4].Товар.Вид").Равно(Перечисления.ВидыТоваров.Услуга)
    .Свойство("[4].Количество").Равно(1)
    .Свойство("[4].Цена").Равно(300.5)
    .Свойство("[4].Сумма").Равно(300.5);  
КонецФункции`
const editor = monaco.editor.create(container, {
  value: content,
  language: 'bsl',
  automaticLayout: true,
  glyphMargin: true,
});


// editor.createDecorationsCollection([
//   {
//     range: new monaco.Range(3, 1, 5, 1),
//     options: {
//       isWholeLine: true,
//       linesDecorationsClassName: "myLineDecoration",
//     },
//   },
//   {
//     range: new monaco.Range(7, 1, 7, 24),
//     options: { inlineClassName: "myInlineDecoration" },
//   },
// ]);
function updateDecorations(_: any) {

  const de = editor.createDecorationsCollection([
    {
      range: new monaco.Range(1, 1, 1, 1),
      options: {
        isWholeLine: true,
        glyphMarginClassName: "codicon-play",
        glyphMarginHoverMessage: {
          value: 'Run test'
        },
        
      },
    }
  ]);
}
updateDecorations(undefined)
createEditorScope(editor)
