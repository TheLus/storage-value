export class MemoryStorage implements Storage {

  private items: Map<string, any> = new Map();

  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }

  getItem(key: string): string | null {
    return this.items.get(key) !== undefined ? this.items.get(key) : null;
  }

  key(index: number): string | null {
    const mapIterator = this.items.values();
    let item: IteratorResult<string> | undefined;
    for (let i = 0; i <= index; i++) {
      item = mapIterator.next();
    }
    if (!item) {
      return null;
    }
    return item.value !== undefined ? item.value : null;
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }

  clear(): void {
    this.items.clear();
  }

  get length(): number {
    return this.items.size;
  }

  [key: string]: any;

  [index: number]: string;
}

export default new MemoryStorage();
