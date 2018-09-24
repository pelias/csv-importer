'use strict';

const through = require( 'through2' );

const peliasModel = require( 'pelias-model' );


function getPostalCode(record) {
  return record.zipcode || record.POSTCODE || record.postcode;
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
  return record.housenumber || record.number || record.NUMBER;
}

function getStreet(record) {
  return record.street || record.STREET;
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
      const id_number = record.HASH || uid;
      const model_id = `${id_number}`;
      uid++;

      try {
        const layer = getLayer(record);
        const source = getSource(record);

        const addrDoc = new peliasModel.Document( source, layer, model_id );

        if (getName(record)) {
          addrDoc.setName('default', getName(record));
        }

        addrDoc.setCentroid( { lon: record.LON, lat: record.LAT } );

        const housenumber = getHousenumber(record);
        if (housenumber) {
          addrDoc.setAddress('number', housenumber);
        }

        const street = getStreet(record);
        if (street) {
          addrDoc.setAddress('street', street);
        }

        const postcode = getPostalCode(record);
        if (postcode) {
          addrDoc.setAddress('zip', postcode);
        }

        this.push( addrDoc );
      }
      catch ( ex ){
        stats.badRecordCount++;
      }

      next();
    }
  );
}

module.exports = {
  create: createDocumentStream
};
