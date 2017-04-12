'use strict';

const messagingImpl = require('../src/udp-messaging.js');

messagingImpl.init({
  port: 5007,
}, () => {
  messagingImpl.subscribe((msg, rinfo) => {
    console.log('received ', msg);
    console.log(`from ${rinfo.family}:${rinfo.address}:${rinfo.port}     size:${rinfo.size}`);
  });
});
