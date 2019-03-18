'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

const pluginName = 'mini-app-webpack-plugin',
  path = require('path'),
  exists = require('fs').existsSync,
  parseEntry = require('./lib/parseEntry');

function getEntry({
                            entry = './src/app.json',
                            cssSuffix = 'css',
                            xmlSuffix = 'html'
                          } = {}) {
  const entryFile = path.resolve(process.cwd(), entry);
  if (!exists(entryFile)) {
    throw new Error(`Can not find module '${entry}'`);
  }
  const appJson = require(entryFile);
  appJson.pages.unshift('app');
  return parseEntry({baseUrl: './src', entryFile: appJson, cssSuffix, xmlSuffix});
}

exports.default = {
  getEntry
};