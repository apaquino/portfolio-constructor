var db = require("../models");

var routeHelpers = {
  ensureLoggedIn: function( req, res, next ) {
    if (req.session.id !== null && req.session.id !== undefined) {
      return next();
    }
    else {
     res.redirect('/login');
    }
  },

  ensureCorrectUser: function( req, res, next ) {
    db.Portfolio.findById(req.params.id, function(err, portfolio){
      if (portfolio.ownerId !== req.session.id) {
        res.redirect('/portfolios/' + portfolio.id);
      }
      else {
       return next();
      }
    });
  },

  preventLoginSignup: function(req, res, next) {
    if (req.session.id !== null && req.session.id !== undefined) {
      res.redirect('/portfolios');
    }
    else {
     return next();
    }
  }
};

module.exports = routeHelpers;
