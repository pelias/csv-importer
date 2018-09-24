'use strict';

const through = require( 'through2' );

const peliasModel = require( 'pelias-model' );

function getPostalCode(record) {
  return getCaseInsensitive('zipcode', record) || getCaseInsensitive('postcode', record);
}

function getName(record) {
  if (record.name && typeof record.name === 'string') {
    return record.name.trim();
  }
}

function getLayer(record) {
  return record.layer || 'venue';
}

function getSource(record) {
  return record.source || 'csv';
}

function getHousenumber(record) {
  return getCaseInsensitive('housenumber', record) || getCaseInsensitive('number', record);
}

function getStreet(record) {
  return getCaseInsensitive('street', record);
}

function getCaseInsensitive(field, record) {
  if (typeof field !== 'string') {
    return;
  }
  const lower = field.toLowerCase();
  const upper = field.toUpperCase();

  return record[lower] || record[upper];
}

function getCentroid(record) {
  const lat = getCaseInsensitive('lat', record);
  const lon = getCaseInsensitive('lon', record);

  if (lat && lon) {
    return { lat: lat, lon: lon };
  }
}

function processRecord(record, next_uid, stats) {
  const id_number = record.HASH || next_uid;
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
    }

    const street = getStreet(record);
    if (street) {
      pelias_document.setAddress('street', street);
    }

    const housenumber = getHousenumber(record);
    if (housenumber) {
      pelias_document.setAddress('number', housenumber);
    }


    const postcode = getPostalCode(record);
    if (postcode) {
      pelias_document.setAddress('zip', postcode);
    }

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
