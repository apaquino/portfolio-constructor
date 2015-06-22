var mongoose = require('mongoose');

var stockSchema = new mongoose.Schema({
                    ticker: String,
                    name: String,
                    prices: []
                  });

var Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;
