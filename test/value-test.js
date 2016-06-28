import assert from 'power-assert';
import Value from '../src/value';

describe('Value', () => {

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('value に代入すると LocalStorage に保存される', () => {
    const test1 = new Value('test');
    test1.value = 100;
    const test2 = new Value('test');
    assert(test2.value === 100);

    localStorage.clear();
    const test3 = new Value('test');
    assert(test3.value === undefined);
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
    const test = new Value('test', {default: 30});
    assert(test.value === 30);
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
});
