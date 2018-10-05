
'use strict';

const stream = require('stream');

function streamToArray(readStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readStream
      .on('data', (chunk) => { chunks.push(chunk); })
      .once('end', () => { resolve(chunks); })
      .once('error', (err) => { reject(err); });
  });
}

module.exports.streamToArray = streamToArray;

async function streamToString(readStream) {
  readStream.setEncoding('utf8');
  return (await streamToArray(readStream)).join('');
}

module.exports.streamToString = streamToString;

function waitForEvent(emitter, event, rejectOnError) {
  return new Promise((resolve, reject) => {
    emitter.once(event, resolve);
    if (rejectOnError) {
      emitter.once('error', reject);
    }
  });
}

module.exports.waitForEvent = waitForEvent;

function mapToObj(map) {
  const obj = {};
  for (const prop of map) {
    obj[prop[0]] = prop[1];
  }
  return obj;
}

module.exports.mapToObj = mapToObj;

function createMapToObjTransformStream() {
  return new stream.Transform({
    objectMode: true,
    transform(map, enc, cb) {
      this.push(mapToObj(map));
      cb();
    }
  })
}

module.exports.createMapToObjTransformStream = createMapToObjTransformStream;

class IteratorStream extends stream.Readable {
  constructor(iterator) {
    super({ objectMode: true });
    const is = this;
    this._isReading = false;
    this._iterator = iterator;
    this._iterator.on('end', () => {
      is.push(null);
    });
  }
  _read() {
    const is = this;
    is._startReading();
  }
  _startReading() {
    const is = this;
    if (is._isReading) return;
    is._isReading = true;
    is._iterator.on('data', (quad) => {
      if (!is.push(quad)) {
        is._stopReading();
      }
    });
  }
  _stopReading() {
    const is = this;
    is._iterator.removeAllListeners('data');
    is._isReading = false;
  }
}

function createIteratorStream(iterator) {
  return new IteratorStream(iterator);
}

module.exports.createIteratorStream = createIteratorStream;

function wrapError(err, message) {
  const wrapperError = new Error(message);
  wrapperError.stack += '\nCaused by:' + err.stack;
  return wrapperError;
}

module.exports.wrapError = wrapError;
