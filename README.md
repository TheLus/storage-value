# storage-value

Simple storage interface library that use localStorage by default.
But, it allows developers to store to other storage using `storage` option.

## Installation
Install with [npm](https://www.npmjs.com/):
```
npm install storage-value
```

## Usage
### set value to storage
```js
import Value from 'storage-value';

const volume1 = new Value('volume');
console.log(volume1.value); // null
volume1.value = 100;

const volume2 = new Value('volume');
console.log(volume2.value); // 100

volume2.value = 200;
console.log(volume1.value); // 200
```

### use default
```js
import Value from 'storage-value';

const volume = new Value('volume', {default: 30});
console.log(volume.value); // 30

const volume2 = new Value('volume');
console.log(volume); // null
// default value doesn't save storage

volume2.value = 100;
const volume3 = new Value('volume', {default: 50});
console.log(volume3.value); // 100
// when there is storage value, ignore default value
```

### use another storage
```js
import Value from 'storage-value';

const volume = new Value('volume', {storage: sessionStorage});
volume.value = 100;

const volume2 = new Value('volume');
console.log(volume2.value); // null
// default storage is localStorage

const volume3 = new Value('volume', {storage: sessionStorage});
console.log(volume3.value); // 100
```

### use namespace
```js
import Value from 'storage-value';

const HogeValue = Value.namespace('hoge');
const FugaValue = Value.namespace('fuga');

const test1 = new HogeValue('test');
test1.value = 100;
const test2 = new FugaValue('test');
console.log(test2.value); // null
test2.value = 30;

const test3 = new HogeValue('test');
console.log(test3.value); // 100
```
## License

MIT