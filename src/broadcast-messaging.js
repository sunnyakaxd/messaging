'use strict';

const dgram = require('dgram');
const getNetworks = require('./utils').getNetworks;
const zlib = require('zlib');

const log = { debug: console.log, error: console.log };// eslint-disable-line
const async = require('async');

let initilised = false;
const exportsWrapper = {
};
let ipMeta;

function init(config, cb) {
  if (typeof config === 'function') {
    cb = config;
    config = null;
  }
  if (initilised) {
    return cb(new Error('Already Initialized'));
  }
  config = config || {};
  const SERVER_PORT = config.port || process.env.UDP_SERVER_BIND_PORT || parseInt(20000 + (Math.random() * 30000), 10);
  let binder;
  ipMeta = getNetworks();
  const socketOptions = {
    type: 'udp4',
    reuseAddr: true,
  };
  if (process.env.UDP_SERVER_BIND_IP) {
    const newMeta = {};
    const boundIps = new Set(process.env.UDP_SERVER_BIND_IP.split(','));
    [...boundIps].forEach((address) => {
      if (ipMeta[address]) {
        newMeta[address] = ipMeta[address];
      } else {
        log.error(`Cannot find address ${address}`);
      }
    });
    ipMeta = newMeta;
    // console.log('new meta', ipMeta);

    binder = (binderCb) => {
      async.map(Object.keys(ipMeta), (address, asyncCb) => {
        const socket = dgram.createSocket(socketOptions);
        socket.on('listening', () => {
          const hostPort = socket.address();
          console.log(`server listening ${hostPort.address}:${hostPort.port}`); // eslint-disable-line no-console
        });
        console.log(`trying to bind to ${address}:${SERVER_PORT}`); // eslint-disable-line no-console
        socket.bind({
          address,
          port: SERVER_PORT,
        }, () => {
          asyncCb(null, {
            socket,
            address,
            port: SERVER_PORT,
          });
        });
      }, (err, socketMetas) => {
        binderCb(socketMetas, ipMeta);
      });
    };
  } else {
    binder = (binderCb) => {
      const socket = dgram.createSocket(socketOptions);
      socket.on('listening', () => {
        const address = socket.address();
        console.log(`server listening ${address.address}:${address.port}`); // eslint-disable-line no-console
      });
      console.log(`Trying to bind to 0.0.0.0:${SERVER_PORT}`); // eslint-disable-line no-console
      socket.bind({
        address: '0.0.0.0',
        port: SERVER_PORT,
      }, () => {
        binderCb([{
          socket,
          address: '0.0.0.0',
          port: SERVER_PORT,
        }], ipMeta);
      });
    };
  }
  binder((serverSockets, publishConfig) => {
    const clientSocket = dgram.createSocket('udp4');
    clientSocket.bind(() => {
      clientSocket.setBroadcast(1);
    });
    // console.log(serverSockets);
    exportsWrapper.publish = function publisher(msg, publisherCb) {
      // console.log(publishConfig);
      publisherCb = publisherCb || (() => true);
      async.eachSeries(Object.keys(publishConfig), (address, asyncCb) => {
        const addressConfig = ipMeta[address];
        // console.log(addressConfig);
        const msgStr = JSON.stringify(msg);
        const sender = buffer => clientSocket.send(
          buffer,
          SERVER_PORT,
          addressConfig.broadcast,
          (err) => {
            if (err) {
              log.error(`unable to send to address ${addressConfig.address}, error is ${err}`);
            }
            // console.log(`sent to ${addressConfig.broadcast} on port ${SERVER_PORT}`);
            asyncCb();
          });

        const msgBuffer = Buffer.from(msgStr);
        zlib.deflateRaw(msgBuffer, (err, defBuffer) => {
          if (err) {
            return sender(msgBuffer);
          }
          sender(defBuffer);
        });
      }, publisherCb);
    };
    exportsWrapper.subscribe = function subscriber(subscriberCb) {
      serverSockets.forEach((serverSocket) => {
        serverSocket.socket.on('message', (msgBuffer, rinfo) => {
          // console.log(msg);
          const receiver = (buffer) => {
            try {
              const rcvdStr = buffer.toString('ascii');
              subscriberCb(JSON.parse(rcvdStr), rinfo);
            } catch (e) {
              log.error('Callback failed for subscribe');
            }
          };
          zlib.inflateRaw(msgBuffer, (err, actualBuf) => {
            if (err) {
              return receiver(msgBuffer);
            }
            receiver(actualBuf);
          });
        });
      });
    };
    exportsWrapper.destroy = function destroyer(destroyCb) {
      async.each(serverSockets.concat([clientSocket]), (socket, asyncCb) => {
        socket.close(asyncCb);
      }, () => {
        initilised = false;
        destroyCb();
      });
    };
    initilised = true;
    cb(serverSockets);
  });
}

function subscribe(...rest) {
  exportsWrapper.subscribe.apply(this, rest);
}
function publish(...rest) {
  exportsWrapper.publish.apply(this, rest);
}

function destroy(...rest) {
  exportsWrapper.destroy.apply(this, rest);
}


module.exports = {
  init,
  publish,
  subscribe,
  destroy,
};
