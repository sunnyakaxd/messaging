'use strict';
const mqtt = require('mqtt');

const exportsWrapper = {
};

const subscribers = [];

function init(config, initcb) {
  const mqttBroker = config.mqttBroker || process.env.MQTT_BROKER_IP || '127.0.0.1';
  console.log(`Initialising mqtt at mqtt://${mqttBroker}`);
  const client = mqtt.connect(`mqtt://${mqttBroker}`);
  client.on('connect', () => {
    console.log(`mqtt connected to mqtt://${mqttBroker}`);
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
      console.log('publishing ', msg);
      client.publish(topic, msg);
      if (publisherCb) {
        publisherCb();
      }
    };
    initcb();
  });
}

exportsWrapper.init = init;

module.exports = exportsWrapper;
