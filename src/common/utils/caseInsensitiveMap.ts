export class CaseInsensitiveMap<T> extends Map<string, T> {
    set(key: string, value: T): this {
        key = key.toLowerCase();
        return super.set(key, value);
    }

    get(key: string): T | undefined {
        key = key.toLowerCase();
        return super.get(key);
    }

    has(key: string): boolean {
        key = key.toLowerCase();
        return super.has(key);
    }
}