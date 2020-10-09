'use strict';

const tape = require( 'tape' );
const stream_mock = require('stream-mock');
const DocumentStream = require( '../../lib/streams/documentStream' );

function test_stream(input, testedStream, callback) {
  const reader = new stream_mock.ObjectReadableMock(input);
  const writer = new stream_mock.ObjectWritableMock();
  writer.on('error', (e) => callback(e));
  writer.on('finish', () => callback(null, writer.data));
  reader.pipe(testedStream).pipe(writer);
}

tape( 'documentStream catches records with no street', function(test) {
  const input = {
    NUMBER: 5
  };
  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 0, 'no documents should be pushed' );
    test.equal(stats.badRecordCount, 1, 'bad record count updated');
    test.end();
  });
});

tape( 'documentStream catches records with no lat', function(test) {
  const input = {
    name: 'foo',
    LON: 7
  };
  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 0, 'no documents should be pushed' );
    test.equal(stats.badRecordCount, 1, 'bad record count updated');
    test.end();
  });
});

tape( 'documentStream catches records with no lon', function(test) {
  const input = {
    name: 'foo',
    LAT: 7
  };
  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 0, 'no documents should be pushed' );
    test.equal(stats.badRecordCount, 1, 'bad record count updated');
    test.end();
  });
});

tape( 'documentStream does not set zipcode if zipcode is emptystring', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    POSTCODE: ''
  };
  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.equal(actual[0].getAddress('zip', undefined));
    test.end();
  });
});

tape( 'documentStream accepts zipcode instead of POSTCODE', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    zipcode: '10010'
  };
  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.equal(actual[0].getAddress('zip'), '10010');
    test.end();
  });
});

tape( 'documentStream accepts postalcode instead of POSTCODE', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    postalcode: '10010'
  };
  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.equal(actual[0].getAddress('zip'), '10010');
    test.end();
  });
});

tape('documentStream uses id value over hash if present', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    id: 'desired-id',
    HASH: 'abcd'
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual[0].getId(), 'desired-id', 'id should be correct');
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.end();
  });
});

tape('documentStream uses HASH value if present', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    HASH: 'abcd'
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.end();
  });
});

tape('documentStream uses NAME value if present', function(test) {
  const input = {
    NAME: 'thename',
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.equal(actual[0].getName('default'), 'thename', 'name set correctly');
    test.end();
  });
});

tape('documentStream uses name value if present (over NAME)', function(test) {
  const input = {
    name: 'name',
    NAME: 'not-used',
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.equal(actual[0].getName('default'), 'name', 'name set correctly');
    test.end();
  });
});

tape('documentStream uses source value if present (over SOURCE)', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    source: 'desired-source',
    SOURCE: 'wrong'
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual[0].getSource(), 'desired-source', 'source set correctly');
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.end();
  });
});

tape('documentStream uses SOURCE value if present (and source not present)', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    SOURCE: 'desired-source'
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual[0].getSource(), 'desired-source', 'source set correctly');
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.end();
  });
});

tape('documentStream uses layer_id value if present', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    HASH: 'abcd',
    layer_id: 'desired-layer'
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual[0].getLayer(), 'desired-layer', 'layer set correctly');
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.end();
  });
});

tape('documentStream parses JSON from addendum_json_* field', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    HASH: 'abcd',
    layer_id: 'desired-layer',
    addendum_json_custom_field: '{ "foo": "bar"}'
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);


  test_stream([input], documentStream, function(err, actual) {
    console.log(JSON.stringify(actual, null, 2));
    test.deepEquals(actual[0].getAddendum('custom_field'), { foo: 'bar' }, 'custom data is added to record');
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.end();
  });
});

tape('documentStream parses empty JSON from addendum_json_* field', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    HASH: 'abcd',
    layer_id: 'desired-layer',
    addendum_json_custom_field: ''
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);


  test_stream([input], documentStream, function(err, actual) {
    console.log(JSON.stringify(actual, null, 2));
    test.deepEquals(actual[0].getAddendum('custom_field'), undefined, 'undefined custom data is added to record');
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.end();
  });
});


tape('documentStream parses undefined JSON from addendum_json_* field', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    HASH: 'abcd',
    layer_id: 'desired-layer',
    addendum_json_custom_field: undefined
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);


  test_stream([input], documentStream, function(err, actual) {
    console.log(JSON.stringify(actual, null, 2));
    test.deepEquals(actual[0].getAddendum('custom_field'), undefined, 'undefined custom data is added to record');
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.end();
  });
});

tape('documentStream does not parse corrupt JSON from addendum_json_* field', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    HASH: 'abcd',
    layer_id: 'desired-layer',
    addendum_json_custom_field: '{ "foo": "bar'
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    // console.log(JSON.stringify(actual, null, 2));
    test.equal(actual.length, 0, 'the document should not be pushed' );
    test.equal(stats.badRecordCount, 1, 'bad record count 1');
    test.end();
  });
});

tape('documentStream parses JSON from name_json_* field', function(test) {
  const input = {
    LAT: 5,
    LON: 6,
    HASH: 'abcd',
    layer_id: 'desired-layer',
    name_json_fr: '["bar", "baz"]',
    name_json: '["foo"]'
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.deepEquals(actual[0].getName('default'), 'foo', 'default name is added to record');
    test.deepEquals(actual[0].getName('fr'), 'bar', 'fr name is added to record');
    test.deepEquals(actual[0].getNameAliases('fr'), ['baz'], 'fr name is added to record');
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.end();
  });
});

tape('documentStream ignores empty JSON from name_json_* field', function(test) {
  const input = {
    LAT: 5,
    LON: 6,
    HASH: 'abcd',
    layer_id: 'desired-layer',
    name_json_fr: '',
    name_json: '',
    name: 'foo',
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.deepEquals(actual[0].getName('default'), 'foo', 'default name is added to record');
    test.deepEquals(actual[0].getName('fr'), undefined, 'fr name is not added to record');
    test.deepEquals(actual[0].getNameAliases('fr'), [], 'fr name aliases are not added to record');
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.end();
  });
});

tape('documentStream fails on bad JSON from name_json_* field', function(test) {
  const input = {
    LAT: 5,
    LON: 6,
    HASH: 'abcd',
    layer_id: 'desired-layer',
    name_json_fr: '["bar", "b',
    name_json: '["foo"]'
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 0, 'the document should not be pushed' );
    test.equal(stats.badRecordCount, 1, 'bad record count unchanged');
    test.end();
  });
});

tape('documentStream parses JSON from category_json field', function(test) {
  const input = {
    LAT: 5,
    LON: 6,
    HASH: 'abcd',
    layer_id: 'desired-layer',
    name: 'foo',
    category: 'bar',
    category_json: '["baz"]'
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.deepEquals(actual[0].getName('default'), 'foo', 'default name is added to record');
    test.deepEquals(actual[0].category, ['bar', 'baz'], 'default name is added to record');
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.end();
  });
});

tape('documentStream ignores empty JSON from category_json field', function(test) {
  const input = {
    LAT: 5,
    LON: 6,
    HASH: 'abcd',
    layer_id: 'desired-layer',
    name: 'foo',
    category: 'bar',
    category_json: ''
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.deepEquals(actual[0].getName('default'), 'foo', 'default name is added to record');
    test.deepEquals(actual[0].category, ['bar'], 'category is added to record, empty category_json ignored');
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.end();
  });
});

tape('documentStream ignores undefined JSON from category_json field', function(test) {
  const input = {
    LAT: 5,
    LON: 6,
    HASH: 'abcd',
    layer_id: 'desired-layer',
    name: 'foo',
    category: 'bar',
    category_json: undefined
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.deepEquals(actual[0].getName('default'), 'foo', 'default name is added to record');
    test.deepEquals(actual[0].category, ['bar'], 'category is added to record, empty category_json ignored');
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.end();
  });
});

tape( 'documentStream accepts popularity', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    postalcode: '10010',
    popularity: '5000'
  };
  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.equal(actual[0].getPopularity(), 5000);
    test.end();
  });
});


tape( 'documentStream rejects invalid popularity', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    postalcode: '10010',
    popularity: '500a0'
  };
  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 0, 'the document should be skipped' );
    test.equal(stats.badRecordCount, 1, 'bad record count went up by 1');
    test.end();
  });
});