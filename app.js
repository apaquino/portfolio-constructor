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
 * Routes for portfolios
 */

// Root INDEX redirect route, GET
app.get( '/', function( req, res ) {
  res.redirect( '/portfolios' );
});

// Portfolio INDEX route, GET
app.get( '/portfolios', function( req, res ) {
  db.Portfolio.find( {}, function( err, portfolios ) {
    if ( err ) {
      //TODO
      console.log("Error in Index Portfolio Route", err);
    } else {
      res.render( 'portfolios/index', {portfolios:portfolios});
    }
  });
});

// Portfolio NEW route, GET

app.get( '/portfolios/new', function( req, res ) {
  res.render( 'portfolios/new');
});

// Portfolio NEW route, POST
app.post('/portfolios', function( req, res ) {
  var newPortfolio = req.body.portfolio;
  db.Portfolio.create( newPortfolio , function( err, portfolio ) {
    if( err ) {
      console.log(err);
      res.render('portfolios/new');
    } else {
      res.redirect('/portfolios');
    }
  });
});

// Portfolio SHOW route, GET
app.get( '/portfolios/:id', function( req, res ) {
  db.Portfolio.findById( req.params.id ).populate( 'stocks' )
    .exec( function ( err, portfolio ) {
      if ( err ) {
        console.log('Error when showing portfolio');
      } else {
        res.render( 'portfolios/show', {portfolio:portfolio} );
      }
   });
});

// Portfolio EDIT route, GET
app.get('/portfolios/:id/edit', function( req, res ) {
  db.Portfolio.findById( req.params.id, function ( err, portfolio ) {
      res.render( 'portfolios/edit', {portfolio:portfolio} );
  });
});

// Portfolio UPDATE route, PUT
app.put('/portfolios/:id',  function( req, res ) {
  var updatedPost = req.body.portfolio;
  db.Portfolio.findByIdAndUpdate( req.params.id, updatedPost,
    function (err, post) {
       if( err ) {
         res.render( 'portfolios/edit' );
       } else {
         res.redirect('/portfolios');
       }
     });
});

// Portfolio DELETE route, DELETE

app.delete('/portfolios/:id', function( req, res ) {
  db.Portfolio.findById( req.params.id, function ( err, portfolio ) {
    if( err ) {
      console.log( err );
      res.render( 'portfolios/show' );
    }
    else {
      portfolio.remove();
      res.redirect( '/portfolios' );
    }
  });
});

/**
 * Routes for user management
 */

 app.get( '/signup', routeMiddleware.preventLoginSignup, function( req, res ) {
   res.render('users/signup');
 });

 app.post('/signup', function ( req, res ) {
   var newUser = req.body.user;
   db.User.create(newUser, function (err, user) {
     if (user) {
       req.login(user);
       res.redirect("/portfolios");
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
     res.redirect( '/portfolios' );
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
