var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var callNextTick = require('call-next-tick');

function Snapper({ secret }, done) {
  var app = express(cors());
  app.use(bodyParser.json());

  app.get('/health', respondOK);
  app.post('/snap', snap);
  app.head(/.*/, respondHead);

  // Async init goes here, if it is ever needed.

  callNextTick(done, null, app);

  function respondOK(req, res, next) {
    res.json(200, { message: 'OK!' });
    next();
  }

  function snap(req, res, next) {
    if (!req.body.url) {
      res.status(400).json({ message: 'Missing `url` key in body.' });
      return;
    }

    if (req.headers.authorization !== `Bearer ${secret}`) {
      res.status(401);
      res.send();
      next();
      return;
    }

    res.status(500).send('Not impl.');
    next();
  }

  function respondHead(req, res, next) {
    if (req.method !== 'OPTIONS') {
      res.writeHead(200, {
        'content-type': 'application/json'
      });
    } else {
      res.writeHead(200, 'OK');
    }
    res.end();
    next();
  }
}

module.exports = Snapper;
