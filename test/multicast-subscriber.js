'use strict';

const messaging = require('../src/multicast-messaging');

messaging.init({
  port: 5007,
  group: '230.185.192.108',
}, () => {
  messaging.subscribe((msg) => {
    console.log(`msg: ${msg}`);
  });
});
