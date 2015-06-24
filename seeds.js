// Users
// Portfolios
// Stocks

db.users.remove({});
db.portfolios.remove({});
[
  ["users",  "558b0c504f27c402f578b87f", "_id", "558b0c504f27c402f578b87f"],
  ["users",  "558b0c504f27c402f578b87f", "username", "apaquino@gmail.com"],
  ["users",  "558b0c504f27c402f578b87f", "firstname", "armand"],
  ["users",  "558b0c504f27c402f578b87f", "lastname", "aquino"],
  ["users",  "558b0c504f27c402f578b87f", "password", "xyz"],
  //
  ["portfolios",  "558b10fd9a0c0b515b13808f", "name", "Tech Heavy"],
  ["portfolios",  "558b10fd9a0c0b515b13808f", "ownerId", 1234],
  ["portfolios",  "558b10fd9a0c0b515b13808f", ["stocks", "AAPL"], 10000 ],
  ["portfolios",  "558b10fd9a0c0b515b13808f", ["stocks", "GOOG"], 20000 ],

  ["stocks",  "558b131a9a0c0b515b138090", "symbol", "AAPL" ],
  ["stocks",  "558b131a9a0c0b515b138090", "name", "Apple Inc." ],
  ["stocks",  "558b131a9a0c0b515b138090", "exchange", "NASDAQ" ],
  ["stocks",  "558b131a9a0c0b515b138090", "prices", [100,200,100,200] ],

  


].forEach( function( fact ) {
  var collection = fact[0];
  var id = fact[1];
  var attrName = [].concat(fact[2]).join(".");
  var value = fact[3];
  var attrValue = {};
  attrValue[attrName] = value;
  // console.log(collection, id, attrName, value, attrValue);
 db[collection].update( {_id: id } , {$set: attrValue }, {upsert: true});
});
