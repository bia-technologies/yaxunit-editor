import './styles/style.css';
import './polyfill .js';

import editorWorker from 'monaco-editor-core/esm/vs/editor/editor.worker?worker'
// import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
// import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
// import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import '@/languages/bsl/contribution'
import '@/yaxunit'
import '@/bsl/scope'
import { YAxUnitEditor } from './yaxunit'
// import './bsl/scope/configuration/configurationScope.js'

(window as any).MonacoEnvironment = {
  getWorker(): Worker {
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

const content: string =
  `#Область Тесты
Процедура ИсполняемыеСценарии() Экспорт
  Обработки.
	ЮТТесты
		.ДобавитьТест("ТестУспешно")
		.ДобавитьТест("ТестОшибка")
		.ДобавитьТест("ТестСломан")
	;

КонецПроцедуры

Процедура ТестУспешно() Экспорт

	Результат = СтрНайти("90", "9");
	ЮТест.ОжидаетЧто(Результат).Равно(1);

КонецПроцедуры

Процедура ТестОшибка() Экспорт

	ЮТест.ОжидаетЧто(1).Равно(2);

КонецПроцедуры

Процедура ТестСломан() Экспорт

	ЮТест.ОжидаетЧто(1).ОтсутствующийМетод(2);

КонецПроцедуры
#КонецОбласти`;

const bslEditor = new YAxUnitEditor(content);
afterLoad()

function afterLoad(){
  bslEditor.testsModel.loadReport({
    testsuite: [{
      classname: 'ОМ_Тест',
      name: 'ОМ_Тест',
      context: 'Клиент',
      package: 'ОМ_Тест',
      time: 0.835,
      timestamp: Date.now(),
      testcase: [{
        classname: 'ОМ_Тест.ТестУспешно',
        name: 'ТестУспешно',
        time: 0.123,
      }, {
        classname: 'ОМ_Тест.ТестОшибка',
        name: 'ТестОшибка',
        time: 0.123,
        failure: [{
          message: 'Ожидали, что проверяемое значение `1` равно `2`, но это не так.', trace: `[Failed] <Ожидали, что проверяемое значение \`1\` равно \`2\`, но это не так.>
  {YAXUNIT ОбщийМодуль.ЮТУтверждения.Модуль(2239)}:ВызватьИсключение ТекстИсключения;
  {YAXUNIT ОбщийМодуль.ЮТУтверждения.Модуль(2225)}:ОбработатьРезультатПроверкиПредиката(Результат);
  {YAXUNIT ОбщийМодуль.ЮТУтверждения.Модуль(2200)}:ПроверитьПредикат(Контекст, Предикат, ОписаниеПроверки, ПараметрыСравнения);
  {YAXUNIT ОбщийМодуль.ЮТУтверждения.Модуль(266)}:ПроверитьПредикатУтверждения(ЮТПредикаты.Выражения().Равно, ОжидаемоеЗначение, ОписаниеПроверки, ПараметрыСравнения);
  {ВнешняяОбработка.ЗапускТестовогоМодуля.МодульОбъекта(21)}:ЮТест.ОжидаетЧто(1).Равно(2);
  {(1)}:Объект.ТестОшибка()
  {YAXUNIT ОбщийМодуль.ЮТМетодыСлужебный.Модуль(228)}:Выполнить(Выражение);
  {YAXUNIT ОбщийМодуль.ЮТМетодыСлужебный.Модуль(110)}:Возврат ВыполнитьВыражениеСПерехватомОшибки(Выражение, Параметры, Объект, Ложь);
  {YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(321)}:Ошибка = ЮТМетодыСлужебный.ВыполнитьМетодОбъектаСПерехватомОшибки(ТестовыйМодуль, Тест.Метод, Тест.Параметры);
  {YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(219)}:ВыполнитьТестовыйМетод(ТестовыйМодуль, Тест);
  {YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(133)}:Результат = ВыполнитьНаборТестов(ТестовыйМодуль, Набор, ОписаниеТестовогоОбъекта);
  {YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйВызовСервера.Модуль(41)}:Возврат ЮТИсполнительСлужебныйКлиентСервер.ВыполнитьГруппуНаборовТестов(Наборы, ТестовыйМодуль);
  
  [ОшибкаВоВремяВыполненияВстроенногоЯзыка, ИсключениеВызванноеИзВстроенногоЯзыка]'`, actual: '1', expected: '2'
        }]
      }, {
        classname: 'ОМ_Тест.ТестСломан',
        name: 'ТестСломан',
        time: 0.123,
        error: [{
          message: 'Исполнения: Метод объекта не обнаружен (ОтсутствующийМетод)', trace: `Метод объекта не обнаружен (ОтсутствующийМетод)
  {ВнешняяОбработка.ЗапускТестовогоМодуля.МодульОбъекта(27)}:ЮТест.ОжидаетЧто(1).ОтсутствующийМетод(2);
  {(1)}:Объект.ТестСломан()
  {YAXUNIT ОбщийМодуль.ЮТМетодыСлужебный.Модуль(228)}:Выполнить(Выражение);
  {YAXUNIT ОбщийМодуль.ЮТМетодыСлужебный.Модуль(110)}:Возврат ВыполнитьВыражениеСПерехватомОшибки(Выражение, Параметры, Объект, Ложь);
  {YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(321)}:Ошибка = ЮТМетодыСлужебный.ВыполнитьМетодОбъектаСПерехватомОшибки(ТестовыйМодуль, Тест.Метод, Тест.Параметры);
  {YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(219)}:ВыполнитьТестовыйМетод(ТестовыйМодуль, Тест);
  {YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(133)}:Результат = ВыполнитьНаборТестов(ТестовыйМодуль, Набор, ОписаниеТестовогоОбъекта);
  {YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйВызовСервера.Модуль(41)}:Возврат ЮТИсполнительСлужебныйКлиентСервер.ВыполнитьГруппуНаборовТестов(Наборы, ТестовыйМодуль);`}]
      }]
    },{
      classname: 'ОМ_Тест',
      name: 'ОМ_Тест',
      context: 'Сервер',
      package: 'ОМ_Тест',
      time: 0.835,
      timestamp: Date.now(),
      testcase: [{
        classname: 'ОМ_Тест.ТестУспешно',
        name: 'ТестУспешно',
        time: 0.123,
      }, {
        classname: 'ОМ_Тест.ТестОшибка',
        name: 'ТестОшибка',
        time: 0.123,
        failure: [{
          message: 'Ожидали, что проверяемое значение `1` равно `2`, но это не так.', trace: `[Failed] <Ожидали, что проверяемое значение \`1\` равно \`2\`, но это не так.>
  {YAXUNIT ОбщийМодуль.ЮТУтверждения.Модуль(2239)}:ВызватьИсключение ТекстИсключения;
  {YAXUNIT ОбщийМодуль.ЮТУтверждения.Модуль(2225)}:ОбработатьРезультатПроверкиПредиката(Результат);
  {YAXUNIT ОбщийМодуль.ЮТУтверждения.Модуль(2200)}:ПроверитьПредикат(Контекст, Предикат, ОписаниеПроверки, ПараметрыСравнения);
  {YAXUNIT ОбщийМодуль.ЮТУтверждения.Модуль(266)}:ПроверитьПредикатУтверждения(ЮТПредикаты.Выражения().Равно, ОжидаемоеЗначение, ОписаниеПроверки, ПараметрыСравнения);
  {ВнешняяОбработка.ЗапускТестовогоМодуля.МодульОбъекта(21)}:ЮТест.ОжидаетЧто(1).Равно(2);
  {(1)}:Объект.ТестОшибка()
  {YAXUNIT ОбщийМодуль.ЮТМетодыСлужебный.Модуль(228)}:Выполнить(Выражение);
  {YAXUNIT ОбщийМодуль.ЮТМетодыСлужебный.Модуль(110)}:Возврат ВыполнитьВыражениеСПерехватомОшибки(Выражение, Параметры, Объект, Ложь);
  {YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(321)}:Ошибка = ЮТМетодыСлужебный.ВыполнитьМетодОбъектаСПерехватомОшибки(ТестовыйМодуль, Тест.Метод, Тест.Параметры);
  {YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(219)}:ВыполнитьТестовыйМетод(ТестовыйМодуль, Тест);
  {YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(133)}:Результат = ВыполнитьНаборТестов(ТестовыйМодуль, Набор, ОписаниеТестовогоОбъекта);
  {YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйВызовСервера.Модуль(41)}:Возврат ЮТИсполнительСлужебныйКлиентСервер.ВыполнитьГруппуНаборовТестов(Наборы, ТестовыйМодуль);
  
  [ОшибкаВоВремяВыполненияВстроенногоЯзыка, ИсключениеВызванноеИзВстроенногоЯзыка]'`, actual: '1', expected: '2'
        }]
      }, {
        classname: 'ОМ_Тест.ТестСломан',
        name: 'ТестСломан',
        time: 0.123,
        error: [{
          message: 'Исполнения: Метод объекта не обнаружен (ОтсутствующийМетод)', trace: `Метод объекта не обнаружен (ОтсутствующийМетод)
  {ВнешняяОбработка.ЗапускТестовогоМодуля.МодульОбъекта(27)}:ЮТест.ОжидаетЧто(1).ОтсутствующийМетод(2);
  {(1)}:Объект.ТестСломан()
  {YAXUNIT ОбщийМодуль.ЮТМетодыСлужебный.Модуль(228)}:Выполнить(Выражение);
  {YAXUNIT ОбщийМодуль.ЮТМетодыСлужебный.Модуль(110)}:Возврат ВыполнитьВыражениеСПерехватомОшибки(Выражение, Параметры, Объект, Ложь);
  {YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(321)}:Ошибка = ЮТМетодыСлужебный.ВыполнитьМетодОбъектаСПерехватомОшибки(ТестовыйМодуль, Тест.Метод, Тест.Параметры);
  {YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(219)}:ВыполнитьТестовыйМетод(ТестовыйМодуль, Тест);
  {YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(133)}:Результат = ВыполнитьНаборТестов(ТестовыйМодуль, Набор, ОписаниеТестовогоОбъекта);
  {YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйВызовСервера.Модуль(41)}:Возврат ЮТИсполнительСлужебныйКлиентСервер.ВыполнитьГруппуНаборовТестов(Наборы, ТестовыйМодуль);`}]
      }]
    }]
  })
}
// const view: any = (bslEditor.editor as any)._modelData.view;
// (bslEditor.editor as any)._modelData.view = makeLogProxy(view);
(window as any).bslEditor = bslEditor;

