var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var Webimage = require('webimage');
var oknok = require('oknok');
var pick = require('lodash.pick');

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
  var webimage;
  var app = express(cors());
  app.use(bodyParser.json());

  app.get('/health', respondOK);
  app.post('/snap', snap);
  app.head(/.*/, respondHead);

  // Async init.
  Webimage({ browserType: 'webkit' }, oknok({ ok: useWebimage, nok: done }));

  function useWebimage(inst) {
    webimage = inst;
    done(null, { app, shutDown });
  }

  function respondOK(req, res, next) {
    res.status(200).json({ message: 'OK!' });
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

    var webimageOpts = pick(req.body, allowedWebimageOpts);
    // TODO: Consider validating the whole tree?
    webimage.getImage(
      webimageOpts,
      oknok({ ok: writeImage, nok: handleWebimageError })
    );

    function writeImage(buffer) {
      res.status(200).send(buffer);
      next();
    }

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

  function shutDown(done) {
    webimage.shutDown(done);
  }
}

module.exports = Snapper;
