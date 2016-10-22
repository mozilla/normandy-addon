const {Cu} = require('chrome');
const testRunner = require('sdk/test');
const {before, after} = require('sdk/test/utils');
Cu.import('resource://gre/modules/Task.jsm'); /* globals Task */
Cu.import('resource://gre/modules/Preferences.jsm'); /* globals Preferences */

const {promiseTest} = require('./utils.js');
const {NormandyDriver} = require('../lib/NormandyDriver.js');

let sandbox;
let driver;

exports['test uuid'] = assert => {
  let uuid = driver.uuid();
  assert.notEqual(/^[a-f0-9-]{36}$/.exec(uuid), null);
};

exports['test sync device counts'] = promiseTest(assert => Task.spawn(function*() {
  Preferences.set('services.sync.clients.devices.desktop', 4);
  Preferences.set('services.sync.clients.devices.mobile', 5);
  Preferences.set('services.sync.numClients', 9);
  let client = yield driver.client();
  assert.equal(client.syncMobileDevices, 5);
  assert.equal(client.syncDesktopDevices, 4);
  assert.equal(client.syncTotalDevices, 9);

  Preferences.reset('services.sync.clients.devices.desktop');
  client = yield driver.client();
  assert.equal(client.syncMobileDevices, 5);
  assert.equal(client.syncDesktopDevices, 0);
  assert.equal(client.syncTotalDevices, 9);

  Preferences.reset('services.sync.clients.devices.mobile');
  client = yield driver.client();
  assert.equal(client.syncMobileDevices, 0);
  assert.equal(client.syncDesktopDevices, 0);
  assert.equal(client.syncTotalDevices, 9);

  Preferences.reset('services.sync.numClients');
  client = yield driver.client();
  assert.equal(client.syncMobileDevices, 0);
  assert.equal(client.syncDesktopDevices, 0);
  assert.equal(client.syncTotalDevices, 0);
}));

before(exports, () => {
  sandbox = new Cu.Sandbox(null);
  // Passing a fake reciperRunner for now; this should either be mocked
  // properly or removed as an argument to the driver.
  driver = new NormandyDriver({}, sandbox, {});
});

after(exports, () => {
  driver = null;
  Cu.nukeSandbox(sandbox);
});

testRunner.run(exports);
