import assert from 'power-assert';
import Value from '../src/value';

describe('Value', () => {

  beforeEach(() => {
    Value.clear();
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
});
