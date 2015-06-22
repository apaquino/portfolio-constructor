var mongoose = require("mongoose");
    mongoose.connect("mongodb://localhost/portfolio_app");
    mongoose.set( 'debug', true );

module.exports.Portfolio = require( './portfolio' );
module.exports.Stock = require( './stock' );
module.exports.User = require( './user' );
