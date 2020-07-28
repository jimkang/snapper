var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var Webimage = require('webimage');
var pick = require('lodash.pick');
var callNextTick = require('call-next-tick');
var ep = require('errorback-promise');

var allowedWebimageOpts = [
  'url',
  'waitLimit',
  'screenshotOpts',
  'viewportOpts',
  'supersampleOpts',
  'autocrop',
  'burstCount',
  'timeBetweenBursts',
  'makeBurstsIntoAnimatedGif'
];

function Snapper({ secret }, done) {
  var app = express(cors());
  app.use(bodyParser.json());

  app.get('/health', respondOK);
  app.post('/snap', snap);
  app.head(/.*/, respondHead);

  // Add async init here if necessary.
  callNextTick(done, null, { app });

  function respondOK(req, res, next) {
    res.status(200).json({ message: 'OK!' });
    next();
  }

  async function snap(req, res, next) {
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

    var webimageOpts = pick(req.body, allowedWebimageOpts);
    // TODO: Consider validating the whole tree?

    var ctorRes = await ep(Webimage, {});
    if (ctorRes.error) {
      handleWebimageError(ctorRes.error);
      return;
    }

    var webimage = ctorRes.values[0];
    var webimageRes = await ep(webimage.getImage, webimageOpts);

    if (!webimageRes.error) {
      let buffer = webimageRes.values[0];
      res.status(200).send(buffer);
    }

    var shutDownRes = await ep(webimage.shutDown);

    if (webimageRes.error) {
      handleWebimageError(webimageRes.error);
      return;
    }
    if (shutDownRes.error) {
      handleWebimageError(shutDownRes.error);
      return;
    }

    next();

    function handleWebimageError(error) {
      const errorMessage = `Error from webimage: ${error.message}`;
      res.status(500).send(errorMessage);
      next();
    }
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
