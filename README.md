## React native Realm Model
RealmModel is a wrapper for realm.

## How it works

```js
import Realm from 'realm';
import RealmModel from 'react-native-realm-model';
const realm = new Realm({
  schema: [{
    name: 'Product',
    properties: {
      title: 'string',
      content: {
      	type: 'string',
      	optional: true
      },
      price: 'number'
    }
  }]
})

class Product extends RealmModel {
  static realm = realm;
  // custom methods
  priceLabel() {
  	return this.price + 'vnđ';
  }
}


Product.insert({title: 'Product 1', content: 'This is content', price: 22000});
var product = Product.findOne();

console.log(product.priceLabel());

product.update({price: 24000})

console.log(product.priceLabel());

product.remove();

```


## API

### find(selector: Object, option: Object) -> Array
+ **selector** is search criteria

 	- Type 1: `{field: value}` 
 	- Type 2: logical operator `{$or: [{field1: value1, field2: value2}]}`
 	- Type 3: realm operator `==`, `>=`, `<=`, `>`, `<`, `BEGINSWITH`, `ENDSWITH`, `CONTAINS` and string comparisons can be made case insensitive by appending `[c]` to the operator: `==[c]`, `BEGINSWITH[c]` etc.
 	
 	 Ex: `Product.find({title: {'BEGINSWITH[c]': 'hello'}})`
+ **option** is search option support: `limit`, `offset`, `sort`


### findOne(selector: Object)
### insert(data: Object)
### update(selector: Object, modifier: Object)
### remove(selector: Object)






