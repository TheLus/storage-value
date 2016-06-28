# local-storage-value
## Usage
### set value to LocalStorage
```
import Value from 'local-storage-value';

const volume = new Value('volume');
console.log(volume.value); // undefined
volume.value = 100;

const volume2 = new Value('volume');
console.log(volume.value); // 100
```

### use default
```
import Value from 'local-storage-value';

const volume = new Value('volume', {default: 30});
console.log(volume.value); // 30

const volume2 = new Value('volume');
console.log(volume); // undefined
// default value doesn't save LocalStorage

volume2.value = 100;
const volume3 = new Value('volume', {default: 50});
console.log(volume3.value); // 100
// when there is LocalStorage value, ignore default value
```

### use another storage
```
import Value from 'local-storage-value';

const volume = new Value('volume', {storage: sessionStorage});
volume.value = 100;

const volume2 = new Value('volume');
console.log(volume2.value); // undefined
// default storage is LocalStorage

const volume3 = new Value('volume', {storage: sessionStorage});
console.log(volume3.value); // 100
```
