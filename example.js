var Model = require('./');
var le = require('le');
var co = require('co');
var rimraf = require('rimraf').sync;

rimraf('db');
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

  console.log(user);

})();