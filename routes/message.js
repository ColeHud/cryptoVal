var twilio = require('twilio');
var converter = require('satoshi-bitcoin');
var config = require('../config');
var Chain = require('chain-node');
var validator = require('bitcoin-address');
var controller = require('../controllers/users');

module.exports = function(request, response){
  var phone = request.body.From || 1;
  var input = request.body.Body || 'last';

  controller.updateUser(phone, input, function(user) {
    var parsedMessage = user.lastMessage;

    var chain = new Chain({
      keyId: config.chainApiKeyId,
      keySecret: config.chainApiKeySecret,
      blockChain: 'bitcoin'
    });

    var respond = function(message) {
      var twiml = new twilio.TwimlResponse();
      twiml.message(message);
      response.writeHead(200, {'Content-Type': 'text/xml'});
      response.end(twiml.toString());
    };

    //see if its a valid btc address
    if (validator.validate(parsedMessage) === true) {
      chain.getAddress(parsedMessage, function(err, blockchainResponse) {
        if (err){
          console.log('ERROR calling blockchain API with input: ' + parsedMessage);
          console.log('The API blockchainResponse was: ' + blockchainResponse);
          return;
        }
        respond('That bitcoin wallet contains ' + converter.toBitcoin(blockchainResponse[0].total.balance) + ' BTC');
      });
    }
    else {
      respond('\"' + parsedMessage + '\" is not a valid BTC address. Please try again');
    }
  });
};