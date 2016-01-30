import assert from 'assert';
import util from 'util';
import fs from 'fs';
import path from 'path';
import mocha from 'mocha';
import jsonld from 'jsonld';
import jsonldRdfaParser from '../src';
import { jsdom } from 'jsdom';

const htmlPath = path.join(path.dirname(__filename), 'fixtures', 'test.html');

const expected = {
  '@id': 'http://example.com',
  '@type': 'ScholarlyArticle',
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
    author:
    {
      '@id': 'http://berjon.com/',
      '@type': 'Person',
      familyName: 'Berjon',
      givenName: 'Robin'
    }
  },
  contributor: {
    '@id': '_:b2',
    '@type': 'sa:ContributorRole',
    roleAffiliation:  {
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

const context = {
  "@context": {
    "@vocab": "http://schema.org/",
    "sa": "http://ns.science.ai#",
    "roleAffiliation": {
      "@id": "sa:roleAffiliation",
      "@type": "@id"
    },
    "roleContactPoint": {
      "@id": "sa:roleContactPoint",
      "@type": "@id"
    },
    "author": {
      "@type": "@id"
    },
    "contributor": {
      "@type": "@id"
    }
  },
  "@embed": "@always",
  "@type": "ScholarlyArticle"
};


describe('jsonld-rdfa-parser', function() {

  before(function() {
    jsonld.registerRDFParser('html', jsonldRdfaParser);
  });

  it('should parse RDFa from a file path ', function(done) {
    jsonld.fromRDF(htmlPath, {format: 'html'}, function(err, data) {
      jsonld.frame(data, context, function(err, data) {
        assert.deepEqual(data['@graph'][0], expected);
        done();
      });
    });
  });

  it('should parse RDFa from a string of HTML ', function(done) {
    fs.readFile(htmlPath, {encoding: 'utf8'}, function(err, html) {
      jsonld.fromRDF(html, {format: 'html'}, function(err, data) {
        jsonld.frame(data, context, function(err, data) {
          assert.deepEqual(data['@graph'][0], expected);
          done();
        });
      });
    });
  });

//  it('should parse RDFa from a DOM node', function(done) {
//    fs.readFile(htmlPath, {encoding: 'utf8'}, function(err, html) {
//      jsonld.fromRDF(html, {format: 'html'}, function(err, data) {
//        console.log(data);
//        jsonld.frame(data, context, function(err, data) {
//          assert.deepEqual(data['@graph'][0], expected);
//          done();
//        });
//      });
//    });
//  });

});
