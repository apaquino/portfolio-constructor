var mongoose = require('mongoose');

var stockSchema = new mongoose.Schema({
                    symbol:  {
                      type: String,
                      required: true
                    },
                    name: String,
                    exchange: String,
                    prices: []
                  });

var Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;
