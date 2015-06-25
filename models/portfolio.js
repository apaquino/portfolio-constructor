var mongoose = require("mongoose");

var portfolioSchema = new mongoose.Schema({
                    name: {
                      type: String,
                      required: true
                    },
                    ownerId: String,
                    stocks: [ mongoose.Schema.Types.Mixed]
                  });

var Portfolio = mongoose.model("Portfolio", portfolioSchema);

module.exports = Portfolio;
