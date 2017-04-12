'use strict';

const messaging = require('../src/topic-messaging');

const totalTopics = 10;
messaging.init({
  port: 5007,
}, () => {
  for (let i = 0; i < totalTopics; i++) {
    const j = i;
    messaging.subscribe(`topic-${j}`, (msg) => {
      console.log(`message received to topic ${j}: ${msg}`);
    });
  }
});
