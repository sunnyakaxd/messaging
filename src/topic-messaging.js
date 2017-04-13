'use strict';

const uuid = require('uuid');
const messaging = require('./mqtt-messaging');
const LinkedList = require('../utils/doubly-linked-list');


let exportsWrapper = {
};

const ignoreSet = new Set();
ignoreSet.transientAdd = function transientAdd(data) {
  setTimeout(() => this.delete(data), 4000);
  this.add(data);
  return data;
};


function init(config, initCb) {
  if (typeof config === 'function') {
    initCb = config;
    config = null;
  }
  config = config || {};
  function debug(...rest) {
    if (config.debug) {
      console.log(...rest);// eslint-disable-line no-console
    }
  }
  debug(`Initialising topic messaging with ${JSON.stringify(config, null, 2)}`);
  let subscribers = {};
  messaging.init(config, () => {
    messaging.subscribe('topicMessaging', (wrappedMsg) => {
      try {
        wrappedMsg = JSON.parse(wrappedMsg);
        if (wrappedMsg.ignoreMe) {
          if (ignoreSet.has(wrappedMsg.ignoreMe)) {
            debug(`Ignoring message: ${wrappedMsg.topic}:${wrappedMsg.msg}`);
            return;
          }
        }
        const topicSubs = subscribers[wrappedMsg.topic];
        if (topicSubs) {
          topicSubs.forEach((hook) => {
            try {
              hook(wrappedMsg.msg);
            } catch (intErr) {
              intErr.__throw = true;
              throw intErr;
            }
          });
        }
      } catch (e) {
        if (e.__throw) {
          throw e;
        }
        console.error(e);// eslint-disable-line no-console
      }
    });
    exportsWrapper.publish = function publisher(topic, msg, publisherCb, getBack) {
      if (topic == null) {
        return publisherCb(new Error('topic can\'t be null'));
      }
      messaging.publish('topicMessaging', JSON.stringify({
        ignoreMe: (!getBack) && ignoreSet.transientAdd(uuid.v4()),
        msg,
        topic,
      }), publisherCb);
    };
    exportsWrapper.subscribe = function subscriber(topic, subscriberCb) {
      if (topic == null) {
        return;
      }
      const topicSubs = subscribers[topic] = subscribers[topic] || new LinkedList();
      const subscribtion = topicSubs.add(subscriberCb);
      return () => {
        subscribtion.remove();
        if (topicSubs.isEmpty()) {
          delete subscribers[topic];
        }
      };
    };
    exportsWrapper.destroy = () => {
      messaging.destroy(() => {
        exportsWrapper = {};
        subscribers = {};
      });
    };
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
