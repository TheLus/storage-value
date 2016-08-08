import debounce from 'lodash.debounce';
import memoryStorage from './memory-storage';

export default class Value {

  /**
   * new Value によって作られた値の配列
   * @type {object}
   * @private
   */
  static _values = {};

  /**
   * storage 指定によって指定された storage の配列
   * @type {object[]}
   * @private
   */
  static _storages = [];

  /**
   * 全ての Value インスタンスを storage に保存
   */
  static flush() {
    Object.keys(Value._values).forEach((storageId) => {
      Object.keys(Value._values[storageId]).forEach((key) => {
        Value._storages[storageId].setItem(key, JSON.stringify(Value._values[storageId][key]));
      });
    });
  }

  /**
   * 全ての Value インスタンスを初期化
   */
  static clear() {
    Object.keys(Value._values).forEach((storageId) => {
      Object.keys(Value._values[storageId]).forEach((key) => {
        Value._storages[storageId].removeItem(key);
      });
    });
    Value._values = {};
    Value._storages = [];
  }

  /**
   * namespace 指定をした Value を返す
   * @param {string} name
   * @returns {function(key: string, opt: object)}
   */
  static namespace(name) {
    return (key, opt = {}) => {
      opt.namespace = name;
      return new Value(key, opt);
    };
  }

  constructor(key, opt = {}) {
    const defaultStorage = typeof localStorage !== 'undefined' ? localStorage : memoryStorage;
    this._storage = typeof opt.storage !== 'undefined' ? opt.storage : defaultStorage;
    this._default = typeof opt.default !== 'undefined' ? opt.default : null;
    this._debouncedFlush = debounce(this.flush, opt.debounceTime ? opt.debounceTime : 200);
    this._namespace = typeof opt.namespace === 'string' ? opt.namespace : '';
    this._key = this._namespace + key;

    // 新たな storage を追加された場合は管理対象に追加
    if (Value._storages.indexOf(this._storage) < 0) {
      Value._storages.push(this._storage);
      Value._values[Value._storages.length -1] = {};
    }
    this._storageId = Value._storages.indexOf(this._storage);

    // メモリ上に値がなければ storage から取り出す
    if(typeof Value._values[this._storageId][this._key] === 'undefined') {
      Value._values[this._storageId][this._key] = JSON.parse(this._storage.getItem(this._key));
    }
  }

  /**
   * Value インスタンスの内容を storage に保存
   */
  flush() {
    this._storage.setItem(this._key, JSON.stringify(Value._values[this._storageId][this._key]));
  }

  /**
   * Value インスタンスの内容を初期化
   * storage の内容も削除
   */
  clear() {
    Value._values[this._storageId][this._key] = null;
    this._storage.removeItem(this._key);
  }

  get value() {
    return Value._values[this._storageId][this._key] !== null ? Value._values[this._storageId][this._key] : this._default;
  }

  set value(value) {
    Value._values[this._storageId][this._key] = value;
    this._debouncedFlush();
  }
}
