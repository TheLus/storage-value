import assert from 'power-assert';
import memoryStorage from '../lib/memory-storage';

describe('memoryStorage', () => {

  beforeEach(() => {
    memoryStorage.clear();
  });

  it('setItem したものを getItem で取得できる', () => {
    memoryStorage.setItem('test', 'setItemTest');
    assert(memoryStorage.getItem('test') === 'setItemTest');
  });

  it('length で要素数を取得できる', () => {
    memoryStorage.setItem('test1', 'abc');
    memoryStorage.setItem('test2', 'def');
    assert(memoryStorage.length === 2);
  });

  it('removeItem で要素を削除できる', () => {
    memoryStorage.setItem('test1', 'abc');
    memoryStorage.setItem('test2', 'def');
    memoryStorage.removeItem('test1');
    assert(memoryStorage.length === 1);
    assert(memoryStorage.getItem('test1') === null);
  });

  it('key で要素を index で取得できる', () => {
    memoryStorage.setItem('test1', 'abc');
    memoryStorage.setItem('test2', 'def');
    assert(memoryStorage.key(0) === 'abc');
    assert(memoryStorage.key(1) === 'def');
    memoryStorage.removeItem('test1');
    assert(memoryStorage.key(0) === 'def');
    assert(memoryStorage.key(1) === null);
  });
  
  it('clear で全要素が削除される', () => {
    memoryStorage.setItem('test1', 'abc');
    memoryStorage.setItem('test2', 'def');
    memoryStorage.clear();
    assert(memoryStorage.length === 0);
    assert(memoryStorage.getItem('test1') === null);
    assert(memoryStorage.getItem('test2') === null);
  });
});
