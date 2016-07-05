const {Cu} = require('chrome');
Cu.import('resource://gre/modules/Services.jsm'); /* globals Services: false */

const {AddonManager} = require('resource://gre/modules/AddonManager.jsm');
const tabs = require('sdk/tabs');
const {Panel} = require('sdk/panel');
var data = require('sdk/self').data;

const {Log} = require('./Log.js');

class Recommender {
  constructor() {
    this.panel = Panel({
      width: 420,
      height: 340,
      contentURL: './recommendation/recWindow.html',
      contentScriptFile: './recommendation/notify.js',
    });

    this.doc = Services.wm.getMostRecentWindow('navigator:browser').document;
    this.deleteOldButton();

    this.urlButton = this.doc.createElement('image');
    this.urlButton.id = 'recommend-button';
    this.urlButton.setAttribute('class', 'urlbar-icon');
    this.urlButton.setAttribute('src', data.url('recommendation/icon.svg'));
    this.urlButton.setAttribute('hidden', 'true');

    this.urlButton.addEventListener('click', this.showPanel.bind(this));
    this.doc.getElementById('urlbar-icons').appendChild(this.urlButton);

    this.installedAddonIds = new Set();
    this.recData = [];

    this.createInstallListener();
    this.createWindowListener();
    this.populateInstallSet();
  }

  //temp solution until onLoad() exists in /index.js
  deleteOldButton() {
    var oldButton = this.doc.getElementById('recommend-button');
    if(oldButton !== null) {
      oldButton.remove();
    }
  }

  showPanel() {
    var windowRect = this.urlButton.getBoundingClientRect();
    var panelPosition = windowRect.left - this.panel.width/2;
    this.panel.show({
      position: {
        top: 0,
        left: panelPosition,
      },
    });
  }

  showButton() {
    this.urlButton.setAttribute('hidden', 'false');
  }

  hideButton() {
    this.urlButton.setAttribute('hidden', 'true');
  }

  //Prepares panel with info in background
  prepPanel(rec) {
    this.panel.port.emit('data', rec);
  }

  //adds all installed addon names to global set "installedAddons"
  populateInstallSet() {
    this.installedAddonsIds.clear();
    AddonManager.getAllAddons( addons => {
      for(var addon of addons) {
        this.installedAddonIds.add(addon.id);
      }
    });
  }

  //checks to see if any recommendations are already installed
  checkForInstalled(recs) {
    for(var rec of recs) {
      if(this.installedAddonIds.has(rec.id)) {
        rec.isInstalled = true;
      } else {
        rec.isInstalled = false;
      }
    }
  }

  show(rec) {
    this.checkForInstalled(rec);
    this.prepPanel(rec);
    this.showButton();
  }

  //Checks that current window is target domain
  waitForWindow(tab) {
    for(var rec of this.recData) {
      if(tab.url.includes(rec.domain)) {
        this.show(rec.data);
        return;
      }
    }
    this.hideButton(); //only reached if none of rec domains match
  }

  createInstallListener() {
    this.panel.port.on('install', (url) => {
      AddonManager.getInstallForURL(url, installObject => {
        installObject.install();
        installObject.addListener({
          onInstallEnded: () => {
            this.populateInstallSet();
            var successMessage = 'installed' + url;
            this.panel.port.emit(successMessage);
          }
        });
      }, 'application/x-xpinstall');
    });
  }

  createWindowListener() {
    tabs.on('activate', this.waitForWindow.bind(this));
    tabs.on('ready', this.waitForWindow.bind(this));
  }

  addRecommendation(domain, data) {
    const rec = {domain, data};
    this.recData.push(rec);
  }
}

var recommender = new Recommender();

exports.Recommend = {
  stage(domain, data) {
    recommender.addRecommendation(domain, data);
  },
};
