
'use strict';

const utils = require('../lib/utils');
const should = require('should');
const dataFactory = require('@rdfjs/data-model');

const {quad, namedNode, literal, defaultGraph} = dataFactory;

module.exports = () => {

  describe('prototype.query()', () => {

    it('Shoud return the correct number of entries', async function () {
      const ctx = this;
      const store = ctx.store;
      const quads = [];
      for (let i = 0; i < 20; i++) {
        quads.push(quad(
          namedNode('http://ex.com/s' + i),
          namedNode('http://ex.com/p' + i),
          namedNode('http://ex.com/o' + i),
          namedNode('http://ex.com/g' + i)
        ));
      }
      await store.put(quads);
      const query = 'SELECT *  WHERE { GRAPH ?g { ?s ?p ?o } }';
      const bindings = await utils.streamToArray(await ctx.engine.queryStream(query));
      should(bindings).have.length(20);
    });

    it('Shoud return the correct number of entries (LIMIT)', async function () {
      const ctx = this;
      const store = ctx.store;
      const quads = [];
      for (let i = 0; i < 200; i++) {
        quads.push(quad(
          namedNode('http://ex.com/s' + i),
          namedNode('http://ex.com/p' + i),
          namedNode('http://ex.com/o' + i),
          namedNode('http://ex.com/g' + i)
        ));
      }
      await store.put(quads);
      const query = 'SELECT *  WHERE { GRAPH ?g { ?s ?p ?o } } LIMIT 132';
      const bindings = await utils.streamToArray(await ctx.engine.queryStream(query));
      should(bindings).have.length(132);
    });

    it('Shoud match the correct number of entries', async function () {
      const ctx = this;
      const store = ctx.store;
      const quads = [];
      for (let i = 0; i < 200; i++) {
        quads.push(quad(
          namedNode('http://ex.com/s' + (i % 10)),
          namedNode('http://ex.com/p' + (i % 20)),
          namedNode('http://ex.com/o' + (i % 50)),
          namedNode('http://ex.com/g' + i)
        ));
      }
      await store.put(quads);
      const query = 'SELECT *  WHERE { GRAPH ?g { <http://ex.com/s0> <http://ex.com/p0> ?o } }';
      const bindings = await utils.streamToArray(await ctx.engine.queryStream(query));
      should(bindings).have.length(10);
    });

    it('Should filter quads correctly by comparing integers', async function () {
      const XSD = 'http://www.w3.org/2001/XMLSchema#';
      const store = this.store;
      const quads = [
        quad(
          namedNode('http://ex.com/s0'),
          namedNode('http://ex.com/p3'),
          literal('8', `${XSD}integer`),
          namedNode('http://ex.com/g0')
        ),
        quad(
          namedNode('http://ex.com/s0'),
          namedNode('http://ex.com/p0'),
          literal('1', `${XSD}integer`),
          namedNode('http://ex.com/g0')
        ),
        quad(
          namedNode('http://ex.com/s0'),
          namedNode('http://ex.com/p1'),
          literal('3', `${XSD}integer`),
          namedNode('http://ex.com/g0')
        ),
        quad(
          namedNode('http://ex.com/s0'),
          namedNode('http://ex.com/p2'),
          literal('5', `${XSD}integer`),
          namedNode('http://ex.com/g0')
        )
      ];
      await store.put(quads);
      const query = 'SELECT * WHERE { GRAPH ?g { ?s ?p ?o. FILTER (?o >= 4) } }';
      const bindings = await utils.streamToArray(await this.engine.queryStream(query));
      should(bindings).have.length(2);
    });

    it('Should filter quads correctly by comparing timestamps as integers', async function () {
      const XSD = 'http://www.w3.org/2001/XMLSchema#';
      const store = this.store;
      const quads = [
        quad(
          namedNode('http://ex.com/s0'),
          namedNode('http://ex.com/p2'),
          literal(`${new Date('2017-01-02T00:00:00Z').valueOf()}`, `${XSD}integer`),
          namedNode('http://ex.com/g0')
        ),
        quad(
          namedNode('http://ex.com/s0'),
          namedNode('http://ex.com/p3'),
          literal(`${new Date('2017-01-01T00:00:00Z').valueOf()}`, `${XSD}integer`),
          namedNode('http://ex.com/g0')
        ),
        quad(
          namedNode('http://ex.com/s0'),
          namedNode('http://ex.com/p0'),
          literal(`${new Date('2017-01-01T12:00:00Z').valueOf()}`, `${XSD}integer`),
          namedNode('http://ex.com/g0')
        ),
        quad(
          namedNode('http://ex.com/s0'),
          namedNode('http://ex.com/p1'),
          literal(`${new Date('2017-01-01T16:00:00Z').valueOf()}`, `${XSD}integer`),
          namedNode('http://ex.com/g0')
        )
      ];
      await store.put(quads);
      const query1 = `SELECT * WHERE { GRAPH ?g { ?s ?p ?o. FILTER (?o >= ${new Date('2017-01-01T16:01:00Z').valueOf()}) } }`;
      const bindings1 = await utils.streamToArray(await this.engine.queryStream(query1));
      should(bindings1).have.length(1);
      const query2 = `SELECT * WHERE { GRAPH ?g { ?s ?p ?o. FILTER (?o >= ${new Date('2017-01-01T16:00:00Z').valueOf()}) } }`;
      const bindings2 = await utils.streamToArray(await this.engine.queryStream(query2));
      should(bindings2).have.length(2);
    });

    it('Should provide a correct response to a SPARQL query', async function () {
      const quads = [
        quad(namedNode('ex://s0'), namedNode('ex://p0'), namedNode('ex://o0'), namedNode('ex://g0')),
        quad(namedNode('ex://s1'), namedNode('ex://p1'), literal('literal'), namedNode('ex://g1')),
        quad(namedNode('ex://s2'), namedNode('ex://p2'), namedNode('ex://o2'), namedNode('ex://g2')),
      ];
      await this.store.put(quads);
      const query = 'SELECT *  WHERE { GRAPH ?g { ?s ?p ?o } }';
      const result = await utils.streamToString(await this.engine.queryStream(query, 'application/sparql-results+json'));
      const expected = {
        head: {
          vars: ['s', 'p', 'o', 'g']
        },
        results: {
          bindings: [
            {
              s: { value: 'ex://s0', type: 'uri' },
              p: { value: 'ex://p0', type:'uri' },
              o: { value: 'ex://o0', type: 'uri' },
              g: { value:'ex://g0', type:'uri' }
            },
            {
              s: { value: 'ex://s1', type: 'uri' },
              p: { value: 'ex://p1', type:'uri' },
              o: { value: 'literal', type: 'literal' },
              g: { value:'ex://g1', type:'uri' }
            },
            {
              s: { value: 'ex://s2', type: 'uri' },
              p: { value: 'ex://p2', type:'uri' },
              o: { value: 'ex://o2', type:'uri' },
              g: { value:'ex://g2', type:'uri' }
            }
          ]
        }
      };
      should(JSON.parse(result)).deepEqual(expected);
    });

    it('Should answer a CONSTRUCT query correctly with quads explicitly from named graphs', async function () {
      const quads = [
        quad(namedNode('ex://s0'), namedNode('ex://p0'), namedNode('ex://o0'), namedNode('ex://g0')),
        quad(namedNode('ex://s1'), namedNode('ex://p1'), literal('literal'), namedNode('ex://g1')),
        quad(namedNode('ex://s2'), namedNode('ex://p2'), namedNode('ex://o2'), namedNode('ex://g2')),
      ];
      await this.store.put(quads);
      const query = 'CONSTRUCT { ?s <ex://p3> ?o } WHERE { GRAPH ?g { ?s <ex://p1> ?o } }';
      const results = await utils.streamToArray(await this.engine.queryStream(query));
      const expected = [quad(namedNode('ex://s1'), namedNode('ex://p3'), literal('literal'), defaultGraph())];
      should(results[0].subject.value).deepEqual(expected[0].subject.value);
      should(results[0].predicate.value).deepEqual(expected[0].predicate.value);
      should(results[0].object.value).deepEqual(expected[0].object.value);
      should(results[0].graph.value).deepEqual(expected[0].graph.value);
    });

    it('Should answer a CONSTRUCT query correctly with quads implicitly from the default graph', async function () {
      const quads = [
        quad(namedNode('ex://s0'), namedNode('ex://p0'), namedNode('ex://o0'), defaultGraph()),
        quad(namedNode('ex://s1'), namedNode('ex://p1'), literal('literal'), defaultGraph()),
        quad(namedNode('ex://s2'), namedNode('ex://p2'), namedNode('ex://o2'), defaultGraph()),
      ];
      await this.store.put(quads);
      const query = 'CONSTRUCT { ?s <ex://p3> ?o } WHERE { ?s <ex://p1> ?o }';
      const results = await utils.streamToArray(await this.engine.queryStream(query));
      const expected = [quad(namedNode('ex://s1'), namedNode('ex://p3'), literal('literal'), defaultGraph())];
      should(results[0].subject.value).deepEqual(expected[0].subject.value);
      should(results[0].predicate.value).deepEqual(expected[0].predicate.value);
      should(results[0].object.value).deepEqual(expected[0].object.value);
      should(results[0].graph.value).deepEqual(expected[0].graph.value);
    });

  });

};
