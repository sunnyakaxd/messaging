'use strict';

const uuid = require('uuid');
const broadcastMessaging = require('./broadcast-messaging');
const multicastMessaging = require('./multicast-messaging');
// const swarmMessaging = require('./swarm-messaging');

const exportsWrapper = {
};
let initialised = false;
function init(config, initCb, selfIgnore) {
  if (typeof config === 'function') {
    initCb = config;
    config = null;
  }
  if (initialised) {
    return initCb(new Error('already initialised'));
  }
  config = config || {};
  const type = config.type || 'broadcast';
  let messaging;
  const received = new Set();
  received.transientAdd = function transientAdd(sig) {
    setTimeout(() => received.delete(sig), 4000);
    return received.add(sig);
  };
  if (type === 'multicast') {
    messaging = multicastMessaging;
  } else if (type === 'broadcast') {
    messaging = broadcastMessaging;
  }
  // else if (type === 'swarm') {
  //   messaging = swarmMessaging;
  // }
  messaging.init(config, () => {
    exportsWrapper.publish = (msg, publisherCb) => {
      const sig = uuid.v4();
      const wrappedMsg = JSON.stringify({
        l: 1,
        msg,
        sig,
      });

      // Check if we also need to ignore message to this app
      if (selfIgnore) {
        received.transientAdd(sig);
      }
      messaging.publish(wrappedMsg, publisherCb);
    };
    exportsWrapper.subscribe = (subscriberCb) => {
      messaging.subscribe((msg, rinfo) => {
        try {
          const rcvdObj = JSON.parse(msg);
          if (!(rcvdObj.l === 1)) {
            return;
          }
          if (received.has(rcvdObj.sig)) {
            return;
          }
          received.transientAdd(rcvdObj.sig);
          subscriberCb(rcvdObj.msg, rinfo);
        } catch (e) {
          return console.error(e);
        }
      });
    };
    exportsWrapper.destroy = function (destroyerCb) {
      messaging.destroy(() => {
        initialised = false;
        destroyerCb();
      });
    };
    initialised = true;
    initCb();
  });
}

function publish(...rest) {
  return exportsWrapper.publish.apply(this, rest);
}

function subscribe(...rest) {
  return exportsWrapper.subscribe.apply(this, rest);
}

function destroy(...rest) {
  return exportsWrapper.destoy.apply(this, rest);
}

module.exports = {
  init,
  publish,
  subscribe,
  destroy,
};
