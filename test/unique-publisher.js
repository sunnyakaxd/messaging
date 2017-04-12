'use strict';

const messaging = require('../src/unique-messaging');

let i = 0;
messaging.init({
  port: 5007,
  group: '230.185.192.108',
}, () => {
  setInterval(() => {
    const k = i;
    messaging.publish(`${k}`, (err) => {
      console.log(err || `Published ${k}`);
    });
    i++;
  }, 1000);
});
