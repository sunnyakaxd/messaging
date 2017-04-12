'use strict';

const dgram = require('dgram');
const async = require('async');
const getNetworks = require('./utils').getNetworks;

const exportsWrapper = {
  subscribe: cb => cb(new Error('unable to subscribe without init')),
  publish: (msg, cb) => cb(new Error('unable to publish without init')),
};

function init(config, initCb) {
  if (typeof config === 'function') {
    initCb = config;
    config = undefined;
  }
  config = config || {};
  initCb = initCb || (() => undefined);
  const group = config.group || process.env.UDP_SERVER_BIND_GROUP;
  const port = config.port || process.env.UDP_SERVER_BIND_PORT;
  const interfaces = config.address || process.env.UDP_SERVER_BIND_IP;
  let interfaceList;
  const addressMeta = getNetworks(netInterface => (!netInterface.internal) && netInterface.family === 'IPv4');
  if (interfaces) {
    interfaceList = new Set(interfaces.split(','));
    Object.keys(addressMeta).forEach((netInterface) => {
      if (!interfaceList.has(netInterface.address)) {
        delete addressMeta[netInterface.address];
      }
    });
  }
  interfaceList = Object.keys(addressMeta);
  // return console.log(interfaceList);
  async.mapSeries(interfaceList, (address, asyncCb) => {
    const netInterface = addressMeta[address];
    const options = {
      type: `udp${netInterface.family.charAt(netInterface.family.length - 1)}`,
      reuseAddr: true,
    };
    // console.log(options, netInterface);
    const socket = dgram.createSocket(options);
    socket.on('error', (err) => {
      console.log(`error occurred on interface ${address}, error is `, err);
    });
    console.log(`trying to bind to address = ${address}  port = ${port}`);
    socket.bind({
      address,
      port,
    }, () => {
      const hostPort = socket.address();
      console.log(`listening to ${hostPort.address}__${hostPort.port}`);
      try {
        socket.addMembership(group, hostPort.address);
      } catch (e) {
        console.log(`socket: ${hostPort.address}__${hostPort.port} := Membership to ${group} failed`);
        console.error(e);
      }
      asyncCb(null, socket);
    });
  }, (err, sockets) => {
    const clientSocket = dgram.createSocket('udp4');
    exportsWrapper.publish = (msg, publisherCb) => {
      // async.each(sockets, (socket, asyncCb) => {
      //   socket.
      // });
      console.log('trying to send');
      clientSocket.send(
        Buffer.from(typeof msg !== 'string' ? (JSON.stringify(msg) || 'null') : msg),
        port,
        group,
        (publishErr) => {
          if (publishErr) {
            console.error(`unable to send to ${group}`);
          }
          publisherCb(publishErr);
        });
    };
    exportsWrapper.subscribe = (subscriberCb) => {
      sockets.forEach((socket) => {
        socket.on('message', (msg) => {
          subscriberCb(msg.toString('ascii'));
        });
      });
    };
    initCb(err, sockets);
  });
}

function publish(...rest) {
  return exportsWrapper.publish.apply(this, rest);
}

function subscribe(...rest) {
  return exportsWrapper.subscribe.apply(this, rest);
}

module.exports = {
  init,
  publish,
  subscribe,
};
