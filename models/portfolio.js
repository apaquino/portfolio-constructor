var mongoose = require("mongoose");

var portfolioSchema = new mongoose.Schema({
                    name: String,
                    budget: Number,
                    ownerId: String,
                    stocks: [{
                      type: mongoose.Schema.Types.ObjectId,
                      ref: "Stock"
                    }]
                  });

var Portfolio = mongoose.model("Portfolio", portfolioSchema);

module.exports = Portfolio;
