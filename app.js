// third party modules
var express = require( 'express' ),
    app = express(),
    bodyParser = require( 'body-parser' ),
    methodOverride = require( 'method-override' ),
    morgan = require( 'morgan' ),
    request = require( 'request'),
    session = require("cookie-session"),
    flash = require('connect-flash'),
    db = require( './models' );

app.set( 'view engine', 'ejs' );
app.use(methodOverride( '_method' ));
app.use(express.static( __dirname + '/public') );
app.use(bodyParser.urlencoded( {extended:true} ));
app.use( morgan( 'tiny' ));
app.use(flash());

// helper file to number formatting
app.locals.CurrencyFormat = require('./helpers/currencyformat');

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
app.get( '/portfolios', routeMiddleware.ensureLoggedIn,
  function( req, res ) {
    db.Portfolio.find( {ownerId: req.session.id },
      function( err, portfolios ) {
        if ( err ) {
          console.log("Error in Index Portfolio Route", err);
          res.render('errors');
        } else {
          res.render( 'portfolios/index', {portfolios:portfolios, firstname: req.session.firstname});
        }
    });
});

// Portfolio NEW route, GET

app.get( '/portfolios/new', routeMiddleware.ensureLoggedIn,
  function( req, res ) {
    res.render( 'portfolios/new', {firstname: req.session.firstname});
});

// Portfolio NEW route, POST
app.post('/portfolios', routeMiddleware.ensureLoggedIn,
  function( req, res ) {
    var newPortfolio = req.body.portfolio;
        newPortfolio.ownerId = req.session.id;

    db.Portfolio.create( newPortfolio ,
      function( err, portfolio ) {
        if( err ) {
          console.log(err);
          res.render('portfolios/new');
        } else {
          res.redirect('/portfolios');
        }
    });
});

// Portfolio SHOW route, GET
app.get( '/portfolios/:id', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectUser,
  function( req, res ) {
  db.Portfolio.findById( req.params.id ,
    function ( err, portfolio ) {
      if ( err ) {
        console.log('Error when showing portfolio');
        res.render('errors');
      } else {
        var portTot = 0,
            portSymbols = "",
            portAvg = 0;

        portfolio.stocks.forEach( function ( stock ) {
          portTot += stock.amount;
          portSymbols += encodeURIComponent(stock.symbol) + "+";
        });

        portfolio.stocks.forEach( function (stock ){
          portAvg += (stock.amount / portTot) * stock.estimatedYrEndRtn;
        });
        // portSymbols = portSymbols.substring(0, portSymbols.length - 1);
        portSymbols = portSymbols.slice(0,-1);

          var urlPrevClose = 'https://finance.yahoo.com/d/quotes.csv?s=' + portSymbols + '&f=sp';

          request(urlPrevClose,
            function (error, response, body) {
              if (error) {
                console.log("Error!  Request failed - " + error);
                res.render('stocks/show', {stockDetails:stockDetails});
              } else if (!error && response.statusCode === 200) {
                // console.log(body);
                var currPrices = body.split("\n");
                currPrices.pop();
                //console.log(currPrices);
                res.render( 'portfolios/show', {portfolio:portfolio, portTot:portTot, portAvg:portAvg, currPrices:currPrices, firstname: req.session.firstname} );
              }
          });
      }
   });
});

// Portfolio EDIT route, GET
app.get('/portfolios/:id/edit', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectUser,
  function( req, res ) {
    db.Portfolio.findById( req.params.id,
      function ( err, portfolio ) {
        res.render( 'portfolios/edit', {portfolio:portfolio, firstname: req.session.firstname} );
    });
});

// Portfolio UPDATE route, PUT
app.put('/portfolios/:id', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectUser,
  function( req, res ) {
  var updatedPost = req.body.portfolio;
  db.Portfolio.findByIdAndUpdate( req.params.id, updatedPost,
    function (err, post) {
      if( err ) {
        res.render( 'portfolios/edit' );
      } else {
        res.redirect('/portfolios/' + req.params.id);
      }
  });
});

// Portfolio DELETE route, DELETE

app.delete('/portfolios/:id', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectUser,
  function( req, res ) {
  db.Portfolio.findById( req.params.id,
    function ( err, portfolio ) {
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
 app.get('/portfolios/:portfolio_id/stocks/new', routeMiddleware.ensureLoggedIn,
  routeMiddleware.ensureCorrectUserNested,
  function( req, res ) {
    db.Portfolio.findById(req.params.portfolio_id, function ( err, portfolio ) {
         res.render("stocks/new", {portfolio:portfolio, firstname: req.session.firstname});
    });
 });

// Stock NEW route, POST
app.post( '/portfolios/:portfolio_id', routeMiddleware.ensureLoggedIn,
  routeMiddleware.ensureCorrectUserNested,
    function( req, res ){
      var newStock =  {};
      newStock.symbol = String.prototype.trim.call(req.body.stock.symbol);
      newStock.name = String.prototype.trim.call(req.body.stock.name);
      newStock.exchange = String.prototype.trim.call(req.body.stock.exchange);

      var amount = Number(req.body.stock.amount),
          symbolTrim = String.prototype.trim.call(req.body.stock.symbol),
          symbolForUrl = encodeURIComponent(symbolTrim),
          initialStockPrice = 0,
          estimatedYrEndRtn = 0,
          estPrice = 0;

    db.Stock.findOne( {symbol: symbolTrim},
      function( err, stock ) {
        if (!stock) {
          console.log("You need to add this stock!!!");
          // get the historical returns
          var symbolForUrl = encodeURIComponent(symbolTrim);
          var url = 'http://real-chart.finance.yahoo.com/table.csv?s=' +
                    symbolForUrl + '&a=11&b=31&c=2011&d=11&e=31&f=2014&g=d&ignore=.csv';
          // use request to get the stock prices
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
              //calculate analytical data on stock
              initialStockPrice = stockPrices[0];
              estimatedYrEndRtn = quant.estimatedYrEndRtn(initialStockPrice, stockPrices);
              estPrice = initialStockPrice * (1 + estimatedYrEndRtn);
              newStock.estimatedYrEndRtn = estimatedYrEndRtn;
              newStock.estPrice = estPrice;
            }

            db.Stock.create( newStock, function( err, newStock ){
              if( err ) {
                res.render( 'stocks/new' );
              } else {
                var newStockSymbol = {};
                newStockSymbol.symbol = newStock.symbol;
                newStockSymbol.id = newStock.id;
                newStockSymbol.name = newStock.name;
                newStockSymbol.exchange = newStock.exchange;
                newStockSymbol.amount = amount;
                newStockSymbol.estimatedYrEndRtn = estimatedYrEndRtn;
                newStockSymbol.estPrice = estPrice;
                // add stock to stock array in the portfolio for faster retrieval
                db.Portfolio.findById(req.params.portfolio_id, function( err, portfolio ){
                  portfolio.stocks.push( newStockSymbol );
                  portfolio.save();
                  res.redirect( '/portfolios/' + req.params.portfolio_id);
                });
              }
            });
          });
        } else {
          newStock.id = stock.id;
          newStock.amount = amount;
          newStock.estimatedYrEndRtn = stock.estimatedYrEndRtn;
          newStock.estPrice = stock.estPrice;
          db.Portfolio.findById(req.params.portfolio_id,
            function( err, portfolio ) {
              var haveStock = false;

              portfolio.stocks.forEach( function( stock ) {
                 if (newStock.symbol === stock.symbol) {
                   haveStock = true;
                   req.flash("messages", { "info" : "You already have this stock in your portfolio" });
                 }
              });

              if (!haveStock) {
                portfolio.stocks.push( newStock );
                portfolio.save();
                req.flash("messages", { "info" : "" });
              }
              res.redirect( '/portfolios/' + req.params.portfolio_id );
            });
        }
    });
});

// Show Route, GET
app.get('/portfolios/:portfolio_id/stocks/:id', routeMiddleware.ensureLoggedIn,
  routeMiddleware.ensureCorrectUserNested,
    function( req, res ) {
    var stockDetails = {},
        symbolForUrl,
        yrStartPrice,
        currPrice;

    db.Stock.findById( req.params.id,
      function( err, stock ) {
        symbolForUrl = stock.symbol;

        stockDetails.estimatedYrEndRtn = stock.estimatedYrEndRtn;
        stockDetails.stddev = quant.STDDev(quant.stockReturns(stock.prices)) * Math.sqrt(250);
        stockDetails.yrStartPrice = stock.prices[0];

        db.Portfolio.findById( req.params.portfolio_id, function( err, portfolio ) {
          if (err) {
            res.render('errors');
          } else {
            var urlPrevClose = 'https://finance.yahoo.com/d/quotes.csv?s=' + symbolForUrl + '&f=sp';

            request(urlPrevClose, function (error, response, body) {
              if (error) {
                res.render('stocks/show', {stockDetails:stockDetails});
              } else if (!error && response.statusCode === 200) {
                currPrice = body.split(',')[1];
                stockDetails.currPrice = currPrice;
                res.render('stocks/show', {stock:stock, stockDetails:stockDetails, portfolio:portfolio, firstname: req.session.firstname});
              }
            });
          }
        });
    });
});

// Stock UPDATE route, GET --
// to edit a stock from the stocks array in the portfolio
app.get( '/portfolios/:portfolio_id/stocks/:id/edit', routeMiddleware.ensureLoggedIn,
  routeMiddleware.ensureCorrectUserNested,
  function ( req, res ) {
  db.Portfolio.findOne(
    { _id: req.params.portfolio_id},
    function ( err, portfolio ) {
      if (err) {
        console.log("Error in finding stock in portfolio " + err );
        res.render('errors');
      } else {
        var stocks = portfolio.stocks,
            stock;
        stocks.forEach( function ( portStock ) {
          if (portStock.id === req.params.id ) {
            stock = portStock;
          }
        });
        res.render( 'stocks/edit', {portfolio:portfolio, stock:stock, firstname: req.session.firstname});
      }
  });
});

// Stock UPDATE route, PUT --
// to edit a stock from the stocks array in the portfolio
app.put( '/portfolios/:portfolio_id/stocks/:id', routeMiddleware.ensureLoggedIn,
  routeMiddleware.ensureCorrectUserNested,
    function ( req, res ) {
      var newAmount = Number(req.body.stock.amount);
      db.Portfolio.update(
        { _id: req.params.portfolio_id, "stocks.id": req.params.id },
        { $set: { "stocks.$.amount": newAmount }},
        function( err, portfolio ) {
          if (err) {
            console.log("Something went wrong when updating stock amount " + err);
          } else {
            res.redirect('/portfolios/' + req.params.portfolio_id);
          }
        }
      );
});
// Stock DELETE route, DELETE --
// to remove stock from the stocks array in the portfolio
app.delete( '/portfolios/:portfolio_id/stocks/:id', routeMiddleware.ensureLoggedIn,
  routeMiddleware.ensureCorrectUserNested,
  function( req, res ) {
    db.Portfolio.update (
      { _id: req.params.portfolio_id },
      { $pull: { stocks: { id: req.params.id } } },
      { multi: true },
      function ( err, portfolio ) {
        if ( err ) {
          console.log("Error when trying to remove the stock from portfolio");
          res.redirect( '/portfolios/' + req.params.portfolio_id );
        } else {
          res.redirect( '/portfolios/' + req.params.portfolio_id );
        }
      }
    );
});

/**
 * Routes for user management
 */
 app.get( '/signup', routeMiddleware.preventLoginSignup,
  function( req, res ) {
   res.render('users/signup');
 });

 app.post('/signup',
  function ( req, res ) {
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

app.get( '/login', routeMiddleware.preventLoginSignup,
  function ( req, res ) {
    res.render( 'users/login' );
});

app.post( '/login',
  function ( req, res ) {
   db.User.authenticate( req.body.user, function ( err, user ) {
     if ( !err && user !== null ) {
       req.login( user );
       res.redirect( '/portfolios' );
     } else {
       res.render( 'users/login' );
     }
   });
});

app.get( '/logout',
  function ( req, res ) {
    req.logout();
    res.redirect( '/login' );
});

/**
 * Catch all error page
 */
 app.get( '*', function( req, res ) {
  res.render('errors');
});

app.listen( process.env.PORT || 3000 );
