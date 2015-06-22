var express = require( 'express' ),
    app = express(),
    bodyParser = require( 'body-parser' ),
    methodOverride = require( 'method-override' ),
    morgan = require( 'morgan' ),
    db = require( './models' );

app.set( 'view engine', 'ejs' );
app.use(methodOverride( '_method' ));
app.use(express.static( __dirname + '/public') );
app.use(bodyParser.urlencoded( {extended:true} ));
app.use( morgan( 'tiny' ));

/**
 * For Auth
 * Use cookie session and use and setup/config session
 */

var session = require("cookie-session"),
    loginMiddleware = require("./middleware/loginHelper"); //middleware is for request
    routeMiddleware = require("./middleware/routeHelper"); // mw intercept request to modify

app.use(session({
  maxAge: 3600000,
  secret: 'topsecretlevel6',
  name: 'portfoliounderconstruction'
}));

app.use(loginMiddleware);


/**
 * Routes for user management
 */

 app.get( '/signup', routeMiddleware.preventLoginSignup, function( req, res ){
   res.render('users/signup');
 });

 app.post('/signup', function ( req, res ) {
   var newUser = req.body.user;
   db.User.create(newUser, function (err, user) {
     if (user) {
       req.login(user);
       res.redirect("/posts");
     } else {
       console.log(err);
       res.render("users/signup");
     }
   });
 });


app.get( '/login', routeMiddleware.preventLoginSignup, function ( req, res ) {
 res.render( 'users/login' );
});

app.post( '/login', function ( req, res ) {
 db.User.authenticate( req.body.user, function ( err, user ) {
   if ( !err && user !== null ) {
     req.login( user );
     res.redirect( '/posts' );
   } else {
     // TODO - handle errors in ejs!
     res.render( 'users/login' );
   }
 });
});

app.get( '/logout', function ( req, res ) {
  req.logout();
  res.redirect( '/' );
});

app.listen( 3000, function() {
  console.log('Starting portfolio-constructor app on port 3000');
});
