const logger = require('pelias-logger').get( 'csv-importer');
const recordStream = require('./streams/recordStream');
const model = require('pelias-model');
const peliasDbclient = require('pelias-dbclient');
const blacklistStream = require('pelias-blacklist-stream');
const adminLookup = require('pelias-wof-admin-lookup');

function createFullImportPipeline( files, dirPath, importerName ){
  logger.info( 'Importing %s files.', files.length );

  recordStream.create(files, dirPath)
    .pipe(blacklistStream())
    .pipe(adminLookup.create())
    .pipe(model.createDocumentMapperStream())
    .pipe(peliasDbclient({name: importerName}));
}

module.exports = {
  create: createFullImportPipeline
};
