'use strict'

var keys = require('../_internal/keys')
var scales = require('./scales.json')
var aliases = require('./scale-aliases.json')

/**
 * @name names
 * @module scale
 *
 * Get the known scale names
 *
 * @return {Array} array with all the known names
 *
 * @example
 * names() => ['major', 'minor', ....]
 */
module.exports = keys(scales, aliases)