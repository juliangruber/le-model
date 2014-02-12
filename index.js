
/**
 * Module dependencies.
 */

var uid = require('uid2');
var debug = require('debug')('le:model');

/**
 * Join reference.
 */

var _join = [].join;

/**
 * Expose `createModel`.
 */

module.exports = createModel;

/**
 * Create a new `Model`.
 *
 * @param {String} name
 * @param {LevelUp} db
 * @param {Object} fields
 * @return {Model}
 * @api public
 */

function createModel(name, db, _fields){
  var fields = Object.keys(_fields).map(function(key) {
    var field = _fields[key];
    field.key = key;
    return field;
  });
  
  fields.push({
    key: 'id',
    index: true,
    unique: true,
    default: function(){ return uid(32) }
  });

  /**
   * Create an instance.
   *
   * @param {Object} data
   * @return {Model}
   * @api public
   */

  function Model(data){
    if (!(this instanceof Model)) return new Model(data);
    this._data = data;
    this._new = !data.id;
    debug('%s create: %j', name, data);
  }

  // Getters

  fields.forEach(function(field) {
    debug('getter %s#%s', name, field.key);
    Object.defineProperty(Model.prototype, field.key, {
      get: function() {
        return this._data[field.key];
      }
    });
  });

  // Instance methods

  /**
   * Validate.
   *
   * @api public
   */

  Model.prototype.validate = function*(){
    var self = this;
    debug('%s validating', name);

    fields.forEach(function(field) {
      if (!field.required) return;
      if (!self[field.key]) throw new Error('.' + field.key + ' required');
    });

    if (self._new) {
      var res = yield fields
      .filter(function(field) {
        return field.unique;
      })
      .map(function(field) {
        return {
          key: field.key,
          value: db.get(join(name, field.key, self[field.key]))
        };
      });
      res.forEach(function(r) {
        if (r.value) throw new Error('.' + r.key + ' not unique');
      });
    }
    debug('%s valid', name);
  };

  /**
   * Save.
   *
   * @api public
   */

  Model.prototype.save = function*(){
    var self = this;
    debug('%s saving', name);

    // defaults

    fields.forEach(function(field) {
      if (field.default && !self[field.key]) {
        self._data[field.key] = field.default.call(self);
      };
    });

    // validate

    yield self.validate();

    // index

    var batch = db.batch();
    fields.forEach(function(field) {
      if (field.index) {
        var key = field.unique
          ? join(name, field.key, self[field.key])
          : join(name, field.key, self[field.key], uid(32));
        var value = field.key == 'id'
          ? self._data
          : self.id;
        batch.set(key, value);
      }
    });

    // save

    yield batch.end();
    this._new = false;
    debug('%s saved', name);
  };

  /**
   * Delete.
   *
   * @api public
   */

  Model.prototype.delete = function*(){
    var self = this;
    debug('%s deleting', name);

    var batch = db.batch();

    fields.forEach(function(field) {
      if (field.index && field.unique) {
        batch.del(join(name, field.key, self[field.key]));
      }
    });

    yield batch.end();
    debug('%s deleted', name);
  };

  /**
   * Inspect implementation.
   *
   * @api public
   */

  Model.prototype.inspect = function(){
    return this.toJSON();
  };
  
  /**
   * Convert a record to JSON.
   *
   * @return {Object}
   * @api public
   */
  
  Model.prototype.toJSON = function(){
    var data = this._data;
    var ret = {};
    fields.forEach(function(field){
      ret[field.key] = data[field.key];
    });
    return ret;
  };

  // Static methods

  fields.forEach(function(field){
    if (!field.index) return;
    var fn = 'by' + capitalize(field.key);
    debug('create %s.%s', name, fn);

    if (field.unique) {

      /**
       * Get one by `key`.
       *
       * @param {Object} value
       * @return {Model?}
       * @api public
       */

      Model[fn] = function*(value){
        var data;

        if (field.key == 'id') {
          data = yield db.get(join(name, 'id', value));
        } else {
          var id = yield db.get(join(name, field.key, value));
          if (!id) return;
          data = yield db.get(join(name, 'id', id));
        }

        return data && Model(data);
      };

    } else {

      /**
       * Get multiple by `key`.
       *
       * @param {Object} value
       * @return {Array[Model]}
       * @api public
       */

      Model[fn] = function*(value){
        var values = yield db.values(join(name, field.key, '*'));
        return values.map(Model);
      };

    }
  });

  return Model;
}

/**
 * Join keys.
 *
 * @param {String..} keys
 * @return {String}
 * @api private
 */

 function join(){
   return _join.call(arguments, '!');
 }

 /**
  * Capitalize a string.
  *
  * @param {String} str
  * @return {String}
  * @api private
  */

function capitalize(str){
  return str[0].toUpperCase() + str.slice(1);  
};
