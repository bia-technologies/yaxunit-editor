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
  `#Область Тесты

Процедура ИсполняемыеСценарии() Экспорт
	
	ЮТТесты.ВТранзакции()
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

	Запрос = Новый Запрос("ВЫБРАТЬ 1");
	Выборка = Запрос.Выполнить();

	Данные = Новый Структура("Ожидание, Факт", 2, Выборка.Колонки.Количество());
	ПроверитьРавенство(Данные.Факт, Данные.Ожидание);

КонецПроцедуры

Процедура ТестСломан() Экспорт

	ЮТест.ОжидаетЧто(1).ОтсутствующийМетод(2);

КонецПроцедуры

Процедура ПроверитьРавенство(Факт, Ожидание)

  ЮТест.ОжидаетЧто(Факт).Равно(Ожидание);

КонецПроцедуры

#КонецОбласти`;
setTimeout(() => setDemoData(bslEditor), 10)
async function setDemoData(bslEditor: YAxUnitEditor) {
  bslEditor.testsModel.loadReport([{
    name: 'ОМ_Тест',
    context: 'Клиент',
    package: 'ОМ_Тест',
    time: 0.835,
    error: [{ message: 'Ошибка чтения набора', trace: 'Ошибка чтения набора\n{ВнешняяОбработка.ЗапускТестовогоМодуля.МодульОбъекта(5)}:ЮТТесты.ВТранзакции()' }],
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
{ВнешняяОбработка.ЗапускТестовогоМодуля.МодульОбъекта(26)}:ПроверитьРавенство(Данные.Факт, Данные.Ожидание);
{ВнешняяОбработка.ЗапускТестовогоМодуля.МодульОбъекта(38)}:ЮТест.ОжидаетЧто(Факт).Равно(Ожидание);
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
{ВнешняяОбработка.ЗапускТестовогоМодуля.МодульОбъекта(32)}:ЮТест.ОжидаетЧто(1).ОтсутствующийМетод(2);
{(1)}:Объект.ТестСломан()
{YAXUNIT ОбщийМодуль.ЮТМетодыСлужебный.Модуль(228)}:Выполнить(Выражение);
{YAXUNIT ОбщийМодуль.ЮТМетодыСлужебный.Модуль(110)}:Возврат ВыполнитьВыражениеСПерехватомОшибки(Выражение, Параметры, Объект, Ложь);
{YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(321)}:Ошибка = ЮТМетодыСлужебный.ВыполнитьМетодОбъектаСПерехватомОшибки(ТестовыйМодуль, Тест.Метод, Тест.Параметры);
{YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(219)}:ВыполнитьТестовыйМетод(ТестовыйМодуль, Тест);
{YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(133)}:Результат = ВыполнитьНаборТестов(ТестовыйМодуль, Набор, ОписаниеТестовогоОбъекта);
{YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйВызовСервера.Модуль(41)}:Возврат ЮТИсполнительСлужебныйКлиентСервер.ВыполнитьГруппуНаборовТестов(Наборы, ТестовыйМодуль);`}]
    }]
  }, {
    name: 'ОМ_Тест',
    context: 'Сервер',
    package: 'ОМ_Тест',
    time: 0.835,
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
{ВнешняяОбработка.ЗапускТестовогоМодуля.МодульОбъекта(26)}:ПроверитьРавенство(Данные.Факт, Данные.Ожидание);
{ВнешняяОбработка.ЗапускТестовогоМодуля.МодульОбъекта(38)}:ЮТест.ОжидаетЧто(Факт).Равно(Ожидание);
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
{ВнешняяОбработка.ЗапускТестовогоМодуля.МодульОбъекта(32)}:ЮТест.ОжидаетЧто(1).ОтсутствующийМетод(2);
{(1)}:Объект.ТестСломан()
{YAXUNIT ОбщийМодуль.ЮТМетодыСлужебный.Модуль(228)}:Выполнить(Выражение);
{YAXUNIT ОбщийМодуль.ЮТМетодыСлужебный.Модуль(110)}:Возврат ВыполнитьВыражениеСПерехватомОшибки(Выражение, Параметры, Объект, Ложь);
{YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(321)}:Ошибка = ЮТМетодыСлужебный.ВыполнитьМетодОбъектаСПерехватомОшибки(ТестовыйМодуль, Тест.Метод, Тест.Параметры);
{YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(219)}:ВыполнитьТестовыйМетод(ТестовыйМодуль, Тест);
{YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйКлиентСервер.Модуль(133)}:Результат = ВыполнитьНаборТестов(ТестовыйМодуль, Набор, ОписаниеТестовогоОбъекта);
{YAXUNIT ОбщийМодуль.ЮТИсполнительСлужебныйВызовСервера.Модуль(41)}:Возврат ЮТИсполнительСлужебныйКлиентСервер.ВыполнитьГруппуНаборовТестов(Наборы, ТестовыйМодуль);`}]
    }]
  }]
  )
}

const view = new ModelView('model-tree')
bslEditor.getModel().getCodeModel().onDidChangeModel(() => {
  view.render(bslEditor.getModel().getCodeModel())
})
view.selector = (symbol) => {
  const range = symbolRange(symbol, bslEditor.getModel())
  bslEditor.editor.setSelection(range)
}