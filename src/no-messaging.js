'use strict';

module.exports = {
  init(...rest) {
    const cb = rest[rest.length - 1];
    console.log('Initialised dummy messaging');
    if (cb && typeof cb === 'function') {
      cb();
    }
  },
  publish(...rest) {
    console.log('Publishing');
    const cb = rest[rest.length - 1];
    if (cb && typeof cb === 'function') {
      cb();
    }
  },
  subscribe(...rest) {
    console.log('Subscribing');
    const cb = rest[rest.length - 1];
    if (cb && typeof cb === 'function') {
      cb();
    }
  },
  destroy(...rest) {
    console.log('Subscribing');
    const cb = rest[rest.length - 1];
    if (cb && typeof cb === 'function') {
      cb();
    }
  },
};
