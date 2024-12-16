import resolver from '../src/bsl/resolver';
import '../src/main';
import { editor, Position } from 'monaco-editor';



describe('resolver', () => {
    beforeAll(async () => {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
                const tokens = editor.tokenize(`ЮТест.ОжидаетЧто(ТаблицаТоваров).ИмеетТип("ТаблицаЗначений")`, "bsl");
                console.log("tokens", tokens);
                resolve(0);
            }, 5000)
        });
    })

    const model = editor.createModel('ЮТест.ОжидаетЧто(ТаблицаТоваров).ИмеетТип("ТаблицаЗначений")', 'bsl');
    test('simple', () => {
        expect(resolver.resolve(model, new Position(1, 33))).toStrictEqual(['ЮТест.ОжидаетЧто(ТаблицаТоваров)']);
    });
});

