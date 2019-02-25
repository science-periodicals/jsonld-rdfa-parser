import assert from 'assert';
import fs from 'fs';
import path from 'path';
import jsonld from 'jsonld';
import jsonldRdfaParser from '../src';
import { JSDOM } from 'jsdom';
import http from 'http';

const htmlPath = path.join(path.dirname(__filename), 'fixtures', 'test.html');

const expected = {
  '@id': 'http://example.com',
  '@type': 'ScholarlyArticle',
  name: {
    '@type': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#HTML',
    '@value': 'De la <em>bombe</em> bébé!'
  },
  author: {
    '@id': '_:b0',
    '@type': 'sa:ContributorRole',
    roleAffiliation: {
      '@id': 'https://science.ai/',
      '@type': 'Corporation',
      name: 'science.ai'
    },
    roleContactPoint: {
      '@id': '_:b1',
      '@type': 'ContactPoint',
      email: { '@id': 'mailto:robin@berjon.com' }
    },
    author: {
      '@id': 'http://berjon.com/',
      '@type': 'Person',
      familyName: 'Berjon',
      givenName: 'Robin'
    }
  },
  contributor: {
    '@id': '_:b2',
    '@type': 'sa:ContributorRole',
    roleAffiliation: {
      '@id': 'https://science.ai/',
      '@type': 'Corporation',
      name: 'science.ai'
    },
    contributor: {
      '@id': 'https://github.com/sballesteros',
      '@type': 'Person',
      familyName: 'Ballesteros',
      givenName: 'Sebastien'
    }
  }
};

const frame = {
  '@context': {
    '@vocab': 'http://schema.org/',
    sa: 'http://ns.science.ai#',
    roleAffiliation: {
      '@id': 'sa:roleAffiliation',
      '@type': '@id'
    },
    roleContactPoint: {
      '@id': 'sa:roleContactPoint',
      '@type': '@id'
    },
    author: {
      '@type': '@id'
    },
    contributor: {
      '@type': '@id'
    }
  },
  '@embed': '@always',
  '@type': 'ScholarlyArticle'
};

describe('jsonld-rdfa-parser', () => {
  let server;

  before(done => {
    jsonld.registerRDFParser('text/html', jsonldRdfaParser);
    server = http.createServer((req, res) => {
      fs.readFile(htmlPath, (error, data) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      });
    });
    server.listen(3000, '127.0.0.1', done);
  });

  it('should parse RDFa from a file path ', done => {
    jsonld.fromRDF(htmlPath, { format: 'text/html' }, (err, data) => {
      if (err) return done(err);
      jsonld.frame(data, frame, (err, framed) => {
        assert.deepEqual(framed['@graph'][0], expected);
        done();
      });
    });
  });

  it('should parse RDFa from a string of HTML ', done => {
    fs.readFile(htmlPath, { encoding: 'utf8' }, (err, html) => {
      jsonld.fromRDF(html, { format: 'text/html' }, (err, data) => {
        if (err) return done(err);
        jsonld.frame(data, frame, (err, framed) => {
          assert.deepEqual(framed['@graph'][0], expected);
          done();
        });
      });
    });
  });

  it('should parse RDFa from a DOM node', done => {
    fs.readFile(htmlPath, { encoding: 'utf8' }, (err, html) => {
      let { body } = new JSDOM(html).window.document;
      jsonld.fromRDF(body, { format: 'text/html' }, (err, data) => {
        if (err) return done(err);
        jsonld.frame(data, frame, (err, framed) => {
          assert.deepEqual(framed['@graph'][0], expected);
          done();
        });
      });
    });
  });

  it('should parse RDFa from a URL', done => {
    jsonld.fromRDF(
      'http://127.0.0.1:3000',
      { format: 'text/html' },
      (err, data) => {
        if (err) return done(err);
        jsonld.frame(data, frame, (err, framed) => {
          assert.deepEqual(framed['@graph'][0], expected);
          done();
        });
      }
    );
  });

  after(() => {
    jsonld.unregisterRDFParser('text/html');
    server.close();
  });
});
