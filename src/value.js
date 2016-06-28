class Value {

  constructor(key, opt) {
    this._key = key;
    this._value = undefined;
    this._storage = localStorage;
    if (opt) {
      if (opt.default) {
        this._value = opt.default;
      }
      if (opt.storage) {
        this._storage = opt.storage;
      }
    }
    const lastValue = JSON.parse(this._storage.getItem(this._key));
    if (lastValue) {
      this._value = lastValue;
    }
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._storage.setItem(this._key, JSON.stringify(value));
    this._value = value;
  }
}

module.exports = Value;
