var functionList = [];

function LoadRestaurants(mapBounds, FinishLoading){

var auth = {
  consumerKey: "40uyAHYztYx2k_nEMUmZkA",
  consumerSecret: "doxlmJlnoKduxb2vDGMM2oxMG4A",
  accessToken: "_kXQfZ9RZLXF6Y2qLOEwOrSqYNg5jD5g",
  accessTokenSecret: "WtgDZS04wNnoWWT-XjbUAaCNLUk",
  serviceProvider: {
    signatureMethod: "HMAC-SHA1"
  }
};
var terms = 'food';
var accessor = {
  consumerSecret: auth.consumerSecret,
  tokenSecret: auth.accessTokenSecret
};
parameters = [];
parameters.push(['term', terms]);
parameters.push(['bounds', mapBounds]);
parameters.push(['callback', 'cb']);
parameters.push(['oauth_consumer_key', auth.consumerKey]);
parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
parameters.push(['oauth_token', auth.accessToken]);
parameters.push(['oauth_signature_method', 'HMAC-SHA1']);
var message = {
  'action': 'http://api.yelp.com/v2/search',
  'method': 'GET',
  'parameters': parameters
};
OAuth.setTimestampAndNonce(message);
OAuth.SignatureMethod.sign(message, accessor);
var parameterMap = OAuth.getParameterMap(message.parameters);
parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature)
$.ajax({
  'url': message.action,
  'data': parameterMap,
  'cache': true,
  'dataType': 'jsonp',
  'error': function(jqXHR, textStatus){
      functionList = [];
      FinishLoading();
  },
  'success': function(data, textStats, XMLHttpRequest) {
      functionList = data.businesses;
      FinishLoading();
  },
  timeout: 5000
});

}