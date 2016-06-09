import _ from 'lodash';
import uuid from 'uuid';
import Promise from 'bluebird';

const hasRealm = Symbol('hasRealm');
const _ownKeys = Symbol('_ownKeys');
const _getOwnPropertyDescriptors = Symbol('_getOwnPropertyDescriptors');
const _buildFilter = Symbol('_buildFilter');

class RealmModel {
	static realm = null;

	/**
	 * Check realm exists
	 */
	static [hasRealm]() {
		if(!_.isObject(this.realm))
			throw new Error(`${this.name} model need realm instance for interacting with your database.
Ex: 

let realm = new Realm(...);
class ${this.name} extends RealmModel {
  static realm = realm;
}
				`);

    if(!this.realm.constructor || this.realm.constructor.name != 'Realm')
      throw new Error('realm must be instance of Realm');
	}

  constructor(o = {}) {
    /**
     * Deep clone object with own keys
     */
    Object.defineProperties(
      this, this[_getOwnPropertyDescriptors](o)
    );
  }

  /**
   * clone own keys of object
   * @param object
   * @returns {Array.<*>}
   * @private
   */
  [_ownKeys](object) {
    return Object.getOwnPropertyNames(object).concat(
      Object.getOwnPropertySymbols(object)
    );
  }

  /**
   * Clone object descriptor
   * @param object
   * @returns {*}
   * @private
   */
  [_getOwnPropertyDescriptors](object) {
    return this[_ownKeys](object).reduce(function (d, key) {
      d[key] = Object.getOwnPropertyDescriptor(object, key);
      return d;
    }, {});
  }

  /**
   * Build query for filtered
   * @param filter
   * @returns {string}
   * @private
   */
  static [_buildFilter](filter) {
    let criteria = [];
    const op = ['$or', '$and'];
    _.each(filter, (v, k) => {
      if(_.contains(op, k)) {
      	// not yet implement logical operator $or, $and
      } else {
        if(_.isString(v)) {
          criteria.push(`${k} = "${v}"`);
        } else if(_.isBoolean(v) || _.isNumber(v)) {
          criteria.push(`${k} = ${v}`);
        } else if (_.isObject(v)){
          _.each(v, (opVal, op) => {
            if(_.isString(opVal)) {
              criteria.push(`${k} ${op} "${opVal}"`);
            } else if(_.isBoolean(opVal) || _.isNumber(opVal)) {
              criteria.push(`${k} ${op} ${opVal}`);
            }
          });
        }
      }
    });
    return criteria.join(' AND ');
  }

  /////////////////////////////////////
  //          PUBLIC APIs						//
  ///////////////////////////////////
	
	static find(filter = {}, option = {}) {
		this[hasRealm]();
    try {
      var className = this;
      let objects = className.realm.objects(this.name);
      // Filter objects if condition is not empty
      if(!_.isEmpty(filter)) {
        const filterStr = this[_buildFilter](filter);
        if(filterStr) {
          objects = objects.filtered(filterStr);
        }
      }

      // set find option
      if(!_.isEmpty(option)) {
        const { limit, offset = 0, sort } = option;
        if(sort) {
          const sortDescriptor = [];
          _.each(sort, (reverse, propName) => {
            sortDescriptor.push([propName, reverse]);
          });
          objects = objects.sorted(sortDescriptor);
        }

        if(_.isNumber(limit) && _.isNumber(offset)) {
          objects = objects.slice(offset, limit);
        }
      }

      // transform to child class
      if(objects.length) {
        return objects.map(o => new className(o));
      }
      return []; // if objects is empty
    } catch (e) {
      throw e;
    }
	}

	static findOne(filter = {}) {
		this[hasRealm]();
    try {
      var className = this;
      let objects = className.realm.objects(this.name);
      if(!_.isEmpty(filter)) {
        const filterStr = this[_buildFilter](filter);
        if(filterStr) {
          objects = objects.filtered(filterStr);
        }
      }

      if(objects.length) {
        return new className(objects[0]);
      }
      return null;
    } catch (e) {
      throw e;
    }
	}

	static insert(params) {
		this[hasRealm]();
    return new Promise((resolve, reject) => {
      try {
        var className = this;
        className.realm.write(() => {
          const o = className.realm.create(this.name, {
            ...params,
            id: uuid.v4()
          });
          resolve(o);
        });
      } catch (e) {
        reject(e);
      }
    });
	}

  static update(filter = {}, modifier = {}) {
    try {
      this[hasRealm]();

      if(_.isEmpty(modifier)) return false;
      var className = this;
      let objects = className.realm.objects(this.name);
      if(!_.isEmpty(filter)) {
        const filterStr = this[_buildFilter](filter);
        if(filterStr) {
          objects = objects.filtered(filterStr);
        }
      }

      if(objects.length) {
        className.realm.write(() => {
          _.each(objects, o => {
            if(_.isObject(o) && o.constructor.name == 'RealmObject') {
              _.each(modifier, (v, k) => {
                if(o[k]) o[k] = v;
              })
            }
          })
        })
      }
      return null;
    } catch (e) {
      throw e;
    }
  }

	static upsert() {
		this[hasRealm]();


	}

  static remove(filter = {}) {
    try {
      this[hasRealm]();

      var className = this;
      let objects = className.realm.objects(this.name);
      if(!_.isEmpty(filter)) {
        const filterStr = this[_buildFilter](filter);
        if(filterStr) {
          objects = objects.filtered(filterStr);
        }
      }

      if(objects.length) {
        className.realm.write(() => {
          className.realm.delete(objects);
        })
      }
      return null;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Remove object
   * @return Promise
   */
  remove() {
    return new Promise((resolve, reject) => {
      try {
        const className = this.constructor;
        className.realm.write(() => {
          className.realm.delete(this);
          resolve();
        });
      } catch (e) {
        reject(e);
      }
    })
  }

  /**
   * Update object
   * @param args
   * @return Promise
   */
  update(args = {}) {
    return new Promise((resolve, reject) => {
      try {
        const className = this.constructor;
        className.realm.write(() => {
          _.each(args, (v, k) => {
            if(this[k]) this[k] = v;
          });
          resolve();
        });
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

}

export default RealmModel;