'use strict';

const messaging = require('../src/multicast-messaging');

let i = 0;
messaging.init({
  port: 5007,
  group: '230.185.192.108',
}, () => {
  setInterval(() => {
    messaging.publish(`${i++}`, (err) => {
      console.log(err || 'Published');
    });
  }, 1000);
});
