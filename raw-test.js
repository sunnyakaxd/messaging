const dgram = require('dgram');
const os = require('os');
const interfaces = os.networkInterfaces();
const server = dgram.createSocket('udp4');
server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});
let i = 0;
server.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});
server.on('listening', () => {
  server.setBroadcast(1);
  // server.addMembership('230.185.192.108', '192.168.1.27');
  // server.setMulticastTTL(1);
  // const address = server.address();
  // console.log(`server listening ${address.address}:${address.port}`);
  setInterval(() => {
    console.log(`sending ${i}`);
    server.send(Buffer.from(`${i++}`), 5007, '192.168.1.255', (err) => {
      console.log(err);
    });// 230.185.192.108
  }, 1000);
});

server.bind({
  address: '0.0.0.0',
  port: 41234,
});
