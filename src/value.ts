import debounce = require('lodash.debounce');
import memoryStorage from './memory-storage';

export class Value {

  /**
   * new Value によって作られた値の配列
   * @private
   */
  static _values: {[key: string]: any}[] = [];

  /**
   * 有効期限を管理するオブジェクト
   * @private
   */
  static _expires: {[key: string]: number | null}[] = [];

  /**
   * storage 指定によって指定された storage の配列
   * @private
   */
  static _storages: Storage[] = [];

  /**
   * 全ての Value インスタンスを storage に保存
   */
  static flush(): void {
    Value._storages.forEach((storage, storageId) => {
      Object.keys(Value._values[storageId]).forEach((key) => {
        const value = Value._values[storageId][key];
        const expire = Value._expires[storageId][key];
        const expireKey = Value._expiresKeyGen(key);
        if (typeof value === 'undefined') {
          return;
        }

        storage.setItem(key, JSON.stringify(value));
        expire ? storage.setItem(expireKey, JSON.stringify(expire)) : storage.removeItem(expireKey);
      });
    });
  }

  /**
   * 全ての Value インスタンスを初期化
   */
  static clear(): void {
    Value._storages.forEach((storage, storageId) => {
      Object.keys(Value._values[storageId]).forEach((key) => {
        storage.removeItem(key);
        storage.removeItem(Value._expiresKeyGen(key));
      });
    });
    Value._values = [];
    Value._expires = [];
    Value._storages = [];
  }

  /**
   * storage に保存されている期限切れデータを全て削除します。
   * どんな storage が使われているかは１つでもインスタンス化されてないとわからないので、
   * gc する storage は Value._storages にあるものだけを対象にします。
   */
  static gc(): void {
    const iterate = (storage: Storage, callback: (key: string) => void) => {
      if (typeof storage.key == 'function') {
        const keys = [];
        for (let i = 0; i < storage.length; ++i) {
          const key = storage.key(i);
          if (key) {
            keys.push(key)
          }
        }
        keys.forEach(key => callback(key));
      } else {
        for (let key in storage) {
          callback(key);
        }
      }
    };
    Value._storages.forEach((storage, storageId) => {
      iterate(storage, key => {
        // expire 時刻を保存してあるキー名を調べる。
        const expiresKey = Value._expiresKeyGen(key);
        let expires;
        try {
          expires = JSON.parse(storage.getItem(expiresKey) as string);
        } catch (error) {
          (console.error || console.log)('invalid expires on storage-value', expiresKey, error);
          return
        }
        // expires が数値でないときは何もしない
        if (typeof expires !== 'number') {
          return
        }
        // 期限が切れていない場合は何もしない
        if (expires > Date.now()) {
          return
        }
        // 期限切れの場合は、メモリと storage から削除
        delete Value._values[storageId][key];
        delete Value._expires[storageId][key];
        storage.removeItem(key);
        storage.removeItem(expiresKey);
      })
    });
  }

  /**
   * 有効期限用のキーを生成
   * @private
   */
  static _expiresKeyGen(key: string): string {
    return `EXPIRES.${key}`;
  }

  /**
   * localStorage が利用可能かどうか
   * @private
   */
  static _isLocalStorageAvailable(): boolean {
    try {
      return (typeof localStorage !== 'undefined');
    } catch (e) {}

    return false;
  }

  /**
   * namespace 指定をした Value を返す
   */
  static namespace(name: string): (key: string, opt?: Option) => Value {
    return (key: string, opt: Option = {}) => {
      opt.namespace = name;
      return new Value(key, opt);
    };
  }

  private storage: Storage;
  private defaults: any;
  private expires: number | null;
  private debouncedFlush: () => void;
  private namespace: string;
  private key: string;
  private storageId: number;

  constructor(key: string, opt: Option = {}) {
    const defaultStorage = Value._isLocalStorageAvailable() ? localStorage : memoryStorage;
    this.storage = typeof opt.storage !== 'undefined' ? opt.storage : defaultStorage;
    this.defaults = typeof opt.default !== 'undefined' ? opt.default : null;
    this.expires = typeof opt.expires === 'number' ? opt.expires : null;
    this.debouncedFlush = debounce(this.flush, opt.debounceTime ? opt.debounceTime : 200);
    this.namespace = typeof opt.namespace === 'string' ? `${opt.namespace}.` : '';
    this.key = `${this.namespace}${key}`;
    this.storageId = Value._storages.indexOf(this.storage);

    // 新たな storage を追加された場合は管理対象に追加
    if (this.storageId < 0) {
      this.storageId = Value._storages.length;
      Value._storages[this.storageId] = this.storage;
      Value._values[this.storageId] = {};
      Value._expires[this.storageId] = {};
      Value.gc();
    }

    // メモリ上に値がなければ storage から取り出す
    if (typeof Value._values[this.storageId][this.key] === 'undefined') {
      try {
        Value._values[this.storageId][this.key] = JSON.parse(this.storage.getItem(this.key) as string);
        Value._expires[this.storageId][this.key] = JSON.parse(this.storage.getItem(Value._expiresKeyGen(this.key)) as string);
      } catch (error) {
        (console.error || console.log)('invalid value on storage-value', this.key, error);
      }
    }
  }

  /**
   * Value インスタンスの内容を storage に保存
   */
  flush(): void {
    if (typeof Value._values[this.storageId] === 'undefined' || (typeof Value._values[this.storageId][this.key] === 'undefined')) {
      return;
    }
    this.storage.setItem(this.key, JSON.stringify(Value._values[this.storageId][this.key]));
    const expires = Value._expires[this.storageId][this.key];
    typeof expires === 'number' && this.storage.setItem(Value._expiresKeyGen(this.key), JSON.stringify(expires));
  }

  /**
   * Value インスタンスの内容を初期化
   * storage の内容も削除
   */
  clear(): void {
    delete Value._values[this.storageId][this.key];
    delete Value._expires[this.storageId][this.key];
    this.storage.removeItem(this.key);
    this.storage.removeItem(Value._expiresKeyGen(this.key));
  }

  get useDefault(): boolean {
    if (this.isExpired) {
      this.clear();
    }
    const value = Value._values[this.storageId][this.key];
    return (value === null || typeof value === 'undefined');
  }

  get value(): any {
    if (this.isExpired) {
      this.clear();
    }
    return this.useDefault ? this.defaults : Value._values[this.storageId][this.key];
  }

  set value(value: any) {
    Value._values[this.storageId][this.key] = value;
    if (this.expires !== null) {
      Value._expires[this.storageId][this.key] = Date.now() + this.expires;
    }
    this.debouncedFlush();
  }

  /**
   * 有効期限が切れているかどうか
   */
  get isExpired(): boolean {
    const expires = Value._expires[this.storageId][this.key];
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

export type Option = {
  storage?: Storage,
  default?: any,
  expires?: number,
  debounceTime?: number,
  namespace?: string
};

export default Value;
