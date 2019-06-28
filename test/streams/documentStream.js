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
