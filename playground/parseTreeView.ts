import { CstNode } from "chevrotain";

export class ParseTreeView {
    domId: string
    selector: (node: CstNode) => void = () => { }

    constructor(domId: string) {
        this.domId = domId
    }

    render(cst: CstNode | undefined) {
        const container = document.getElementById(this.domId);
        if (!container) {
            return
        }
        container.innerHTML = "";
        
        if (!cst) {
            const emptyDiv = document.createElement('div');
            emptyDiv.textContent = 'Parse tree отсутствует';
            emptyDiv.className = 'error';
            container.appendChild(emptyDiv);
            return;
        }

        const tree = this.buildTree(cst);
        container.appendChild(tree);
    }

    private buildTree(node: CstNode, depth: number = 0): HTMLElement {
        const div = document.createElement('div');
        div.className = 'node';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'type';
        nameSpan.textContent = node.name;
        
        // Добавляем обработчик клика на имя узла
        if (this.selector && node.location) {
            nameSpan.addEventListener('click', () => {
                this.selector(node);
            });
        }
        
        div.appendChild(nameSpan);

        if (node.location) {
            const locationSpan = document.createElement('span');
            locationSpan.className = 'token';
            locationSpan.textContent = ` [${node.location.startOffset}-${node.location.endOffset}]`;
            div.appendChild(locationSpan);
        }

        if (node.children) {
            const children = Object.entries(node.children);
            children.forEach(([key, values]) => {
                if (Array.isArray(values)) {
                    values.forEach((value) => {
                        if (value && typeof value === 'object' && 'children' in value) {
                            // Это CstNode
                            const childNode = this.buildTree(value as CstNode, depth + 1);
                            // Добавляем ключ правила перед узлом
                            const keyDiv = document.createElement('div');
                            keyDiv.className = 'node';
                            const keySpan = document.createElement('span');
                            keySpan.className = 'token';
                            keySpan.textContent = `${key}:`;
                            keyDiv.appendChild(keySpan);
                            div.appendChild(keyDiv);
                            div.appendChild(childNode);
                        } else if (value && typeof value === 'object' && 'image' in value) {
                            // Это токен
                            const tokenDiv = document.createElement('div');
                            tokenDiv.className = 'node';
                            const keySpan = document.createElement('span');
                            keySpan.className = 'token';
                            keySpan.textContent = `${key}: `;
                            tokenDiv.appendChild(keySpan);
                            
                            const tokenSpan = document.createElement('span');
                            tokenSpan.className = 'token';
                            const token = value as any;
                            const endOffset = token.endOffset ?? token.startOffset;
                            tokenSpan.textContent = `"${token.image}" [${token.startOffset}-${endOffset}]`;
                            tokenDiv.appendChild(tokenSpan);
                            div.appendChild(tokenDiv);
                        }
                    });
                }
            });
        }

        return div;
    }
}
