
'use strict';

const utils = require('../lib/utils');
const memdown = require('memdown');
const quadstore = require('quadstore');
const SparqlEngine = require('..');

describe('SparqlEngine', () => {

  beforeEach(async function () {
    this.db = memdown();
    this.store = new quadstore.RdfStore(this.db);
    this.engine = new SparqlEngine(this.store);
    await utils.waitForEvent(this.store, 'ready');
  });

  afterEach(async function () {
    await this.store.close();
  });

  require('./sparqlengine.prototype.query')();

});
