
'use strict';

const utils = require('./lib/utils');
const ComunicaEngine = require('@comunica/actor-init-sparql-rdfjs').newEngine;

/**
 * @typedef {Object} RdfStore
 */
class SparqlEngine {
 
  /**
   * 
   * @param {RdfStore} store 
   */
  constructor(store) {
    // TODO check store instanceof rdfstore
    this._store = store;
    // TODO check engine instanceof Comunica
    this._engine = new ComunicaEngine();
  }

  query(query, format, cb) {
    function _query() {
      return this.queryStream(query, format)
        .then((result) => {
          switch (result.format) {
            case 'bindings':
            case 'quads': 
              return utils.streamToArray(result);
            default:
              return utils.streamToString(result);
          }
        });
    }
    if (typeof(cb) !== 'function') {
      return _query.call(this);
    }
    _query.call(this).then(cb.bind(null, null)).catch(cb);
  }

  queryStream(query, format, cb) {
    if (typeof(format) === 'function') {
      cb = format;
      format = undefined;
    }
    let queryPromise = this._engine.query(query, {
      sources: [
        {type: 'rdfjsSource', value: this._store}
      ]
    });
    if (!format) {
      queryPromise = queryPromise.then((result) => {
        if (result.type === 'bindings') {
          return Object.assign(utils.createIteratorStream(result.bindingsStream)
            .pipe(utils.createMapToObjTransformStream()), {format: 'bindings'});
        }
        if (result.type === 'quads') {
          return Object.assign(utils.createIteratorStream(result.quadStream), {format: 'quads'});
        }
        return Promise.reject(new Error(`Unsupported result type ${result.type} from Comunica.`));
      });
    } else if (format === 'comunica') {
      queryPromise = queryPromise
        .then(result => Object.assign(result, {format: 'comunica'}));
    
    } else {
      queryPromise = queryPromise
        .then(result => this._engine.resultToString(result, format))
        .catch(err => Promise.reject(utils.wrapError(
          err, `Cannot serialize results of query "${query}" to format "${format}".`
        )))
        .then(result => Object.assign(result.data, {format}));
    }
    if (typeof(cb) !== 'function') {
      return queryPromise;
    }
    queryPromise.then(cb.bind(null, null)).catch(cb);
  }

}

module.exports = SparqlEngine;

