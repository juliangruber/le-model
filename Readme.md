
# Le model

  Models for [le db](https://github.com/juliangruber/node-le).

## Usage

```js
var Model = require('le-model');
var le = require('le');
var co = require('co');

var db = le('db');

var User = Model('user', db, {
  name: {
    required: true,
    unique: true,
    index: true
  },
  createdAt: {
    require: true,
    default: function(){ return Date.now() }
  }
});

co(function*(){

  var user = new User({ name: 'julian' });
  yield user.save();

  // ...

  var user = yield User.byName('julian');
  console.log('user created at: %s', user.createdAt);

})();
```

## Installation

```bash
$ npm install le-model
```

## Stability

  Expect things to change a lot as this module grows with its usage. So far it's
  only being used in tiny websites.

## Roadmap

- [x] schemata
- [x] unique fields
- [x] indexed fields
- [x] field defaults
- [x] getters
- [ ] setters
- [ ] plugins
- [ ] fluent field api
- [ ] test suite

## API

### Model(name, db, fields)

  Create a new model named `name` in `db` with given `fields`.

### model(data)

  Create an instance of model from a `data` object.

### model#<field>

  Getter for every field.

### model#validate*()

  Validate current data, throws if invalid.

### model#save*()

  Save, if validations pass.

### model#delete*()

  Delete.

### model.by<Field>

  Load a model by each indexed `Field`.

## Schema

```js
{
  "field_name": {
    // options
  }
}
```

- `required`: Require a field to be set before a record can be saved.
- `unique`: Ensure a field's value is unique across all records.
- `index`: Index a field to make it accessible via `model.by<Field>`.
- `default`: A function whose return value will be used as default for a field. Called with the context of the model instance.

## License

  MIT
