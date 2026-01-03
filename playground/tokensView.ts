import { IToken } from "chevrotain";

export class TokensView {
    domId: string
    selector: (token: IToken) => void = () => { }

    constructor(domId: string) {
        this.domId = domId
    }

    render(tokens: IToken[]) {
        const container = document.getElementById(this.domId);
        if (!container) {
            return
        }
        container.innerHTML = "";

        if (!tokens || tokens.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.textContent = 'Токены отсутствуют';
            emptyDiv.className = 'error';
            container.appendChild(emptyDiv);
            return;
        }

        const table = document.createElement('table');
        table.className = 'tokens-table';

        // Заголовок таблицы
        const header = document.createElement('thead');
        const headerRow = document.createElement('tr');

        ['Индекс', 'Тип', 'Текст', 'Начало', 'Конец', 'Строка'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        header.appendChild(headerRow);
        table.appendChild(header);

        // Тело таблицы
        const tbody = document.createElement('tbody');
        tokens.forEach((token, index) => {
            const row = document.createElement('tr');
            
            // Обработчик клика на строку
            if (this.selector) {
                row.addEventListener('click', () => {
                    this.selector(token);
                });
            }

            // Индекс
            const indexCell = document.createElement('td');
            indexCell.className = 'token-index';
            indexCell.textContent = index.toString();
            row.appendChild(indexCell);

            // Тип токена
            const typeCell = document.createElement('td');
            typeCell.className = 'token-type';
            typeCell.textContent = token.tokenType.name;
            row.appendChild(typeCell);

            // Текст токена
            const textCell = document.createElement('td');
            textCell.className = 'token-text';
            textCell.textContent = token.image;
            row.appendChild(textCell);

            // Начало
            const startCell = document.createElement('td');
            startCell.className = 'token-offset';
            startCell.textContent = token.startOffset?.toString() ?? '-';
            row.appendChild(startCell);

            // Конец
            const endCell = document.createElement('td');
            endCell.className = 'token-offset';
            endCell.textContent = (token.endOffset ?? token.startOffset)?.toString() ?? '-';
            row.appendChild(endCell);

            // Строка
            const lineCell = document.createElement('td');
            lineCell.className = 'token-offset';
            lineCell.textContent = token.startLine?.toString() ?? '-';
            row.appendChild(lineCell);

            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        container.appendChild(table);
    }
}
