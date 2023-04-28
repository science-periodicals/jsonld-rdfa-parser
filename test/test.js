import assert from 'assert';
import { readFile } from 'fs/promises';
import path from 'path';
import jsonld from 'jsonld';
import jsonldRdfaParser from '../src/index.js';
import { JSDOM } from 'jsdom';
import http from 'http';
import { fileURLToPath } from 'url';

const htmlPath = fileURLToPath(
  new URL('./fixtures/test.html', import.meta.url)
);

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

const expected = {
  '@context': frame['@context'],
  '@id': 'http://example.com',
  '@type': 'ScholarlyArticle',
  name: {
    '@type': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#HTML',
    '@value': 'De la <em>bombe</em> bébé!'
  },
  author: {
    '@type': 'sa:ContributorRole',
    roleAffiliation: {
      '@id': 'https://science.ai/',
      '@type': 'Corporation',
      name: 'science.ai'
    },
    roleContactPoint: {
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

describe('jsonld-rdfa-parser', () => {
  let server;

  before(done => {
    jsonld.registerRDFParser('text/html', jsonldRdfaParser);
    server = http.createServer(async (req, res) => {
      let data = await readFile(htmlPath);

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    server.listen(3000, '127.0.0.1', done);
  });

  it('should parse RDFa from a file path ', async () => {
    let data = await jsonld.fromRDF(htmlPath, { format: 'text/html' });

    let framed = await jsonld.frame(data, frame);

    assert.deepEqual(framed, expected);
  });

  it('should parse RDFa from a string of HTML ', async () => {
    let html = await readFile(htmlPath, { encoding: 'utf8' });

    let data = await jsonld.fromRDF(html, { format: 'text/html' });

    let framed = await jsonld.frame(data, frame);

    assert.deepEqual(framed, expected);
  });

  it('should parse RDFa from a DOM node', async () => {
    let html = await readFile(htmlPath, { encoding: 'utf8' });
    let { body } = new JSDOM(html).window.document;

    let data = await jsonld.fromRDF(body, { format: 'text/html' });

    let framed = await jsonld.frame(data, frame);

    assert.deepEqual(framed, expected);
  });

  it('should parse RDFa from a URL', async () => {
    let data = await jsonld.fromRDF('http://127.0.0.1:3000', {
      format: 'text/html'
    });

    let framed = await jsonld.frame(data, frame);

    assert.deepEqual(framed, expected);
  });

  after(() => {
    jsonld.unregisterRDFParser('text/html');
    server.close();
  });
});
