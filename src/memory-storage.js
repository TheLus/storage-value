export class MemoryStorage {

  _items = new Map();

  setItem(key, value) {
    this._items.set(key, value);
  }

  getItem(key) {
    return this._items.get(key) !== undefined ? this._items.get(key) : null;
  }

  key(index) {
    const mapIterator = this._items.values();
    let item;
    for (let i = 0; i <= index; i++) {
      item = mapIterator.next();
    }
    return item.value !== undefined ? item.value : null;
  }

  removeItem(key) {
    this._items.delete(key);
  }

  clear() {
    this._items.clear();
  }

  get length() {
    return this._items.size;
  }
}

export default new MemoryStorage();
