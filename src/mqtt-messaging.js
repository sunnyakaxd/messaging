'use strict';

const mqtt = require('mqtt');

const exportsWrapper = {
};

const subscribers = [];

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
  const mqttBroker = config.mqttBroker || process.env.MQTT_BROKER_IP || '127.0.0.1';
  debug(`Initialising mqtt at mqtt://${mqttBroker}`);
  const client = mqtt.connect(`mqtt://${mqttBroker}`);
  client.on('connect', () => {
    debug(`mqtt connected to mqtt://${mqttBroker}`);
    client.on('message', (recTopic, msg) => {
    // message is Buffer
      // console.log(message.toString('acsii'));
      subscribers.forEach((subCb) => {
        if (subCb) {
          subCb(msg);
        }
      });
      // client.end();
    });
    exportsWrapper.subscribe = function subscriber(topic, subCb) {
      client.subscribe(topic);
      subscribers.push(subCb);
    };
    exportsWrapper.publish = function publisher(topic, msg, publisherCb) {
      debug('publishing ', msg);
      client.publish(topic, msg);
      if (publisherCb) {
        publisherCb();
      }
    };
    initCb();
  });
}

exportsWrapper.init = init;

module.exports = exportsWrapper;
