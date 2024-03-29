include config.mk

HOMEDIR = $(shell pwd)
SSHCMD = ssh $(USER)@$(SERVER)
PRIVSSHCMD = ssh $(PRIVUSER)@$(SERVER)
PROJECTNAME = snapper
APPDIR = /opt/$(PROJECTNAME)

pushall: update-remote
	git push origin master

run:
	GITDIR=$(GITDIR) node start-$(PROJECTNAME).js

sync:
	rsync -a $(HOMEDIR) $(USER)@$(SERVER):/opt/ --exclude node_modules/ \
	  --omit-dir-times --no-perms
	$(SSHCMD) "cd /opt/$(PROJECTNAME) && npm install"

restart-remote:
	$(PRIVSSHCMD) "service $(PROJECTNAME) restart"

start-service:
	$(PRIVSSHCMD) "service $(PROJECTNAME) start"

stop-service:
	$(PRIVSSHCMD) "service $(PROJECTNAME) stop"

set-permissions:
	$(PRIVSSHCMD) "chmod +x $(APPDIR)/start-$(PROJECTNAME).js"

update-remote: sync set-permissions restart-remote

install-service:
	$(PRIVSSHCMD) "cp $(APPDIR)/$(PROJECTNAME).service /etc/systemd/system && \
	systemctl enable $(PROJECTNAME)"

set-up-app-dir:
	$(SSHCMD) "mkdir -p $(APPDIR)"

initial-setup: set-up-app-dir sync set-permissions install-service

check-status:
	$(SSHCMD) "systemctl status $(PROJECTNAME)"

check-log:
	$(SSHCMD) "journalctl -r -u $(PROJECTNAME)"

prettier:
	prettier --single-quote --write "**/*.js"

test:
	node tests/snapper-tests.js

try-deployed:
	# You need to set the SECRET env var for this to work.
	# e.g. Run `export SECRET='the secret'` before running this. Then, unset it afterward.
	curl -v https://smidgeo.com/snapper/snap \
    -X POST \
    -H 'Authorization: Bearer $(SECRET)' -H "Content-Type: application/json" \
    -d '{ "url": "https://apod.nasa.gov/apod/astropix.html", "waitLimit": 1000, "screenshotOpts": { "clip": { "x": 0, "y": 0, "width": 1280, "height": 800 }, "omitBackground": true } }' \
    -o tmp.png

try-colorer:
	# You need to set the SECRET env var for this to work.
	# e.g. Run `export SECRET='the secret'` before running this. Then, unset it afterward.
	curl -v https://smidgeo.com/snapper/snap \
    -X POST \
    -H 'Authorization: Bearer $(SECRET)' -H "Content-Type: application/json" \
    -d '{ "url": "http://jimkang.com/colorer-web/#displaySrcImage=no&hideUi=yes&srcImgUrl=https://ia600103.us.archive.org/5/items/11-17-17Margaret/11-17-17Margaret.jpg&runs=%5B%7B%22renderer%22%3A%22replacer%22%2C%22quant%22%3A24%2C%22grayscale%22%3A%22yes%22%2C%22recolorMode%22%3A%22random%22%2C%22showBase%22%3A%22no%22%2C%22opacityPercentOverBase%22%3A46%2C%22minimumValueDifference%22%3A0.2%2C%22numberOfRetriesToAvoidSingleColor%22%3A5%7D%5D", "waitLimit": 1000, "screenshotOpts": { "fullPage": true }, "viewportOpts": { "width": 640, "height": 480 } }' \
    -o colorer.png


install-playwright-deps:
	$(PRIVSSHCMD) "sudo npx playwright install-deps"

install-fonts:
	$(PRIVSSHCMD) "cd $(APPDIR) && cp fonts/*.otf /usr/local/share/fonts && \
	  fc-cache && fc-list"
