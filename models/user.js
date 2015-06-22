var bcrypt = require("bcrypt"),
    SALT_WORK_FACTOR = 10,
    mongoose = require( "mongoose" );

var userSchema = new mongoose.Schema({
    username: {
      type: String,
      lowercase: true,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    firstname: {
      type: String,
      required: true
    },
    lastname: {
      type: String,
      required: true
    }
  });

userSchema.pre( 'save', function(next) {
  var user = this;
  if (!user.isModified( 'password' )) {
    return next();
  }
  return bcrypt.genSalt( SALT_WORK_FACTOR, function( err, salt ) {
    if ( err ) {
      return next( err );
    }

    return bcrypt.hash( user.password, salt, function( err, hash ) {
      if ( err ) {
        return next( err );
      }
      user.password = hash;
      return next();
    });
  });
});

userSchema.statics.authenticate = function ( formData, callback ) {
  this.findOne({
      username: formData.username
    },
    function (err, user) {
      if (user === null){
        callback( 'Invalid username or password', null );
      }
      else {
        user.checkPassword( formData.password, callback );
      }
    });
};

userSchema.methods.checkPassword = function( password, callback ) {
  var user = this;
  bcrypt.compare( password, this.password, function ( err, isMatch ) {
    if ( isMatch ) {
      callback( null, user );
    } else {
      callback( err, null );
    }
  });
};

var User = mongoose.model( 'User', userSchema );

module.exports = User;
