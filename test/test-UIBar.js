const {Cu} = require('chrome');
Cu.import('resource://gre/modules/Services.jsm'); /* globals Services: false */
const tabs = require("sdk/tabs");
const testRunner = require('sdk/test');
const {before, after} = require('sdk/test/utils');

const {UIBar} = require('../lib/UIBar.js');


let targetWindow;
let notificationBox;

exports['test it shows a notification bar'] = assert => {
  assert.equal(notificationBox.childElementCount, 0);
  new UIBar(targetWindow, {
    actionName: 'shield-study',
    message: 'Want to help make Firefox Faster?',
    items: []
  });
  assert.equal(notificationBox.childElementCount, 1);
};

exports['test it sets the correct value on the notice'] = assert => {
  let customUIBar = new UIBar(targetWindow, {
    actionName: 'shield-study',
    message: 'Want to help make Firefox Faster?',
    items: []
  });

  assert.equal(customUIBar.notice.value, 'shield-study');
};

exports['test it shows a label with the correct message'] = assert => {
  let customUIBar = new UIBar(targetWindow, {
    actionName: 'shield-study',
    message: 'Want to help make Firefox Faster?',
    items: []
  });

  let messageEl = targetWindow.document.getAnonymousElementByAttribute(
    customUIBar.notice,
    'anonid',
    'messageText'
  );

  let message = messageEl.childNodes[0].value;
  assert.equal(message, 'Want to help make Firefox Faster?');
};

function closeAllNotifications() {
  if (notificationBox.allNotifications.length === 0) {
    return Promise.resolve();
  }

  let promises = [];

  for (let notification of notificationBox.allNotifications) {
    promises.push(waitForNotificationClose(notification));
    notification.close();
  }

  return Promise.all(promises);
}

function waitForNotificationClose(notification) {
  return new Promise(resolve => {
    let parent = notification.parentNode;

    let observer = new targetWindow.MutationObserver(mutations => {
      for (let mutation of mutations) {
        for (let i = 0; i < mutation.removedNodes.length; i++) {
          if (mutation.removedNodes.item(i) === notification) {
            observer.disconnect();
            resolve();
          }
        }
      }
    });
    observer.observe(parent, {childList: true});
  });
}

/**
 * Check if an array is in non-descending order
 */
function isOrdered(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] > arr[i + 1]) {
      return false;
    }
  }
  return true;
}

/** Close all but one tab, since jpm requires this at the end of a test */
function onlyOneTab () {
  let first = true;
  for (let tab of tabs) {
    if (first) {
      first = false;
      continue;
    }
    tab.close();
  }
}

before(exports, (testName, assert, done) => {
  targetWindow = Services.wm.getMostRecentWindow('navigator:browser');
  notificationBox = targetWindow.document.querySelector('#high-priority-global-notificationbox');

  closeAllNotifications().then(done);
});

testRunner.run(exports);
