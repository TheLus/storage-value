import assert from 'power-assert';
import Value from '../lib/value';

const nativeConsoleError = console.error;
let errors = [];

describe('Value', () => {

  before(() => {
    // console.error() をテスト用に上書きする
    console.error = (...args) => {
      errors.push(args);
    };
  });

  beforeEach(() => {
    Value.clear();
  });

  afterEach(() => {
    errors = [];
  });

  after(() => {
    console.error = nativeConsoleError;
  });

  it('value に代入すると storage に保存される', () => {
    const test1 = new Value('test');
    test1.value = 100;
    const test2 = new Value('test');
    assert(test2.value === 100);

    // clear で storage の内容も削除される
    test1.clear();
    const test3 = new Value('test');
    assert(test3.value === null);
  });

  it('value に代入すると、storage から値を参照するので同じ key の value の返り値も変わる', () => {
    const test1 = new Value('test');
    test1.value = 100;
    const test2 = new Value('test');
    test2.value = 200;
    assert(test1.value === 200);
  });

  it('flush で localStorage に保存される', () => {
    const localStorageTest = new Value('localStorageTest');
    localStorageTest.value = 100;
    localStorageTest.flush();
    const storageValue = JSON.parse(localStorage.getItem('localStorageTest'));
    assert(storageValue === 100);
  });

  it('undefined は保存できない', () => {
    const test1 = new Value('test');
    test1.value = undefined;
    const test2 = new Value('test');
    assert(test2.value === null);
    const flush_test1 = new Value('flush_test');
    flush_test1.value = undefined;
    flush_test1.flush();
    const flush_test2 = new Value('flush_test', {default: 100});
    assert(flush_test2.value === 100);

  });

  it('object を利用できる', () => {
    const targetObj = {hoge: 'hoge', fuga: 200};
    const test1 = new Value('test');
    test1.value = {hoge: 'hoge', fuga: 200};
    const test2 = new Value('test');
    assert(test2.value.length === targetObj.length);
    Object.keys(targetObj).forEach((key) => {
      assert(test2.value[key] === targetObj[key]);
    });
  });

  it('初期値を指定できる', () => {
    const test1 = new Value('test', {default: 30});
    assert(test1.value === 30);
    const test2 = new Value('test');
    assert(test2.value === null);
  });

  it('初期値を指定した値に 0 や false を設定できる', () => {
    const test1 = new Value('test', {default: 100});
    assert(test1.value === 100);
    test1.value = 0;
    assert(test1.value === 0);
    test1.value = false;
    assert(test1.value === false);
  });

  it('初期値に false を指定できる', () => {
    const test1 = new Value('test', {default: false});
    assert(test1.value === false);
    const test2 = new Value('test');
    assert(test2.value === null);
  });

  it('storage の指定ができる', () => {
    const test1 = new Value('test');
    test1.value = 30;
    const test2 = new Value('test', {storage: sessionStorage});
    test2.value = 50;
    const test3 = new Value('test');
    assert(test3.value === 30);
    test3.value = 100;
    const test4 = new Value('test', {storage: sessionStorage});
    assert(test4.value === 50);
  });

  it('namespace の指定ができる', () => {
    const HogeValue = Value.namespace('hoge');
    const FugaValue = Value.namespace('fuga');
    const test1 = new HogeValue('test');
    test1.value = 30;
    const test2 = new FugaValue('test');
    assert(test2.value === null);
    test2.value = 50;
    assert(test1.value === 30);
  });

  it('expires の指定ができる', () => {
    const test1 = new Value('test1', {expires: 300});
    test1.value = 30;
    const test2 = new Value('test2', {expires: 300, default: 100});
    test2.value = 200;
    return new Promise((resolve) => {
      setTimeout(() => {
        assert(test1.value === null);
        assert(test2.value === 100);
        resolve();
      }, 600);
    });
  });

  it('同一のキーに対して expires の指定をしたりしなかったりできる', () => {
    const test1 = new Value('test', {expires: 300, default: 100});
    test1.value = 30;
    const test2 = new Value('test', {default: 200});
    assert(test2.value === 30);
    return new Promise((resolve) => {
      setTimeout(() => {
        assert(test1.value === 100);
        assert(test2.value === 200);
        const test3 = new Value('test', {default: 300});
        assert(test3.value === 300);
        resolve();
      }, 600);
    });
  });

  it('gc で期限切れのデータが削除される', () => {
    const test1 = new Value('test1', {expires: 300});
    test1.value = 30;
    const test2 = new Value('test2', {expires: 1000});
    test2.value = 50;
    return new Promise((resolve) => {
      setTimeout(() => {
        Value.gc();
        assert(test1.value === null);
        assert(test2.value === 50);
        assert(localStorage.getItem('test1') === null);
        assert(localStorage.getItem(Value._expiresKeyGen('test1')) === null);
        assert(localStorage.getItem('test2') === '50');
        resolve();
      }, 600);
    });
  });

  it('invalid な値が入っている場合は無視されて console.error 出力がされる', () => {
    // {} が閉じられていない
    localStorage.setItem('InVaLiD', '{"foo":"var"');

    const v = new Value('InVaLiD');
    assert(v.value === null);
    assert(errors.length === 1);
    const error = errors[0];
    assert(error[0] === 'invalid value on storage-value');
    assert(error[1] === 'InVaLiD');
  });

  it('gc で expires が未指定のキーは削除しない', () => {
    const v = new Value('test');
    v.value = 'a';
    return new Promise((resolve) => {
      // 非同期で実行される flush の解決を待つ
      setTimeout(() => {
        assert(v.value === 'a', 'gc する前に既に削除されている');
        Value.gc();
        assert(v.value === 'a', 'gc によって削除されている');
        resolve();
      }, 600);
    });
  });
});
