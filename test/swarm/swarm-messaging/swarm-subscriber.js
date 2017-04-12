'use strict';
const messaging = require('../../../src/swarm-messaging');

messaging.init({
  port: 5007,
}, () => {
  messaging.subscribe((data) => {
    console.log('received ', data);
  });
});
