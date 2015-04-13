"use strict";

var express = require('express');

module.exports = exports = new express.Router();

require('./product');
require('./category');
require('./site');
