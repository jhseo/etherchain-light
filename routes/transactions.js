var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');
var abi = require('ethereumjs-abi');
var abiDecoder = require('abi-decoder');

router.get('/:offset?', function(req, res, next) {
  
  var config = req.app.get('config');  
  var stepSize = 50;
  var web3 = new Web3();
  web3.setProvider(config.provider);
  
  if (!req.params.offset) {
    req.params.offset = 0;
  } else {
    req.params.offset = parseInt(req.params.offset);
  }
  
  async.waterfall([
    function(callback) {
      web3.eth.getBlock("latest", false, function(err, result) {
        callback(err, result.number);
      });
    }, function(lastBlock, callback) {
      var blocks = [];
      async.times(stepSize, function(n, next) {
        web3.eth.getBlock(lastBlock - n - req.params.offset, true, function(err, block) {
          blocks.push(block);
          next(err, block);
        });
      }, function(err, blocks) {
        callback(err, lastBlock, blocks);
      });
    }
  ], function(err, lastBlock, blocks) {
    if (err) {
      return next(err);
    }

    var transactions = [];

    blocks.forEach(function(block) {
      var data = {};
      data.isContract = false//tx.data !== '0x';
      data.transactionHash = '';
      data.blockNumber = block.number;
      data.from = '';
      data.to = '';
      data.timestamp = block.timestamp;
      transactions.push(data);

      block.transactions.forEach(function(tx) {
        
        //data.isContract = tx.data !== '0x';
        data.transactionHash = tx.hash;
        data.blockNumber = tx.blockNumber;
        data.from = tx.from;
        if (tx.creates) {
          data.isContract = true
          data.to = tx.creates
        } else if (tx.to) {
          data.to = tx.to;
        }
      });
    });
    
    //lastBlock = transactions[transactions.length - 1].blockNumber - 1;
   
    res.render('transactions', { txs: transactions, offset: req.params.offset, stepSize: stepSize });
  });
});

module.exports = router;
