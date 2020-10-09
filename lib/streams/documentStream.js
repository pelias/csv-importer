'use strict';

const through = require( 'through2' );

const peliasModel = require( 'pelias-model' );
const NAME_REGEX = /^name(_json)?_([a-z]{2})$/i;

function getPopularity(record) {
  const popularityString = getCaseInsensitive('popularity', record);
  const popularity = parseInt(popularityString);
  if (popularityString && (isNaN(popularity) || !/^\d+$/.test(popularityString))) {
    throw new Error("Popularity must be an int, got " + popularityString)
  } else {
    return popularity;
  }
}

function getPostalCode(record) {
  return getCaseInsensitive('zipcode', record)
    || getCaseInsensitive('postcode', record)
    || getCaseInsensitive('postalcode', record);
}

function _getByStringOrJson(prefix) {
  return (record, suffix = '') => {
    let result = []
    const value = getCaseInsensitive(`${prefix}${suffix}`, record);
    if (value && typeof value === 'string') {
      result.push(value.trim());
    }
    const value_json = getCaseInsensitiveAsJSON(`${prefix}_json${suffix}`, record);
    if (value_json && value_json instanceof Array) {
      result = result.concat(value_json);
    }

    return result;
  }
}

const getNames = _getByStringOrJson('name');
const getCategories = _getByStringOrJson('category');

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

function getCaseInsensitiveAsJSON(field, record) {
  const value = getCaseInsensitive(field, record);
  if (value && typeof value === 'string') {
    return JSON.parse(value);
  }
  return value;
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

function getMultiLangNames(record) {
  const result = { default: record };

  Object.keys(record)
    .filter(field => /^name_/i.test(field))
    .forEach(field => {
      const value = NAME_REGEX.exec(field)
      const isJson = value && value[1];
      let lang = value && value[2];
      if (lang && typeof lang === 'string') {
        lang = lang.toLowerCase();
        result[lang] = result[lang] || {};
        if (isJson && typeof isJson === 'string') {
          result[lang][`name_json_${lang}`] = record[field];
        } else {
          result[lang][`name_${lang}`] = record[field];
        }
      }
    })

  return Object.entries(result);
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

    getMultiLangNames(record).forEach(([lang, value]) => {
      const names = getNames(value, lang === 'default' ? '' : `_${lang}`);
      if (names && names.length > 0) {
        pelias_document.setName(lang, names[0]);
        for (let i = 1; i < names.length; i++) {
          pelias_document.setNameAlias(lang, names[i]);
        }
      }
    })

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

    const popularity = getPopularity(record);
    if (popularity) {
      pelias_document.setPopularity(popularity);
    }

    const addendumFields = getPrefixedFields('addendum_json_', record);
    Object.keys(addendumFields).forEach(function(namespace) {
      if (addendumFields[namespace]) {
        pelias_document.setAddendum(namespace, JSON.parse(addendumFields[namespace]));
      }
    });

    getCategories(record)
      .forEach(category => pelias_document.addCategory(category));

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
