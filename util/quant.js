var Quant  = {
  stockReturns : function ( arr ) {
    var result = [];
    for (var i = 0; i < arr.length-1; i++) {
       result[i] = Math.log(arr[i]/arr[i+1]);
    }
    return result;
  },

  variance : function( arr ) {
    // get mean variance of arr
    var total = arr.reduce( function( x, y ) { return x + y;});
    var mean = total/(arr.length - 1);

    //calculate variance with (stockRtn  - mean )^2, then reduce, rtn then avg
    var tempVar = arr.map(function(rtn){
      return Math.pow((rtn - mean), 2);
    });

    var totVar = tempVar.reduce( function( x, y) { return x + y; });
    //variance
    return totVar/(arr.length - 1);
  },

  STDDev : function( arr ) {
    return Math.sqrt( variance( arr ) );
  },

  average : function( ) {
    var result = 0;

    result = arr.reduce( function( x, y ) { return x + y; } );

    return result/arr.length - 1;
  },

  covariance : function( arr1, arr2 ) {
    if (arr2.length !== arr1.length) {
      return "Error: array length not the same";
    }
    // get ln returns of each stock price
    var rtnArr1 = stockReturns(arr1),
        rtnArr2 = stockReturns(arr2);

    //get average of the return for each arr
    var avgArr1 = average(rtnArr1),
        avgArr2 = average(rtnArr2);

    var covValue = 0;

    for (var i = 0; i < rtnArr1.length; i++) {
      covValue += (rtnArr1[i] - avgArr1) * (rtnArr2[i] - avgArr2);
    }
    return covValue/rtnArr1.length ;
  },

  beta : function( arr1, mktarr ) {
    var tempCov = covariance(arr1, mktarr);
    var mktRtn = stockReturns(mktarr);
    var mktRtnVar = variance(mktRtn);

    return tempCov / mktRtnVar;
  },

  estimatedRtn : function( s0, eR, factor ) {
    var endValue = 0;

    endValue = s0 * (Math.pow((1 + eR), factor));

    return ( endValue - s0 ) / s0;
  },

  randomNorm : function ( ) {
    return ((Math.random() + Math.random() + Math.random() + Math.random() +
    Math.random() + Math.random()) - 3)/3;
  },

  modifiedEstRtn : function ( s0, eR, stddev, factor ) {
    var endValue = s0;

    for (var i = 0; i < factor; i++) {
      endValue *=  (1 + (eR + (randomNorm() * stddev)));
    }

    return ( endValue - s0 ) / s0;
  },

  monteCarlo : function( num, cb ) {

  },

  stockGain : function( s0, s1 ) {
    return (s0 - s1) / s1;
  }
};

module.exports = Quant;
