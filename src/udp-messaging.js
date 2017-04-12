'use strict';

const dgram = require('dgram');
const zlib = require('zlib');

const log = { debug: console.log, error: console.log };// eslint-disable-line
const async = require('async');

let initilised = false;
const exportsWrapper = {
  ipList: [],
};


function update(updatedIpList) {
  exportsWrapper.ipList = updatedIpList;
}

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
  exportsWrapper.ipList = config.ipList;
  const socketOptions = {
    type: 'udp4',
    reuseAddr: true,
  };
  if (process.env.UDP_SERVER_BIND_IP) {
    const boundIps = new Set(process.env.UDP_SERVER_BIND_IP.split(','));
    binder = (binderCb) => {
      async.map(boundIps, (address, asyncCb) => {
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
        binderCb(socketMetas, exportsWrapper.ipList);
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
        }], exportsWrapper.ipList);
      });
    };
  }
  binder((serverSockets) => {
    // console.log(serverSockets);
    const clientSocket = dgram.createSocket('udp4');
    clientSocket.bind(() => {
      clientSocket.setBroadcast(1);
    });
    // console.log(serverSockets);
    exportsWrapper.publish = function publisher(msg, publisherCb) {
      console.log('udp-ipList', exportsWrapper.ipList);
      publisherCb = publisherCb || (() => true);
      async.eachSeries(exportsWrapper.ipList, (address, asyncCb) => {
        // console.log(addressConfig);
        const msgStr = JSON.stringify(msg);
        console.log(`publishing on ${address}:${SERVER_PORT}`);
        const sender = buffer => clientSocket.send(
          buffer,
          SERVER_PORT,
          address,
          (err) => {
            if (err) {
              log.error(`unable to send to address ${address}, error is ${err}`);
            }
            console.log(`sent ${msgStr} to ${address} on port ${SERVER_PORT}`);
            asyncCb();
          });

        const msgBuffer = Buffer.from(msgStr);
        zlib.deflateRaw(msgBuffer, (err, defBuffer) => {
          if (err) {
            console.error(err);
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
  update,
  subscribe,
  destroy,
};
