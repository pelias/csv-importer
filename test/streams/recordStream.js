var fs = require('fs');

var tape = require( 'tape' );
var temp = require( 'temp' ).track();
var through = require( 'through2' );

var peliasModel = require( 'pelias-model' );

var recordStream = require( '../../lib/streams/recordStream' );

// TODO: remove this when we remove support for Node.js 6
function getValues(object) {
  var keys = Object.keys(object);
  var values = [];

  for (var i = 0; i < keys.length; i++) {
    values.push(object[keys[i]]);
  }

  return values;
}

/*
 * Helper function to create and use a recordStream object and CSV input file for testing
 */
function testRecordStream(test, input, expected) {
  temp.open('csv-importer-test', function(err, info) {
    // generate a custom CSV and write it to a file
    const header_row = Object.keys(input).join(',') + "\n";
    const data_row = getValues(input) + "\n";
    fs.writeSync(info.fd, header_row);
    fs.writeSync(info.fd, data_row);

    // close temporary file and create a test stream with it
    fs.close(info.fd, function(err) {
      const dataStream = recordStream.create([info.path]);
      test.ok( dataStream.readable, 'Stream is readable.' );

      var testStream = through.obj(function ( data, enc, next ){
        //within this stream, test all the expected properties
        test.equal(data.getName('default'), expected.name, 'Name matches');
        test.deepEqual(data.getNameAliases('default'), expected.name_aliases || [], 'Name aliases matches');
        test.equal(data.getSource(), expected.source, 'source matches');
        test.equal(data.getLayer(), expected.layer, 'layer matches');

        const centroid = data.getCentroid();
        test.ok( expected.lon - centroid.lon < 1e-6, 'Longitude matches' );
        test.ok( expected.lat - centroid.lat < 1e-6, 'Latitude matches' );

        if (expected.street) {
          test.equal(data.getAddress('street'), expected.street, 'Street matches');
        }

        if (expected.number) {
          test.equal(data.getAddress('number'), expected.number, 'Housenumber matches');
        }

        Object.keys(expected)
          .filter(key => /$name_[a-z]{2}$/.test(key))
          .forEach(key => {
            const lang = key.slice(5).toLowerCase();
            test.equal(data.getName(lang), expected[key], `Name ${lang} matches`);
            test.deepEqual(data.getNameAliases(lang), expected[`name_aliases_${lang}`], `Name aliases ${lang} matches`);
          })

        test.deepEqual(data.category, expected.category || [], 'Categories matches');

        next();
      });

      dataStream.pipe(testStream)
        .on('finish', () => temp.cleanupSync());
    });

  });
}

/**
 * Test the full recordStream pipeline from input CSV to output pelias-model
 */
tape(
  'importPipelines.createRecordStream() creates Document objects with expected values.',
  function ( test ){

    // standard record
    testRecordStream(test, { lat: 5, lon:3, name: 'foo' },
      { name: 'foo', source: 'csv', lat: 5, lon: 3, layer: 'venue' });

    // spaces trimmed from name
    testRecordStream(test, { lat: 5, lon:3, name: '    foo', source: 'bar' },
      { name: 'foo', source: 'bar', lat: 5, lon: 3, layer: 'venue' });

    // LAT accepted
    testRecordStream(test, { LAT: 5, lon:3, name: 'foo', source: 'bar' },
      { name: 'foo', source: 'bar', lat: 5, lon: 3, layer: 'venue' });

    // LON accepted
    testRecordStream(test, { lat: 5, LON:3, name: 'foo', source: 'bar' },
      { name: 'foo', source: 'bar', lat: 5, lon: 3, layer: 'venue' });

    // layer is used over default
    testRecordStream(test, { lat: 5, lon:3, name: 'foo', layer: 'custom-layer' },
      { name: 'foo', source: 'csv', lat: 5, lon: 3, layer: 'custom-layer' });

    // street only is ok
    testRecordStream(test, { street: 'Main St', lat: 5, lon:3},
      {street: 'Main St', source: 'csv', layer: 'venue', lat: 5, lon: 3, layer: 'venue' });

    // street and housenumber is ok
    testRecordStream(test, { number: 101, street: 'Main St', lat: 5, lon:3},
      {number: '101', street: 'Main St', source: 'csv', layer: 'venue', lat: 5, lon: 3, layer: 'venue' });

    // housenumber also accepted instead of "number"
    testRecordStream(test, { housenumber: 101, street: 'Main St', lat: 5, lon:3},
      {number: '101', street: 'Main St', source: 'csv', layer: 'venue', lat: 5, lon: 3, layer: 'venue' });

    // all caps number accepted as housenumber (OpenAddresses style)
    testRecordStream(test, { NUMBER: 101, street: 'Main St', lat: 5, lon:3},
      {number: '101', street: 'Main St', source: 'csv', layer: 'venue', lat: 5, lon: 3, layer: 'venue' });

    // supports for alt names
    testRecordStream(test, { name_json: '"[""foo"", ""bar""]"', lat: 5, lon:3},
      { name: 'foo', name_aliases: ['bar'], source: 'csv', layer: 'venue', lat: 5, lon: 3 });

    // supports for both name and aliases
    testRecordStream(test, { name: 'foo', NAME_JSON: '"[""bar"", ""baz""]"', lat: 5, lon:3},
      { name: 'foo',  name_aliases: ['bar', 'baz'], source: 'csv', layer: 'venue', lat: 5, lon: 3 });

    // supports for multi-lang
    testRecordStream(test, { name: 'foo', name_fr: 'bar', lat: 5, lon:3},
      { name: 'foo', name_fr: 'bar', source: 'csv', layer: 'venue', lat: 5, lon: 3 });

    // supports for multi-lang and aliases
    testRecordStream(test, { name: 'foo', NAME_FR: 'bar', NAME_JSON_FR: '"[""baz""]"', lat: 5, lon:3},
      { name: 'foo', name_fr: 'bar',  name_aliases_fr: ['baz'], source: 'csv', layer: 'venue', lat: 5, lon: 3 });

    // supports for categories
    testRecordStream(test, { name: 'foo', category: 'bar', category_json: '"[""baz""]"', lat: 5, lon:3},
      { name: 'foo', category: ['bar', 'baz'], source: 'csv', layer: 'venue', lat: 5, lon: 3 });

    // the end
    test.end();
  }
);

tape( 'getIdPrefix returns prefix based on irectory structure', function( test ) {
  var filename = '/base/path/us/ca/san_francisco.csv';
  var basePath = '/base/path';

  var actual = recordStream.getIdPrefix(filename, basePath);

  var expected = 'us/ca/san_francisco';
  test.equal(actual, expected, 'correct prefix generated');
  test.end();
});

tape( 'getIdPrefix handles multiple levels of heirarchy', function ( test ) {
  var filename = '/base/path/cz/countrywide.csv';
  var basePath = '/base/path';

  var actual = recordStream.getIdPrefix(filename, basePath);

  var expected = 'cz/countrywide';
  test.equal(actual, expected, 'correct prefix generated');
  test.end();
});

tape( 'getIdPrefix returns basename without extension when invalid basepath given', function( test ) {
  var filename = '/path/to/a/document.csv';
  var basePath = '/somewhere/else';

  var actual = recordStream.getIdPrefix(filename, basePath);
  var expected = 'document';

  test.equal(actual, expected);
  test.end();
});
