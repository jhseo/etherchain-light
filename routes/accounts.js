var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');

router.get('/:offset?', function(req, res, next) {
  var db = req.app.get('eventdb');

  console.log("req.params.offset: " + req.params.offset)
  if (!req.params.offset) {
    req.params.offset = 0;
  } else {
    req.params.offset = parseInt(req.params.offset);
  }

  db.find({ balance: { $exists: true }, type: "account" }).sort({ _id: 1 }).skip(req.params.offset).limit(50).exec(function(err, accounts) {
    res.render('accounts', {accounts: accounts, offset: req.params.offset, stepSize: 50 });
  });

});

module.exports = router;
