var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');

router.get('/:offset?', function(req, res, next) {
  var config = req.app.get('config');
  var web3 = new Web3();
  web3.setProvider(config.provider);

  console.log("req.params.offset: " + req.params.offset)
  //req.params.offset = 0
  // if (!req.params.offset || req.params.offset == "undefined") {
  //   req.params.offset = 0;
  // } else {
  //   req.params.offset = parseInt(req.params.offset);
  // }

  var token = web3.eth.contract(config.erc20ABI).at(config.tokenAddress);

  async.waterfall([
    function(callback) {
      web3.parity.listAccounts(30, req.params.offset, function(err, result) {
        callback(err, result);
      });
    }, function(accounts, callback) {

      var data = {};

      if (!accounts) {
        return callback({name:"FatDBDisabled", message: "Parity FatDB system is not enabled. Please restart Parity with the --fat-db=on parameter."});
      }
      console.log("accounts.length: " + accounts.length)
      console.log("req.params.offset: " + req.params.offset)
      if (accounts.length === 0) {
        return callback({name:"NoContractsFound", message: "Chain contains no contracts."});
      }

      var lastAccount;

      async.eachSeries(accounts, function(account, eachCallback) {
        if (data.length == 20) {
          eachCallback();
        }
        web3.eth.getCode(account, function(err, code) {
          if (err) {
            return eachCallback(err);
          }
          console.log("code" + code)
          if (code !== "0x") { // contract
            data[account] = {};
            data[account].address = account;
            data[account].balance = 0;

            lastAccount = account;
            //data[account].type = code.length > 2 ? "Contract" : "Account";

            token.balanceOf(account, function(err, balance) {
              // var doc = { _id: address, balance: balance.toNumber() };
              // self.db.update({ _id: doc._id }, doc, { upsert: true }, function(err, numReplaced) {
                if (err) {
                  console.log("Error updating balance:", err);
                } else {
                  console.log("Balance export completed");
                }
                console.log("account: " + account)
                console.log("balance: " + balance)
                data[account].balance = balance;

                // if (callback)
                //   callback();
              // });
            });
          }
          eachCallback();
        });
      }, function(err) {
        callback(err, data, lastAccount);
      });
    }
  ], function(err, accounts, lastAccount) {
    if (err) {
      return next(err);
    }

    res.render("contracts", { accounts: accounts, lastAccount: lastAccount });
  });
});

module.exports = router;
