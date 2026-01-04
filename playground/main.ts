import '../src/styles/style.css'

import editorWorker from 'monaco-editor-core/esm/vs/editor/editor.worker?worker'
import '@/bsl/editor/language/contribution.js'
import '@/yaxunit'
import '@/bsl/scope/platform'
import { ModelView } from './modelView'
import { ParseTreeView } from './parseTreeView'
import { TokensView } from './tokensView'
import { ErrorsView } from './errorsView'
import { symbolRange } from '@/bsl/codeModel/utils'
import { YAxUnitEditor } from '@/yaxunit'
import { IncrementalBslParser } from '@/bsl/chevrotain/parser'

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
      name: 'Успешный тест',
      time: 0.123,
    }, {
      classname: 'ОМ_Тест.ТестОшибка',
      name: 'Тест с ошибкой',
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
      name: 'Сломанный тест',
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
      name: 'Успешный тест',
      time: 0.123,
    }, {
      classname: 'ОМ_Тест.ТестОшибка',
      name: 'Тест с ошибкой',
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
      name: 'Сломанный тест',
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

// Инициализация вкладок
const codeModelView = new ModelView('model-tree')
const parseTreeView = new ParseTreeView('parse-tree')
const tokensView = new TokensView('tokens')
const errorsView = new ErrorsView('errors')

// Переключение вкладок
const tabButtons = document.querySelectorAll('.tab-button')
const tabPanes = document.querySelectorAll('.tab-pane')

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const tabName = button.getAttribute('data-tab')
    
    // Убираем активный класс со всех кнопок и панелей
    tabButtons.forEach(btn => btn.classList.remove('active'))
    tabPanes.forEach(pane => pane.classList.remove('active'))
    
    // Добавляем активный класс к выбранной кнопке и панели
    button.classList.add('active')
    const targetPane = document.getElementById(`tab-${tabName}`)
    if (targetPane) {
      targetPane.classList.add('active')
    }
  })
})

// Создаем отдельный парсер для playground (для отображения parse tree и tokens)
const playgroundParser = new IncrementalBslParser()

// Функция для обновления всех представлений
function updateAllViews() {
  const model = bslEditor.getModel()
  const codeModel = model.getCodeModel()
  
  // Обновляем модель кода
  codeModelView.render(codeModel)
  
  // Парсим текст для отображения parse tree и tokens
  const editorModel = bslEditor.editor.getModel()
  if (editorModel) {
    const text = editorModel.getValue()
    
    try {
      const parseResult = playgroundParser.parseModule(text)
      
      // Обновляем parse tree
      parseTreeView.render(parseResult.cst)
      
      // Обновляем tokens
      tokensView.render(playgroundParser.lexer.moduleTokens)
      
      // Обновляем ошибки лексера
      errorsView.render(playgroundParser.lexer.lexingErrors)
    } catch (error) {
      console.error('Ошибка парсинга:', error)
    }
  }
}

codeModelView.selector = (symbol) => {
  const range = symbolRange(symbol, bslEditor.getModel())
  bslEditor.editor.setSelection(range)
}

tokensView.selector = (token) => {
  const model = bslEditor.editor.getModel()
  if (!model || token.startOffset === undefined) {
    return
  }
  
  const startPosition = model.getPositionAt(token.startOffset)
  const endOffset = token.endOffset ?? token.startOffset
  const endPosition = model.getPositionAt(endOffset + 1)
  
  bslEditor.editor.setSelection({
    startLineNumber: startPosition.lineNumber,
    startColumn: startPosition.column,
    endLineNumber: endPosition.lineNumber,
    endColumn: endPosition.column
  })
  
  bslEditor.editor.revealLineInCenter(startPosition.lineNumber)
}

parseTreeView.selector = (node) => {
  const model = bslEditor.editor.getModel()
  if (!model || !node.location) {
    return
  }
  
  const startPosition = model.getPositionAt(node.location.startOffset)
  const endOffset = node.location.endOffset ?? node.location.startOffset
  const endPosition = model.getPositionAt(endOffset + 1)
  
  bslEditor.editor.setSelection({
    startLineNumber: startPosition.lineNumber,
    startColumn: startPosition.column,
    endLineNumber: endPosition.lineNumber,
    endColumn: endPosition.column
  })
  
  bslEditor.editor.revealLineInCenter(startPosition.lineNumber)
}

errorsView.selector = (error) => {
  const model = bslEditor.editor.getModel()
  if (!model || error.offset === undefined) {
    return
  }
  
  const startPosition = model.getPositionAt(error.offset)
  const errorLength = error.length ?? 1
  const endOffset = error.offset + errorLength
  const endPosition = model.getPositionAt(endOffset)
  
  bslEditor.editor.setSelection({
    startLineNumber: startPosition.lineNumber,
    startColumn: startPosition.column,
    endLineNumber: endPosition.lineNumber,
    endColumn: endPosition.column
  })
  
  bslEditor.editor.revealLineInCenter(startPosition.lineNumber)
}

// Обновляем представления при изменении модели кода
bslEditor.getModel().getCodeModel().onDidChangeModel(() => {
  updateAllViews()
})

// Обновляем при изменении содержимого редактора
bslEditor.editor.getModel()?.onDidChangeContent(() => {
  // Небольшая задержка, чтобы дать время парсеру обновиться
  setTimeout(() => {
    updateAllViews()
  }, 100)
})

// Первоначальное обновление
updateAllViews()