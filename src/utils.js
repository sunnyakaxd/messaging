'use strict';

const os = require('os');

function getIp4Broadcast(ip, mask) {
  const notAddressMask = mask.split('.').map(byte => (255 - byte));
  const addressBytes = ip.split('.').map(byte => parseInt(byte, 10));
  const broadcastAddress = addressBytes.map((byte, i) => (notAddressMask[i] | byte)).join('.'); // eslint-disable-line no-bitwise
  return broadcastAddress;
}

function getNetworks(filter) {
  filter = filter || (netInterface => (!netInterface.internal || netInterface.family === 'IPv4'));
  const interfaces = os.networkInterfaces();
  const addresses = [];
  Object.keys(interfaces).forEach((interfaceKey) => {
    interfaces[interfaceKey].forEach((netInterface) => {
      if (!filter(netInterface)) {
        return;
      }
      addresses[netInterface.address] = {
        address: netInterface.address,
        mask: netInterface.netmask,
        family: netInterface.family,
      };
      if (netInterface.family === 'IPv4') {
        addresses[netInterface.address].broadcast = getIp4Broadcast(netInterface.address, netInterface.netmask);
      }
    });
  });
  return addresses;
}
module.exports = {
  getNetworks,
};
