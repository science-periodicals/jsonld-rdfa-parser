import getRDFaGraph from 'graph-rdfa-processor';
import { JSDOM } from 'jsdom'; // see ./browser/jsdom.js for browser version
import { XMLSerializer } from 'xmldom'; // see ./browser/xmldom.js for browser version
import isUrl from 'is-url';

const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const RDF_XML_LITERAL = RDF + 'XMLLiteral';
const RDF_HTML_LITERAL = RDF + 'HTML';
const RDF_OBJECT = RDF + 'object';
const RDF_PLAIN_LITERAL = RDF + 'PlainLiteral';
const RDF_LANGSTRING = RDF + 'langString';
const XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string';

/**
 * @param data - a filePath, HTML string or URL
 */

export default function jsonldRdfaParser(data, callback) {
  function process(node) {
    let opts;
    if (!node.baseURI || node.baseURI === 'about:blank') {
      opts = { baseURI: 'http://localhost/' };
    }

    let dataset, processingError;
    try {
      let graph = getRDFaGraph(node, opts);
      dataset = processGraph(graph);
    } catch (e) {
      processingError = e;
    }
    callback(processingError, dataset);
  }

  if (typeof data === 'object' && 'nodeType' in data) {
    process(data);
  } else if (typeof data === 'string') {
    if (isUrl(data)) {
      JSDOM.fromURL(data)
        .then(dom => {
          process(dom.window.document);
        })
        .catch(callback);
    } else if (/<[a-z][\s\S]*>/i.test(data)) {
      process(new JSDOM(data).window.document);
    } else {
      JSDOM.fromFile(data)
        .then(dom => {
          process(dom.window.document);
        })
        .catch(callback);
    }
  } else {
    return callback(
      new Error('data must be a file path, HTML string, URL or a DOM element')
    );
  }
}

/**
 * This function is mostly taken from the jsonld.js lib but updated to
 * the latest green-turtle API, and for support for HTML
 */
function processGraph(data) {
  let dataset = {
    '@default': []
  };

  let subjects = data.subjects,
    htmlMapper = n => {
      let div = n.ownerDocument.createElement('div');
      div.appendChild(n.cloneNode(true));
      return div.innerHTML;
    };

  Object.keys(subjects).forEach(subject => {
    let predicates = subjects[subject].predicates;
    Object.keys(predicates).forEach(predicate => {
      // iterate over objects
      let objects = predicates[predicate].objects;
      for (let oi = 0; oi < objects.length; ++oi) {
        let object = objects[oi];

        // create RDF triple
        let triple = {};

        // add subject & predicate
        triple.subject = {
          type: subject.indexOf('_:') === 0 ? 'blank node' : 'IRI',
          value: subject
        };
        triple.predicate = {
          type: predicate.indexOf('_:') === 0 ? 'blank node' : 'IRI',
          value: predicate
        };
        triple.object = {};

        // serialize XML literal
        let value = object.value;
        // !!! TODO: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // The below actually most likely does NOT work.
        // In most usage contexts this will be an HTML DOM, passing it to xmldom's XMLSerializer
        // will cause it to call .toString() on all the nodes it finds — this only works inside
        // xmldom.
        if (object.type === RDF_XML_LITERAL) {
          // initialize XMLSerializer
          let serializer = new XMLSerializer();
          value = Array.from(object.value)
            .map(n => serializer.serializeToString(n))
            .join('');
          triple.object.datatype = RDF_XML_LITERAL;
        }
        // serialise HTML literal
        else if (object.type === RDF_HTML_LITERAL) {
          value = Array.from(object.value)
            .map(htmlMapper)
            .join('');
          triple.object.datatype = RDF_HTML_LITERAL;
        }
        // object is an IRI
        else if (object.type === RDF_OBJECT) {
          if (object.value.indexOf('_:') === 0)
            triple.object.type = 'blank node';
          else triple.object.type = 'IRI';
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
    });
  });

  return dataset;
}
