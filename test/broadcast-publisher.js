'use strict';

const messagingImpl = require('../src/broadcast-messaging.js');
let i = 0;
messagingImpl.init({
  port: 5007,
}, () => {
  setInterval(() => {
    messagingImpl.publish(`${i++}`, err => console.log(err || `published ${i}`));
  }, 1000);
});
