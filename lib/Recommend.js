const {AddonManager} = require('resource://gre/modules/AddonManager.jsm');
const tabs = require('sdk/tabs');
const {Panel} = require('sdk/panel');
const {ToggleButton} = require('sdk/ui/button/toggle');


class Recommender {
  constructor() {
    this.panel = Panel({
      width: 420,
      height: 340,
      contentURL: './recData/recWindow.html',
      contentScriptFile: './recData/notify.js',
    });

    this.button = ToggleButton({
      id: 'toggleButton',
      label: 'Feature Recommendation',
      icon: {
        '16': './recData/icon-16.png',
        '32': './recData/icon-32.png',
        '64': './recData/icon-64.png',
      },
      onClick: state => this.handleChange(state),
      disabled: true, //disabled until set in showNotification
    });

    this.installedAddonIds = new Set();
    this.recData = [];

    this.createInstallListener();
    this.createWindowListener();
    this.populateInstallSet();
  }

  handleChange(state) {
    if (state.checked) {
      this.panel.show({
        position: this.button,
      });
    }
  }


  showNotification() {
    this.button.state('window', {
      disabled: false,
      badge: 1,
    });
  }


  hideNotification() {
    this.button.state('window', {
      checked: false,
      badge: null,
    });
  }


  //Prepares panel with info in background
  prepPanel(rec) {
    this.panel.port.emit('data', rec);
  }


  //adds all installed addon names to global set "installedAddons"
  populateInstallSet() {
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
    this.showNotification();
  }


  //Checks that current window is target domain
  waitForWindow(tab) {
    for(var rec of this.recData) {
      if(tab.url.includes(rec.domain)) {
        this.show(rec.data);
        return;
      }
    }
    this.hideNotification(); //only reached if none of rec domains match
  }


  createInstallListener() {
    this.panel.port.on('install', url => {
      AddonManager.getInstallForURL(url, installObject => {
        installObject.install();
        installObject.addListener({
          onInstallEnded: this.populateInstallSet.bind(this),
        });
      }, 'application/x-xpinstall');
    });
  }


  createWindowListener() {
    tabs.on('activate', this.waitForWindow.bind(this));
    tabs.on('ready', this.waitForWindow.bind(this));
  }

  addRecommendation(domain, data) {
    var rec = {
      domain: domain,
      data: data,
    };
    this.recData.push(rec);
  }
}


var recommender = new Recommender();

exports.Recommend = {
  stage(domain, data) {
    recommender.addRecommendation(domain, data);
  },
};
