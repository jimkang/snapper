/* global process, __dirname */
var test = require('tape');
var assertNoError = require('assert-no-error');
var Snapper = require('../snapper');
var request = require('request');
var fs = require('fs');
var rimraf = require('rimraf');
var http = require('http');
var { queue } = require('d3-queue');

const { secret } = require('../config');

const port = 9863;
const serverHost = process.env.SERVER || 'localhost';

const outputDir = __dirname + '/output';

rimraf.sync(outputDir + '*.png');
rimraf.sync(outputDir + '*.gif');

var testCases = [
  {
    name: 'Get a snapshot',
    body: {
      url: 'https://apod.nasa.gov/apod/astropix.html',
      waitLimit: 1000,
      screenshotOpts: {
        clip: {
          x: 0,
          y: 0,
          width: 1280,
          height: 800
        },
        omitBackground: true
      }
    },
    headers: {
      Authorization: `Bearer ${secret}`
    },
    fileExtension: 'png',
    expectedStatusCode: 200
  },
  {
    name: 'Bad secret auth',
    body: {
      url: 'https://apod.nasa.gov/apod/astropix.html',
      waitLimit: 1000,
      screenshotOpts: {
        clip: {
          x: 0,
          y: 0,
          width: 1280,
          height: 800
        },
        omitBackground: true
      }
    },
    headers: {
      Authorization: 'Bearer wrong'
    },
    fileExtension: 'png',
    expectedStatusCode: 401
  },
  {
    name: 'Bad url',
    body: {
      url: 'https://aaaaapod.nasa.gov/apod/astropix.html',
      waitLimit: 1000,
      screenshotOpts: {
        clip: {
          x: 0,
          y: 0,
          width: 1280,
          height: 800
        },
        omitBackground: true
      }
    },
    headers: {
      Authorization: `Bearer ${secret}`
    },
    fileExtension: 'png',
    expectedStatusCode: 500
  },
  {
    name: 'Get an animated gif',
    body: {
      url:
        'https://jimkang.com/dem-bones/#seed=2020-07-11T00%3A53%3A26.024Z&hideControls=yes&still=no',
      waitLimit: 1000,
      screenshotOpts: {
        clip: {
          x: 0,
          y: 0,
          width: 640,
          height: 640
        }
      },
      viewportOpts: {
        width: 640,
        height: 640,
        deviceScaleFactor: 1
      },
      burstCount: 48,
      timeBetweenBursts: 1000 / 12,
      makeBurstsIntoAnimatedGif: true
    },
    headers: {
      Authorization: `Bearer ${secret}`
    },
    fileExtension: 'gif',
    expectedStatusCode: 200
  }
];

testCases.forEach(runTest);

function runTest(testCase) {
  test(testCase.name, testSnap);

  function testSnap(t) {
    var server;

    Snapper({ secret }, startServer);

    function startServer(error, { app }) {
      assertNoError(t.ok, error, 'Server created.');
      if (error) {
        console.log('Error creating server:', error);
        process.exit();
      }
      server = http.createServer(app);
      server.listen(port, runRequest);
    }

    function runRequest(error) {
      assertNoError(t.ok, error, 'Server started correctly.');
      var reqOpts = {
        method: 'POST',
        url: `http://${serverHost}:${port}/snap`,
        headers: testCase.headers,
        json: true,
        body: testCase.body,
        encoding: null
      };
      request(reqOpts, checkResponse);
    }

    function checkResponse(error, res, buffer) {
      assertNoError(t.ok, error, 'No error while making request.');
      t.equal(
        res.statusCode,
        testCase.expectedStatusCode,
        'Correct status code is returned.'
      );
      if (res.statusCode === 200) {
        // TODO: Get file type from MIME type.
        const filename = `${outputDir}/${testCase.name}.${testCase.fileExtension}`;
        fs.writeFileSync(filename, buffer);
        console.log(
          'Look at',
          filename,
          'and make sure it is good and the contents are the SIZE they *should* be.'
        );
      } else if (buffer) {
        console.log('Response body as text:', buffer.toString());
      }
      var q = queue();
      q.defer(server.close.bind(server));
      q.await(complete);
    }
    function complete(error) {
      if (error) {
        console.log('Error while shutting down:', error);
      }
      t.end();
    }
  }
}
