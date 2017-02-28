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
   * 有効期限を管理するオブジェクト
   * @type {object}
   * @private
   */
  static _expires = {};

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
        if (typeof Value._values[storageId][key] === 'undefined') {
          return;
        }
        Value._storages[storageId].setItem(key, JSON.stringify(Value._values[storageId][key]));
        Value._storages[storageId].setItem(Value._expiresKeyGen(key), Value._expires[storageId][key]);
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
        Value._storages[storageId].removeItem(Value._expiresKeyGen(key));
      });
    });
    Value._values = {};
    Value._expires = {};
    Value._storages = [];
  }

  /**
   * storage に保存されている期限切れデータを全て削除します。
   * どんな storage が使われているかは１つでもインスタンス化されてないとわからないので、
   * gc する storage は Value._storages にあるものだけを対象にします。
   */
  static gc() {
    for (let storageId = 0; storageId < Value._storages.length; ++storageId) {
      const storage = Value._storages[storageId];
      // storage に存在するキーリスト
      let keys = [];
      for (let i = 0; i < storage.length; ++i) {
        keys.push(storage.key(i));
      }

      // それぞれのキーについて
      keys.forEach((key) => {
        // expire 時刻を保存してあるキー名を調べる。
        const expiresKey = Value._expiresKeyGen(key);
        // キーが存在しないときは何もしない
        if (keys.indexOf(expiresKey) < 0) {
          return;
        }
        // 期限が切れていない場合は何もしない
        const expire = storage.getItem(expiresKey);
        if (!expire || parseInt(expire, 10) > Date.now()) {
          return;
        }
        // 期限切れの場合は、メモリと storage から削除
        delete Value._values[storageId][key];
        delete Value._expires[storageId][key];
        storage.removeItem(key);
        storage.removeItem(expiresKey);
      });
    }
  }

  /**
   * 有効期限用のキーを生成
   * @param {string} key
   * @returns {string}
   * @private
   */
  static _expiresKeyGen(key) {
    return `EXPIRES.${key}`;
  }

  /**
   * localStorage が利用可能かどうか
   * @returns {boolean}
   * @private
   */
  static _isLocalStorageAvailable() {
    try {
      return (typeof localStorage !== 'undefined');
    } catch (e) {}

    return false;
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
    const defaultStorage = Value._isLocalStorageAvailable() ? localStorage : memoryStorage;
    this._storage = typeof opt.storage !== 'undefined' ? opt.storage : defaultStorage;
    this._default = typeof opt.default !== 'undefined' ? opt.default : null;
    this._expires = typeof opt.expires === 'number' ? opt.expires : null;
    this._debouncedFlush = debounce(this.flush, opt.debounceTime ? opt.debounceTime : 200);
    this._namespace = typeof opt.namespace === 'string' ? `${opt.namespace}.` : '';
    this._key = `${this._namespace}${key}`;
    this._cleared = false;

    // 新たな storage を追加された場合は管理対象に追加
    if (Value._storages.indexOf(this._storage) < 0) {
      Value._storages.push(this._storage);
      Value._values[Value._storages.length -1] = {};
      Value._expires[Value._storages.length -1] = {};
      Value.gc();
    }
    this._storageId = Value._storages.indexOf(this._storage);

    // メモリ上に値がなければ storage から取り出す
    if(typeof Value._values[this._storageId][this._key] === 'undefined') {
      Value._values[this._storageId][this._key] = JSON.parse(this._storage.getItem(this._key));
      Value._expires[this._storageId][this._key] = JSON.parse(this._storage.getItem(Value._expiresKeyGen(this._key)));
    }
  }

  /**
   * Value インスタンスの内容を storage に保存
   */
  flush() {
    if (typeof Value._values[this._storageId] === 'undefined' || (typeof Value._values[this._storageId][this._key] === 'undefined')) {
      return;
    }
    this._storage.setItem(this._key, JSON.stringify(Value._values[this._storageId][this._key]));
    this._storage.setItem(Value._expiresKeyGen(this._key), Value._expires[this._storageId][this._key]);
  }

  /**
   * Value インスタンスの内容を初期化
   * storage の内容も削除
   */
  clear() {
    Value._values[this._storageId][this._key] = null;
    Value._expires[this._storageId][this._key] = null;
    this._storage.removeItem(this._key);
    this._storage.removeItem(Value._expiresKeyGen(this._key));
  }

  get value() {
    if (this.isExpired) {
      this.clear();
    }
    return Value._values[this._storageId][this._key] !== null ? Value._values[this._storageId][this._key] : this._default;
  }

  set value(value) {
    Value._values[this._storageId][this._key] = value;
    if (this._expires !== null) {
      Value._expires[this._storageId][this._key] = Date.now() + this._expires;
    }
    this._debouncedFlush();
  }

  /**
   * 有効期限が切れているかどうか
   * @returns {boolean}
   */
  get isExpired() {
    const expires = Value._expires[this._storageId][this._key];
    // そもそも有効期限が設定されていない場合は false
    if (expires === null) {
      return false;
    }
    if (Date.now() < expires) {
      return false;
    }
    return true;
  }
}
