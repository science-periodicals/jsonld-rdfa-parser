# jsonld-rdfa-parser

A custom RDFa parser (based on
[green-turtle](https://github.com/alexmilowski/green-turtle)) to be
registered with jsonld.js registerRDFParser method.

```
import jsonldRdfaParser from jsonld-rdfa-parser;
import jsonld from 'jsonld';

// register the parser under the string `format`
jsonld.registerRDFParser(format, jsonldCustomRdfaParser);

// specify the format
jsonld.fromRDF('test.html', {format: format}, function(err, data) {

});
```

See test for a full example.

Note the interesting code of this library is mostly taken from the
[jsonld.js](https://github.com/digitalbazaar/jsonld.js) library but
updated to the latest
[green-turtle](https://github.com/alexmilowski/green-turtle))
API. Credits are due to the original authors.
