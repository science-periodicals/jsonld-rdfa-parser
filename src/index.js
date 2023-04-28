import getRDFaGraph from 'graph-rdfa-processor';
import { JSDOM } from 'jsdom'; // see ./browser/jsdom.js for browser version
import { XMLSerializer } from 'xmldom'; // see ./browser/xmldom.js for browser version
import isUrl from 'is-url';
import dataFactory from '@rdfjs/data-model';
import datasetFactory from '@rdfjs/dataset';

const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const RDF_XML_LITERAL = RDF + 'XMLLiteral';
const RDF_HTML_LITERAL = RDF + 'HTML';
const RDF_OBJECT = RDF + 'object';
const RDF_PLAIN_LITERAL = RDF + 'PlainLiteral';
const XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string';

/**
 * @param data - a filePath, HTML string or URL
 */

export default async function jsonldRdfaParser(data) {
  function process(node) {
    let opts;
    if (!node.baseURI || node.baseURI === 'about:blank') {
      opts = { baseURI: 'http://localhost/' };
    }

    let dataset;
    try {
      let graph = getRDFaGraph(node, opts);
      dataset = processGraph(graph);
    } catch (e) {
      throw e;
    }
    return dataset;
  }

  if (typeof data === 'object' && 'nodeType' in data) {
    return process(data);
  } else if (typeof data === 'string') {
    if (isUrl(data)) {
      let dom = await JSDOM.fromURL(data);
      return process(dom.window.document);
    } else if (/<[a-z][\s\S]*>/i.test(data)) {
      return process(new JSDOM(data).window.document);
    } else {
      let dom = await JSDOM.fromFile(data);
      return process(dom.window.document);
    }
  } else {
    throw new Error(
      'data must be a file path, HTML string, URL or a DOM element'
    );
  }
}

/**
 * This function is mostly taken from the jsonld.js lib but updated to
 * the latest green-turtle API, and for support for HTML
 */
function processGraph(data) {
  let quads = [];

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
        if (subject.indexOf('_:')) {
          triple.subject = dataFactory.blankNode(subject);
        } else {
          triple.subject = dataFactory.namedNode(subject);
        }

        if (predicate.indexOf('_:')) {
          triple.predicate = dataFactory.blankNode(predicate);
        } else {
          triple.predicate = dataFactory.namedNode(predicate);
        }

        triple.object = null;

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
          triple.object = dataFactory.literal(
            value,
            dataFactory.namedNode(RDF_XML_LITERAL)
          );
        }
        // serialise HTML literal
        else if (object.type === RDF_HTML_LITERAL) {
          value = Array.from(object.value)
            .map(htmlMapper)
            .join('');
          triple.object = dataFactory.literal(
            value,
            dataFactory.namedNode(RDF_HTML_LITERAL)
          );
        }
        // object is an IRI
        else if (object.type === RDF_OBJECT) {
          if (object.value.indexOf('_:') === 0) {
            triple.object = dataFactory.blankNode(value);
          } else {
            triple.object = dataFactory.namedNode(value);
          }
        } else {
          // object is a literal
          if (object.type === RDF_PLAIN_LITERAL) {
            if (object.language) {
              triple.object = dataFactory.literal(value, object.language);
            } else {
              triple.object = dataFactory.literal(
                value,
                dataFactory.namedNode(XSD_STRING)
              );
            }
          } else {
            triple.object = dataFactory.literal(
              value,
              dataFactory.namedNode(object.type)
            );
          }
        }

        // add triple to dataset in default graph
        quads.push(
          dataFactory.quad(
            triple.subject,
            triple.predicate,
            triple.object,
            dataFactory.defaultGraph()
          )
        );
      }
    });
  });

  return datasetFactory.dataset(quads);
}
