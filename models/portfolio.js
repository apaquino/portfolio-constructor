var mongoose = require("mongoose");

var portfolioSchema = new mongoose.Schema({
                    name: {
                      type: String,
                      required: true
                    },
                    budget: {
                      type: Number,
                      required: true
                    },
                    ownerId: String,
                    stocks: [{
                      type: mongoose.Schema.Types.ObjectId,
                      ref: "Stock"
                    }]
                  });

var Portfolio = mongoose.model("Portfolio", portfolioSchema);

module.exports = Portfolio;
