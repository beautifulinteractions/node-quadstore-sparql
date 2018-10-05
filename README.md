
# quadstore-sparql

`quadstore-sparql` is a SPARQL engine for [`quadstore`](https://github.com/beautifulinteractions/node-quadstore).

## Credits

`quadstore-sparql` is basically a wrapper around a specific configuration of
the [Comunica](https://github.com/comunica/comunica) engine framework.

All credit goes to the wonderful team maintaining Comunica.

## Current version

Current version: **v5.0.2** [[See on NPM](https://www.npmjs.com/package/quadstore-sparql)].

`quadstore-sparql` is maintained alongside `quadstore` and versioned 
accordingly. Equal major version numbers imply compatibility between
the two modules.

## Notes

- Uses [Semantic Versioning](https://semver.org). 
  Pre-releases are tagged accordingly.
- The `master` branch is kept in sync with NPM and all development work happens
  on the `devel` branch and/or issue-specific branches.
- Requires Node.js >= 8.0.0.

## Usage

### `SparqlEngine()`

The constructor expects an instance of `quadstore.RdfStore` as its only 
argument.

    const memdown = require('memdown');
    const quadstore = require('quadstore');
    const SparqlEngine = require('quadstore-sparql');
    
    const rdfStoreInstance = new quadstore.RdfStore(memdown());
    const sparqlEngineInstance = new SparqlEngine(store);

    rdfStoreInstance.import();
    sparqlEngineInstance.query('SELECT * WHERE {?s ?p ?o}', (err, result) => { 
      /* ... */
    });

### `SparqlEngine.prototype.query()`

The `.query()` method takes care of calling the `.queryStream()` method and 
then buffering all data emitted by the stream.

    const queryString = 'SELECT *  WHERE { GRAPH ?g { ?s ?p ?o } }';
    const resultFormat = 'application/sparql-results+xml';
    
    const result = await sparqlEngineInstance.queryStream(queryString, resultFormat);
    console.log(result);

Depending on the `format` argument, the returned item is either an array of 
quads/bindings or a string.

### `SparqlEngine.prototype.queryStream()`

    const queryString = 'SELECT *  WHERE { GRAPH ?g { ?s ?p ?o } }';
    const resultFormat = 'application/sparql-results+xml';
    
    const resultStream = await sparqlEngineInstance.queryStream(queryString, resultFormat);
    resultStream.on('data', (chunk) => { /* ... */ });

Returns a `stream.Readable` that outputs the results of the query, formatted
according to the data format specified as the second argument. 

| Format                            | Datatype of emitted chunks                                  |
| --------------------------------- | ----------------------------------------------------------- |
| *nil*                             | dictionary of bindings as RDF/JS' `Term` instances          |
| `comunica`                        | raw `@comunica/actor-init-sparql-rdfjs`' `result` object    |
| `application/json`                | simple JSON serialization                                   |
| `application/sparql-results+xml`  | [SPARQL-XML](https://www.w3.org/TR/rdf-sparql-XMLres/)      |
| `application/sparql-results+json` | [SPARQL-JSON](https://www.w3.org/TR/sparql11-results-json/) |
| `application/trig`                | [Trig](https://www.w3.org/TR/trig/)                         |
| `application/n-quads`             | [N-Quads](https://www.w3.org/TR/n-quads/)                   |

## Browser

`quadstore-sparql` can be used in browsers via bundling tools such as 
`rollup`, `webpack`, `browserify` and their plugins.

The pre-assembled 
[`quadstore-sparql.umd-bundle.js`](./quadstore-sparql.umd-bundle.js) 
UMD bundle can be directly included into client-side projects where 
[`quadstore`](https://github.com/beautifulinteractions/node-quadstore)
is also present.

```
<script src="./quadstore.umd-bundle.js"></script>
<script src="./quadstore-sparql.umd-bundle.js"></script>
<script>
    const db = quadstore.leveljs('db');
    const store = new quadstore.RdfStore(db);
    const engine = new window['quadstore-sparql'](store);
</script>
```

The bundle is created with `webpack` (bundler), `babel` (translation to ES5) 
and `uglifyjs` (minifier) and includes `@comunica/actor-init-sparql-rdfjs`,
which makes it rather hefty (~ 1.6 MB).
