var mongoose = require("mongoose");
    mongoose.connect("mongodb://localhost/portfolio_app");
    mongoose.set( 'debug', true );

module.exports.Post = require( './portfolio' );
module.exports.Comment = require( './stock' );
module.exports.User = require( './user' );
