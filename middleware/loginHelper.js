var db = require("../models");

var loginHelpers = function (req, res, next) {

  req.login = function (user) {
    req.session.id = user._id;
    req.session.firstname= user.firstname;
  };

  req.logout = function () {
    req.session.id = null;
    req.session.firstname = null;
  };

  next();
};

module.exports = loginHelpers;
