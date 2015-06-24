$(function() {
  var YAHOO = {
    Finance: {
      SymbolSuggest: {}
    }
  };

  $( '#txtSymbolSearch' ).autocomplete({
    source: function (request, response) {
        $.ajax({
          type: "GET",
          url: "http://d.yimg.com/autoc.finance.yahoo.com/autoc",
          data: {
            query: request.term
            },
          dataType: "jsonp",
          jsonp : "callback",
          jsonpCallback: "YAHOO.Finance.SymbolSuggest.ssCallback",
        });
        // call back function from yui yahooapis
        YAHOO.Finance.SymbolSuggest.ssCallback = function ( data ) {
          // Create array for customized output rather than default data from Yahoo
          var suggestions = [];
          //console.log(JSON.stringify(data.ResultSet.Result));
          $.each(data.ResultSet.Result, function( index, val ) {
              if (val.exchDisp === "NYSE" || val.exchDisp === "NASDAQ" || val.exchDisp === "NYSEArca" ) {
                suggestions.push("Name: "+ val.name +" #Symbol: "+val.symbol +" #Exchange: " + val.exchDisp);
                //suggestions.push(val.symbol);
              }
          });
          response(suggestions);
        };
  },
  minLength: 1,
    select: function (event, ui) {
       $('#symbol').val(ui.item.value.split("#")[1].split(':')[1]);
       $('#name').val(ui.item.value.split("#")[0].split(':')[1]);
       $('#exchange').val(ui.item.value.split("#")[2].split(':')[1]);
  },
  });
});
