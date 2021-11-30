const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const csvParse = require('csv-parse').parse;
const combinedStream = require('combined-stream');
const logger = require('pelias-logger').get('csv-importer');
const DocumentStream = require('./documentStream');

/*
 * Construct a suitable id prefix for a CSV file given
 * its full filename and the base data directory.
 */
function getIdPrefix(filename, dirPath) {
  if (filename && dirPath) {
    // if the file is within the dir path, use the structure
    // of the directory tree to create the id
    if (filename.indexOf(dirPath) !== -1) {
      var subpath = _.replace(filename, dirPath, '');
      var prefix = _.replace(subpath, '.csv', '');
      return _.trim(prefix, '/');
    }
  }

  // if the dirPath doesn't contain this file, return the basename without extension
  return path.basename(filename, '.csv');
}

/**
 * Create a stream of Documents from a CSV file.
 *
 * @param {string} filePath The path of a CSV file.
 * @return {stream.Readable} A stream of `Document` objects, one
 *    for every valid record inside the file.
 */
function createRecordStream( filePath, dirPath ){
  /**
   * A stream to convert rows of a CSV to Document objects.
   */
  var stats = {
    badRecordCount: 0,
    goodRecordCount: 0
  };

  var csvParser = csvParse({
    trim: true,
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax: true,
    columns: true
  });

  var idPrefix = getIdPrefix(filePath, dirPath);
  var documentStream = DocumentStream.create(idPrefix, stats);

  return fs.createReadStream( filePath )
    .pipe( csvParser )
    .pipe( documentStream )
    .on('finish', () => {
      logger.info(`Finished import from ${filePath}, goodRecordCount=${stats.goodRecordCount} badRecordCount=${stats.badRecordCount}`)
    })
}

/*
 * Create a single stream from many CSV files
 */
function createFullRecordStream(files, dirPath) {
  var recordStream = combinedStream.create();

  files.forEach( function forEach( filePath ){
    recordStream.append( function ( next ){
      logger.info( 'Creating read stream for: ' + filePath );
      next(createRecordStream( filePath, dirPath ) );
    });
  });

  return recordStream;
}

module.exports = {
  getIdPrefix: getIdPrefix,
  create: createFullRecordStream
};
