snapper
==================

REST service that gets a screenshot of a web page on behalf of the client.

Installation
------------

Clone this repo.

After that, there's a `config.js` file you have to create in the project root. It should contain this:

    module.exports = {
      secret: '<Secret for posting to this>'
    };

The secret is something the service checks against when receiving posts.

You can use the `initial-setup` make target to set up an instance of this on your server as a systemd service.

To be safe, you may want to first run `install-playwright-deps` which makes sure all of the binary dependencies of the headless browsers from [playwright](https://github.com/microsoft/playwright) are all there. (Anecdote: On at least one system, it just happened to work without these. On another it did not.)

You should probably proxy this from nginx running https. Otherwise, your secret can be intercepted by a man-in-the-middle attack.

This works on Ubuntu 18 and will not work on earlier versions. It will probably work on OS X, but you may have to mess around with install headless browser dependencies. Check out the [playwright](https://github.com/microsoft/playwright) docs to find out more about that or Windows.

License
-------

The MIT License (MIT)

Copyright (c) 2020 Jim Kang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
