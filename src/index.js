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

class MiniappAutoPlugin {
  constructor(options = {}) {
    this.options = options
  }

  apply(compiler) {
    const options = compiler.options || {};

    compiler.hooks.emit.tap(
      'miniapp-webpack-plugin-emit',
      (compilation) => {
        const {entrypoints, assets} = compilation || {};
        let commons = this.getCommonSplit(entrypoints);
        Object.keys(assets).forEach((pathurl) => {
          if (/\.js$/.test(pathurl) && commons.indexOf(pathurl) < 0) {
            let commonStrArr = this.getRelativePath(pathurl, commons);
            assets[pathurl]._source.children.unshift(commonStrArr.join(''));
          }
        });
      });
  }

  getCommonSplit(entrypoints = []) {
    let commons = [];
    entrypoints.forEach((entrypoint, file) => {
      const chunks = entrypoint.chunks || [];
      chunks.forEach(c => {
        if (c.chunkReason) {
          let splitFile = c.files[0],
            isJs = /\.js$/.test(splitFile);
          if (isJs && commons.indexOf(splitFile) < 0) {
            commons.push(splitFile.split(path.sep).join('\/'));
          }
        }
      });
    });
    return commons;
  }

  getRelativePath(url, commons = []) {
    const resolveUrl = path.resolve(process.cwd(), path.dirname(url));
    return commons.map((common) => {
      return `require("./${path.relative(resolveUrl, path.resolve(process.cwd(), common)).split('\\').join('\/')}");\n\n\n`;
    });
  }
}

exports.default = {
  getEntry,
  MiniappAutoPlugin
};