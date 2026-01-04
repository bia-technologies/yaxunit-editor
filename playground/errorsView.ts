import { ILexingError } from "chevrotain";

export class ErrorsView {
    domId: string
    selector: (error: ILexingError) => void = () => { }

    constructor(domId: string) {
        this.domId = domId
    }

    render(errors: ILexingError[]) {
        const container = document.getElementById(this.domId);
        if (!container) {
            return
        }
        container.innerHTML = "";

        if (!errors || errors.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.textContent = 'Ошибок лексера не обнаружено';
            emptyDiv.className = 'success';
            container.appendChild(emptyDiv);
            return;
        }

        const table = document.createElement('table');
        table.className = 'tokens-table';

        // Заголовок таблицы
        const header = document.createElement('thead');
        const headerRow = document.createElement('tr');

        ['Строка', 'Столбец', 'Смещение', 'Длина', 'Сообщение'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        header.appendChild(headerRow);
        table.appendChild(header);

        // Тело таблицы
        const tbody = document.createElement('tbody');
        errors.forEach((error, index) => {
            const row = document.createElement('tr');
            row.className = 'error-row';
            
            // Обработчик клика на строку
            if (this.selector) {
                row.addEventListener('click', () => {
                    this.selector(error);
                });
            }

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
            messageCell.textContent = error.message || 'Неизвестная ошибка';
            row.appendChild(messageCell);

            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        container.appendChild(table);
    }
}