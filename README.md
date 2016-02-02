# jsonld-rdfa-parser

A custom RDFa parser (based on
[graph-rdfa-processor](https://github.com/scienceai/graph-rdfa-processor)) to be
registered with jsonld.js `registerRDFParser` method.

The custom RDFa parser must be register with
[jsonld.js](https://github.com/digitalbazaar/jsonld.js). Once
registered, `jsonld.fromRDF` can be used and take for input either a
file path, a URL, a HTML string or a DOM element.


```js
import jsonldRdfaParser from 'jsonld-rdfa-parser';
import jsonld from 'jsonld';

// register the parser for content type text/html
jsonld.registerRDFParser('text/html', jsonldRdfaParser);

// use it
jsonld.fromRDF('test.html', {format: 'text/html'}, function(err, data) {

});
```

See tests for more examples.

Note the interesting code of this library is mostly taken from the
[jsonld.js](https://github.com/digitalbazaar/jsonld.js) library but
updated to the latest graph-rdfa-processor API. Credits are due to the
original authors.
