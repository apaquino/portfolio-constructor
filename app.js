// third party modules
var express = require( 'express' ),
    app = express(),
    bodyParser = require( 'body-parser' ),
    methodOverride = require( 'method-override' ),
    morgan = require( 'morgan' ),
    request = require( 'request'),
    session = require("cookie-session"),
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

var quant = require( './util/quant' ),
    loginMiddleware = require("./middleware/loginHelper"), //middleware is for request
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
  db.Portfolio.findById( req.params.id , function ( err, portfolio ) {
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
 * Routes for stocks
 */

 // Stock NEW route, GET
 app.get('/portfolios/:portfolio_id/stocks/new', function( req, res ) {
  db.Portfolio.findById(req.params.portfolio_id, function ( err, portfolio ) {
       res.render("stocks/new", {portfolio:portfolio});
  });
 });

// Stock NEW route, POST
app.post('/portfolios/:portfolio_id', function( req, res ){

  var newStock =  {};
  newStock.symbol = String.prototype.trim.call(req.body.stock.symbol);
  newStock.name = String.prototype.trim.call(req.body.stock.name);
  newStock.exchange = String.prototype.trim.call(req.body.stock.exchange);

  var amount = Number(req.body.stock.amount);
  var symbolTrim = String.prototype.trim.call(req.body.stock.symbol);
  var symbolForUrl = encodeURIComponent(symbolTrim);

  db.Stock.findOne( {symbol: symbolTrim}, function( err, stock ) {
    if (!stock) {
      console.log("You need to add this stock!!!");
      /* ---------------------------------------------- */
      // get the historical returns
      var symbolForUrl = encodeURIComponent(symbolTrim);
      var url = 'http://real-chart.finance.yahoo.com/table.csv?s=' + symbolForUrl + '&a=11&b=31&c=2011&d=11&e=31&f=2014&g=d&ignore=.csv';

      // use request
      request(url, function (error, response, body) {
        if (error) {
          console.log("Error!  Request failed - " + error);
        } else if (!error && response.statusCode === 200) {
          var temp  = body.split('\n'),
              stockPrices = [];

          temp.forEach( function ( stockPrice, index ){
            var price = stockPrice.substring((stockPrice.lastIndexOf(',')+1));
            if (!isNaN(price) && price) {
              stockPrices.push(price);
            }
            // add to newStock object
            newStock.prices = stockPrices;
          });
        }
        // -------------------

        db.Stock.create( newStock, function( err, newStock ){
          if( err ) {
            console.log(err);
            res.render( 'stocks/new' );
          } else {
            var newStockSymbol = {};
            newStockSymbol.symbol = newStock.symbol;
            newStockSymbol.stockId = newStock.id;
            newStockSymbol.amount = amount;
            db.Portfolio.findById(req.params.portfolio_id, function( err, portfolio ){
              portfolio.stocks.push( newStockSymbol );
              portfolio.save();
              res.redirect( '/portfolios/' + req.params.portfolio_id);
            });
          }
        });


        // ------------------
      });
      /* ---------------------------------------------- */

    } else {
      console.log("You already have this stock");
      console.log(stock);
      res.redirect( '/portfolios/' + req.params.portfolio_id );
    }
  });
});

// Show Route, GET

app.get('/portfolios/:portfolio_id/stocks/:id', function( req, res ) {
  var stockDetails = {};

  db.Stock.findById( req.params.id, function( err, stock ) {

    stockDetails.symbol = stock.symbol;
    stockDetails.name = stock.name;
    stockDetails.exchange = stock.exchange;
    var initialStockPrice = stock.prices[0];

    var stockRtns = quant.stockReturns(stock.prices);
    var avgRtn = quant.average(stockRtns);
    var varRtn = quant.variance(stockRtns);
    var stddevRtn = quant.STDDev(stockRtns);
    var estimatedRtn = quant.estimatedRtn(initialStockPrice, avgRtn, 250);
    var modifiedEstRtn = quant.modifiedEstRtn(initialStockPrice, avgRtn, stddevRtn, 250);
    var monteCarloRtn = quant.monteCarlo(10000, initialStockPrice, avgRtn, stddevRtn, 250, quant.modifiedEstRtn);
    var estPrice = initialStockPrice * (1 + monteCarloRtn);

    stockDetails.avgRtn = avgRtn;
    stockDetails.varRtn = varRtn;
    stockDetails.stddevRtn = stddevRtn;
    stockDetails.estimatedRtn = estimatedRtn;
    stockDetails.modifiedEstRtn = modifiedEstRtn;
    stockDetails.monteCarloRtn = monteCarloRtn;
    stockDetails.estPrice = estPrice;
      res.render('stocks/show', {stockDetails:stockDetails});
    });
});
/**
 * Routes for user management
 */

 app.get( '/signup',  function( req, res ) {
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
  console.log('Starting portfolio-constructicon app on port 3000');
});
