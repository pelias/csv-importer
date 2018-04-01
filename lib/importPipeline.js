var logger = require( 'pelias-logger' ).get( 'openaddresses' );
var recordStream = require('./streams/recordStream');
var model = require( 'pelias-model' );
var peliasDbclient = require( 'pelias-dbclient' );

function createFullImportPipeline( files, dirPath, finalStream ){
  logger.info( 'Importing %s files.', files.length );

  finalStream = finalStream || peliasDbclient();

  recordStream.create(files, dirPath)
    .pipe(model.createDocumentMapperStream())
    .pipe(finalStream);
}

module.exports = {
  create: createFullImportPipeline
};
