const Joi = require('@hapi/joi');

// Schema Configuration
// datapath: string (required)
// files: array of strings
// deduplicate: boolean
// adminLookup: boolean
module.exports = Joi.object().keys({
  imports: Joi.object().required().keys({
    csv: Joi.object().required().keys({
      files: Joi.array().items(Joi.string()),
      datapath: Joi.string(),
      download: Joi.array(),
      deduplicate: Joi.boolean(),
      adminLookup: Joi.boolean()
    })
  }).unknown(true)
}).unknown(true);
