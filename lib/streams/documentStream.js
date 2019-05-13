'use strict';

const through = require( 'through2' );

const peliasModel = require( 'pelias-model' );

function getPostalCode(record) {
  return getCaseInsensitive('zipcode', record) || getCaseInsensitive('postcode', record);
}

function getName(record) {
  const name = getCaseInsensitive('name', record);
  if (name && typeof name === 'string') {
    return name.trim();
  }
}

function getLayer(record) {
  return getCaseInsensitive('layer', record) || getCaseInsensitive('layer_id', record) || 'venue';
}

function getSource(record) {
  return getCaseInsensitive('source', record) || 'csv';
}

function getHousenumber(record) {
  return getCaseInsensitive('housenumber', record) || getCaseInsensitive('number', record);
}

function getStreet(record) {
  return getCaseInsensitive('street', record);
}

function getCrossStreet(record) {
  return getCaseInsensitive('cross_street', record);
}

function getCaseInsensitive(field, record) {
  if (typeof field !== 'string') {
    return;
  }
  const lower = field.toLowerCase();
  const upper = field.toUpperCase();

  return record[lower] || record[upper];
}

function getPrefixedFields(prefix, record) {
  let result = {};

  Object.keys(record).forEach(function(field) {
    if (field.startsWith(prefix)) {
      const newKey = field.replace(prefix, '');
      result[newKey] = record[field];
    }
  });

  return result;
}

function getCentroid(record) {
  const lat = getCaseInsensitive('lat', record);
  const lon = getCaseInsensitive('lon', record);

  if (lat && lon) {
    return { lat: lat, lon: lon };
  }
}

function processRecord(record, next_uid, stats) {
  const id_number = getCaseInsensitive('id', record) || getCaseInsensitive('hash', record) || next_uid;
  const model_id = `${id_number}`;

  try {
    const layer = getLayer(record);
    const source = getSource(record);

    const pelias_document = new peliasModel.Document( source, layer, model_id );

    if (getName(record)) {
      pelias_document.setName('default', getName(record));
    }

    const centroid = getCentroid(record);
    if (centroid) {
      pelias_document.setCentroid( centroid );
    } else {
      throw 'Invalid centroid'; //centroid is required
    }

    const street = getStreet(record);
    if (street) {
      pelias_document.setAddress('street', street);
    }

    const cross_street = getCrossStreet(record)
    if (cross_street) {
      pelias_document.setAddress('cross_street', cross_street);
    }

    const housenumber = getHousenumber(record);
    if (housenumber) {
      pelias_document.setAddress('number', housenumber);
    }


    const postcode = getPostalCode(record);
    if (postcode) {
      pelias_document.setAddress('zip', postcode);
    }

    const addendumFields = getPrefixedFields('addendum_json_', record);
    Object.keys(addendumFields).forEach(function(namespace) {
      pelias_document.setAddendum(namespace, JSON.parse(addendumFields[namespace]));
    });

    return pelias_document;
  } catch ( ex ){
    stats.badRecordCount++;
  }
}

/*
 * Create a stream of Documents from valid, cleaned CSV records
 */
function createDocumentStream(id_prefix, stats) {
  /**
   * Used to track the UID of individual records passing through the stream if
   * there is no HASH that can be used as a more unique identifier.  See
   * `peliasModel.Document.setId()` for information about UIDs.
   */
  let uid = 0;

  return through.obj(
    function write( record, enc, next ){
      const pelias_document = processRecord(record, uid, stats);
      uid++;

      if (pelias_document) {
        this.push( pelias_document );
      }

      next();
    }
  );
}

module.exports = {
  create: createDocumentStream
};
