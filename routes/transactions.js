var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');
var abi = require('ethereumjs-abi');
var abiDecoder = require('abi-decoder');

router.get('/:offset?', function(req, res, next) {
  
  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);
  
  async.waterfall([
    function(callback) {
      web3.eth.getBlock("latest", false, function(err, result) {
        if (!req.params.offset) {
          callback(err, result.number);
        } else {
          callback(err, req.params.offset);
        }
      });
    }, function(lastBlock, callback) {
      var blocks = [];
      var blockCount = 20;
      async.times(blockCount, function(n, next) {
        web3.eth.getBlock(lastBlock - n, true, function(err, block) {
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
        
        data.isContract = tx.data !== '0x';
        data.transactionHash = tx.hash;
        data.blockNumber = tx.blockNumber;
        data.from = tx.from;
        data.to = tx.to;
        web3.eth.getCode(tx.to, function(err, code) {
          if (code !== "0x") { // contract
            data.isContract = true
          }
        });
      });
    });
    

    lastBlock = transactions[transactions.length - 1].blockNumber - 1;
   
    res.render('transactions', { txs: transactions, lastBlock: lastBlock });
  });
});

module.exports = router;
