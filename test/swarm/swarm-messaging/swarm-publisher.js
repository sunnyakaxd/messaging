'use strict';
const messaging = require('../../../src/swarm-messaging');

messaging.init({
  port: 5007,
}, () => {
  setInterval(() => {
    const data = Math.random().toString();
    messaging.publish(data, () => {
      console.log('Published', data);
    });
  }, 1000);
});
