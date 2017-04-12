'use strict';

const messagingImpl = require('../src/udp-messaging.js');

let i = 0;
messagingImpl.init({
  port: 5007,
  ipList: [process.env.SEND_TO_IP],
}, () => {
  setInterval(() => {
    messagingImpl.publish(`${i++}`, err => console.log(err || `published ${i}`));
  }, 1000);
});
