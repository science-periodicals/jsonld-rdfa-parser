import greenTurtleScript from 'green-turtle';
import jsdom from 'jsdom';
import { XMLSerializer } from 'xmldom';

const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const RDF_XML_LITERAL = RDF + 'XMLLiteral';
const RDF_OBJECT = RDF + 'object';
const RDF_PLAIN_LITERAL = RDF + 'PlainLiteral';
const RDF_LANGSTRING = RDF + 'langString';
const XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

export default function jsonldRdfaParser(htmlPath, callback) {
  jsdom.env({
    file: htmlPath,
    scripts: [greenTurtleScript],
    done: function(err, window) {
      if (err) console.error(err);

      var data = window.document.data.graph;

      var dataset = {};
      dataset['@default'] = [];

      // what follows is mostly taken from the jsonld.js lib but updated to the lattest green-turtle API

      var subjects = data.subjects;
      for (var subject in subjects) {
        var predicates = subjects[subject].predicates;

        for (var predicate in predicates) {
          // iterate over objects
          var objects = predicates[predicate].objects;
          for (var oi = 0; oi < objects.length; ++oi) {
            var object = objects[oi];

            // create RDF triple
            var triple = {};

            // add subject
            if (subject.indexOf('_:') === 0) {
              triple.subject = {type: 'blank node', value: subject};
            } else {
              triple.subject = {type: 'IRI', value: subject};
            }

            // add predicate
            if (predicate.indexOf('_:') === 0) {
              triple.predicate = {type: 'blank node', value: predicate};
            } else {
              triple.predicate = {type: 'IRI', value: predicate};
            }

            // serialize XML literal
            var value = object.value;
            if (object.type === RDF_XML_LITERAL) {
              // initialize XMLSerializer
              var serializer = new XMLSerializer();
              value = '';
              for (var x = 0; x < object.value.length; x++) {
                if (object.value[x].nodeType === ELEMENT_NODE) {
                  value += serializer.serializeToString(object.value[x]);
                } else if(object.value[x].nodeType === TEXT_NODE) {
                  value += object.value[x].nodeValue;
                }
              }
            }

            // add object
            triple.object = {};

            // object is an IRI
            if (object.type === RDF_OBJECT) {
              if (object.value.indexOf('_:') === 0) {
                triple.object.type = 'blank node';
              } else {
                triple.object.type = 'IRI';
              }
            } else {
              // object is a literal
              triple.object.type = 'literal';
              if (object.type === RDF_PLAIN_LITERAL) {
                if (object.language) {
                  triple.object.datatype = RDF_LANGSTRING;
                  triple.object.language = object.language;
                } else {
                  triple.object.datatype = XSD_STRING;
                }
              } else {
                triple.object.datatype = object.type;
              }
            }
            triple.object.value = value;

            // add triple to dataset in default graph
            dataset['@default'].push(triple);
          }
        }
      }

      callback(null, dataset);
    }
  });
};
