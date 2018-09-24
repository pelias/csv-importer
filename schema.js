'use strict';

const Joi = require('joi');

// Schema Configuration
// datapath: string (required)
// files: array of strings
// deduplicate: boolean
// adminLookup: boolean
module.exports = Joi.object().keys({
  imports: Joi.object().keys({
    csv: Joi.object().keys({
      files: Joi.array().items(Joi.string()),
      datapath: Joi.string(),
      deduplicate: Joi.boolean(),
      adminLookup: Joi.boolean()
    }).requiredKeys('datapath').unknown(false)
  }).requiredKeys('csv').unknown(true)
}).requiredKeys('imports').unknown(true);
