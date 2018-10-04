const child_process = require('child_process');
const url = require('url');
const path = require('path');
const async = require('async');
const fs = require('fs-extra');
const tmp = require('tmp');
const logger = require('pelias-logger').get('csv-download');
const config = require('pelias-config').generate();

function getFilenameFromURL(download_url) {
  const parsed_url = url.parse(download_url);
  return path.basename(parsed_url.pathname);
}

// handle files that do not appear to be compressed in any way
function downloadStandard(targetDir, download_url, callback) {
  const filename = getFilenameFromURL(download_url);
  const download_path = path.join(targetDir, filename);

  logger.info(`Downloading ${download_url} to ${download_path}`);

  const cmd =`curl -L -X GET -o ${download_path} ${download_url}`;
  logger.debug(cmd);
  child_process.exec(cmd, callback);
}

const targetDir = config.get('imports.csv.datapath');
const files = config.get('imports.csv.download');

if (!files) {
  logger.warn('No files to download, quitting');
}

if (!targetDir) {
  logger.warn('Datapath for saving files not configured, quitting');
}

logger.info(`Attempting to download selected data files: ${files}`);


fs.mkdirpSync(targetDir);

async.eachLimit(files, 5, downloadStandard.bind(null, targetDir), function() {
  logger.info('all done');
});
