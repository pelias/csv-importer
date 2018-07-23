'use strict';

const through = require( 'through2' );

const peliasModel = require( 'pelias-model' );

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
        const layer = record.layer.split(' ')[0].split(',')[0].toLowerCase();
        const source = record.source || 'csv';

        const addrDoc = new peliasModel.Document( source, layer, model_id )
        .setName( 'default', record.name )
        .setCentroid( { lon: record.LON, lat: record.LAT } );

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
