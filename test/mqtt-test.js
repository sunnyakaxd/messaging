const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost');

client.on('connect', () => {
  client.subscribe('presence');
  client.publish('presence', 'Hello mqtt');
});

client.on('message', (topic, message) => {
  // message is Buffer
  console.log(message.toString());
  client.end();
});
