'use strict';

const messaging = require('../src/topic-messaging');

const totalTopics = 10;
messaging.init({
  port: 5007,
}, () => {
  console.log('initilised');
  setInterval(() => {
    const thisTopic = parseInt(Math.random() * totalTopics, 10);
    messaging.publish(`topic-${thisTopic}`, ` random msg thrown to topic ${thisTopic}`, (err) => {
      console.log(err || `published to ${thisTopic}`);
    });
  }, 1000);
});
