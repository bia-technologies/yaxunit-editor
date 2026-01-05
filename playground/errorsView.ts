import { ILexingError, IRecognitionException } from "chevrotain";

interface UnifiedError {
    line?: number;
    column?: number;
    offset: number;
    length?: number;
    message: string;
    type: 'lex' | 'parse';
}

export class ErrorsView {
    domId: string
    selector: (error: UnifiedError) => void = () => { }

    constructor(domId: string) {
        this.domId = domId
    }

    render(lexErrors: ILexingError[], parseErrors: IRecognitionException[]) {
        const container = document.getElementById(this.domId);
        if (!container) {
            return
        }
        container.innerHTML = "";

        // Преобразуем ошибки лексера в унифицированный формат
        const unifiedLexErrors: UnifiedError[] = lexErrors.map(error => ({
            line: error.line,
            column: error.column,
            offset: error.offset,
            length: error.length,
            message: error.message || 'Неизвестная ошибка',
            type: 'lex'
        }));

        // Преобразуем ошибки парсера в унифицированный формат
        const unifiedParseErrors: UnifiedError[] = parseErrors.map(error => ({
            line: error.token.startLine,
            column: error.token.startColumn,
            offset: error.token.startOffset,
            length: error.token.endOffset !== undefined 
                ? (error.token.endOffset - error.token.startOffset + 1)
                : 1,
            message: error.message || 'Неизвестная ошибка',
            type: 'parse'
        }));

        // Объединяем все ошибки
        const allErrors = [...unifiedLexErrors, ...unifiedParseErrors];

        if (allErrors.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.textContent = 'Ошибок не обнаружено';
            emptyDiv.className = 'success';
            container.appendChild(emptyDiv);
            return;
        }

        const table = document.createElement('table');
        table.className = 'tokens-table';

        // Заголовок таблицы
        const header = document.createElement('thead');
        const headerRow = document.createElement('tr');

        ['Тип', 'Строка', 'Столбец', 'Смещение', 'Длина', 'Сообщение'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        header.appendChild(headerRow);
        table.appendChild(header);

        // Тело таблицы
        const tbody = document.createElement('tbody');
        allErrors.forEach((error) => {
            const row = document.createElement('tr');
            row.className = 'error-row';
            
            // Обработчик клика на строку
            if (this.selector) {
                row.addEventListener('click', () => {
                    this.selector(error);
                });
            }

            // Тип ошибки
            const typeCell = document.createElement('td');
            typeCell.className = 'error-type';
            typeCell.textContent = error.type === 'lex' ? 'Лексер' : 'Парсер';
            row.appendChild(typeCell);

            // Строка
            const lineCell = document.createElement('td');
            lineCell.className = 'error-line';
            lineCell.textContent = (error.line ?? '-').toString();
            row.appendChild(lineCell);

            // Столбец
            const columnCell = document.createElement('td');
            columnCell.className = 'error-column';
            columnCell.textContent = (error.column ?? '-').toString();
            row.appendChild(columnCell);

            // Смещение
            const offsetCell = document.createElement('td');
            offsetCell.className = 'error-offset';
            offsetCell.textContent = error.offset.toString();
            row.appendChild(offsetCell);

            // Длина
            const lengthCell = document.createElement('td');
            lengthCell.className = 'error-length';
            lengthCell.textContent = (error.length ?? 1).toString();
            row.appendChild(lengthCell);

            // Сообщение
            const messageCell = document.createElement('td');
            messageCell.className = 'error-message';
            messageCell.textContent = error.message;
            row.appendChild(messageCell);

            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        container.appendChild(table);
    }
}