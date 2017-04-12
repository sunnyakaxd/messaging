'use strict';

module.exports = function (type) {
  return require(`./src/${type}`); // eslint-disable-line global-require
};
