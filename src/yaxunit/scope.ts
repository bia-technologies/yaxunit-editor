import { TypeDefinition, SymbolType, PredefinedType, MethodSymbol, GlobalScope } from "../scope"

const scope: TypeDefinition = new PredefinedType('', [
    {
        kind: SymbolType.property,
        name: 'ЮТест',
        type: 'CommonModule.ЮТест'
    }
])

const symbols: TypeDefinition[] = [
    new PredefinedType('CommonModule.ЮТест', [
        {
            kind: SymbolType.function,
            name: 'ОжидаетЧто',
            params: [
                {
                    name: 'ПроверяемоеЗначение',
                    type: 'Произвольный',
                    def: 'Проверяемое фактическое значение'
                }, {
                    name: 'Сообщение',
                    type: 'Строка',
                    def: 'Описание проверки, которое будет выведено при возникновении ошибки'
                }
            ],
            type: 'CommonModule.ЮТУтверждения'
        } as MethodSymbol,
        {
            kind: SymbolType.function,
            name: 'ОжидаетЧтоТаблицаБазы',
            type: 'CommonModule.ЮТУтвержденияИБ'
        },
        {
            kind: SymbolType.function,
            name: 'Данные',
            type: 'CommonModule.ЮТТестовыеДанные'
        },
        {
            kind: SymbolType.function,
            name: 'Предикат',
            type: 'CommonModule.ЮТПредикаты'
        },
        {
            kind: SymbolType.function,
            name: 'Варианты',
            type: 'CommonModule.ЮТКонструкторВариантов'
        },
        {
            kind: SymbolType.function,
            name: 'Контекст',
            type: 'CommonModule.ЮТКонтекстТеста'
        },
        {
            kind: SymbolType.procedure,
            name: 'Пропустить'
        },
        {
            kind: SymbolType.function,
            name: 'КонтекстТеста',
            type: 'Структура'
        },
        {
            kind: SymbolType.function,
            name: 'КонтекстТестовогоНабора',
            type: 'Структура'
        },
        {
            kind: SymbolType.function,
            name: 'КонтекстМодуля',
            type: 'Структура'
        },
        {
            kind: SymbolType.procedure,
            name: 'Пауза'
        },
        {
            kind: SymbolType.procedure,
            name: 'ВывестиВКонсоль'
        },
        {
            kind: SymbolType.procedure,
            name: 'ДобавитьСообщение'
        },
        {
            kind: SymbolType.procedure,
            name: 'ДобавитьПредупреждение'
        },
    ]),
    new PredefinedType('CommonModule.ЮТУтверждения', [
        {
            name: 'Что',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'Метод',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'Параметр',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ИмеющееПредставление',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'Свойство',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'НетСвойства',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'Элемент',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'Объект',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'Равно',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'НеРавно',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'Больше',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'БольшеИлиРавно',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'Меньше',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'МеньшеИлиРавно',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'Заполнено',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'НеЗаполнено',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ИмеетТип',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'НеИмеетТип',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'Содержит',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'НеСодержит',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'СодержитСтрокуПоШаблону',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'НеСодержитСтрокуПоШаблону',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ИмеетСвойство',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'НеИмеетСвойства',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ВСписке',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'МеждуВключаяГраницы',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'МеждуИсключаяГраницы',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'МеждуВключаяНачалоГраницы',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'МеждуВключаяОкончаниеГраницы',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ИмеетСвойстваРавные',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ЭтоИстина',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ЭтоНеИстина',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ЭтоЛожь',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ЭтоНеЛожь',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'Существует',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'НеСуществует',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ЭтоНеопределено',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ЭтоНеНеопределено',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ЭтоNull',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ЭтоНеNull',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ИмеетДлину',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ИмеетДлинуБольше',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ИмеетДлинуМеньше',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'НеИмеетДлину',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ВыбрасываетИсключение',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'НеВыбрасываетИсключение',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ИмеетМетод',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'НачинаетсяС',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ЗаканчиваетсяНа',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'КаждыйЭлементСодержитСвойство',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'КаждыйЭлементСодержитСвойствоСоЗначением',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ЛюбойЭлементСодержитСвойство',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ЛюбойЭлементСодержитСвойствоСоЗначением',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'СоответствуетПредикату',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'КаждыйЭлементСоответствуетПредикату',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
        {
            name: 'ЛюбойЭлементСоответствуетПредикату',
            kind: SymbolType.function,
            type: 'CommonModule.ЮТУтверждения'
        },
    ])
]


GlobalScope.registerGlobalSymbols(scope.getMembers())
GlobalScope.registerTypes(symbols)
