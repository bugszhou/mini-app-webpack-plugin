'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

const pluginName = 'mini-app-webpack-plugin',
  path = require('path'),
  readFileSync = require('fs').readFileSync,
  exists = require('fs').existsSync,
  parseEntry = require('./lib/parseEntry');

function getEntry({
                    entry = './src/app.json',
                    cssSuffix = 'css',
                    compileCssSuffix = 'css',
                    xmlSuffix = 'html'
                  } = {}) {
  const entryFile = path.resolve(process.cwd(), entry);
  if (!exists(entryFile)) {
    throw new Error(`Can not find module '${entry}'`);
  }
  let appJson = readFileSync(entryFile, 'utf-8');
  try {
    appJson = JSON.parse(appJson || '{}');
  } catch (e) {
    console.error(e);
    throw new Error('Entry must be json string!');
  }
  appJson.pages.unshift('app');
  return parseEntry({baseUrl: './src', entryFile: appJson, cssSuffix, compileCssSuffix, xmlSuffix});
}

class MiniappAutoPlugin {
  constructor(options = {
    cssSuffix: 'css',
    xmlSuffix: 'html',
  }) {
    this.options = options
  }

  apply(compiler) {
    const options = compiler.options || {};

    compiler.hooks.emit.tap(
      'miniapp-webpack-plugin-emit',
      (compilation) => {
        const { entrypoints, assets } = compilation || {};
        let commons = this.getCommonSplit(entrypoints);
        Object.keys(assets).forEach((pathurl) => {
          const unixPathurl = pathurl.split('\\').join('\/'),
            entryCommon = commons[unixPathurl.replace(new RegExp(`\.(${this.options.cssSuffix}|js)$`), '')];
          if (!entryCommon) {
            return false;
          }
          const { js, css} = entryCommon,
            jsLen = js.length,
            cssLen = css.length;

          if (/\.js$/.test(pathurl) && js.indexOf(unixPathurl) < 0 && jsLen) {
            // let commonStrArr = this.getRelativePath(pathurl, ['commons/runtime.js', ...js]);
            let commonStrArr = this.getRelativePath(pathurl, js);
            if (assets[pathurl]._value) {
              assets[pathurl]._value = commonStrArr.join('') + assets[pathurl]._value;
            } else {
              if (assets[pathurl].children && Array.isArray(assets[pathurl].children)) {
                assets[pathurl].children[0]._value = commonStrArr.join('') + assets[pathurl].children[0]._value;
              } else {
                assets[pathurl]._source.children.unshift(commonStrArr.join(''));
              }
            }
          } else if (cssLen && (new RegExp(`\.${this.options.cssSuffix}$`)).test(pathurl) && css.indexOf(unixPathurl) < 0) {
            let commonStrArr = this.getRelativeCssPath(pathurl, css);
            if (assets[pathurl]._value) {
              assets[pathurl]._value = commonStrArr.join('') + assets[pathurl]._value;
            } else {
              if (assets[pathurl].children && Array.isArray(assets[pathurl].children)) {
                assets[pathurl].children[0]._value = commonStrArr.join('') + assets[pathurl].children[0]._value;
              } else {
                assets[pathurl]._source.children.unshift(commonStrArr.join(''));
              }
            }
          }
        });
      });
  }

  getCommonSplit(entrypoints = []) {
    let commons = {};
    entrypoints.forEach((entrypoint, file) => {
      const chunks = entrypoint.chunks || [],
        name = entrypoint.options.name,
        depModules = {
          js: [],
          css: [],
        };
      if (entrypoint.runtimeChunk) {
        let [runtimeFile, secFile] = entrypoint.runtimeChunk.files,
          isJs = /\.js$/.test(runtimeFile),
          isCss = (new RegExp(`\.${this.options.cssSuffix}$`)).test(runtimeFile);

        if (isJs && depModules.js.indexOf(runtimeFile) < 0) {
          depModules.js.push(runtimeFile.split(path.sep).join('\/'));
        }
        if (isCss && depModules.css.indexOf(runtimeFile) < 0) {
          if (/\.js$/.test(secFile) && depModules.js.indexOf(secFile) < 0) {
            depModules.js.push(secFile.split(path.sep).join('\/'));
          }
          depModules.css.push(runtimeFile.split(path.sep).join('\/'));
        }
      }
      chunks.forEach(c => {
        if (c.chunkReason) {
          let [splitFile, secFile] = c.files,
            isJs = /\.js$/.test(splitFile),
            isCss = (new RegExp(`\.${this.options.cssSuffix}$`)).test(splitFile);

          if (isJs && depModules.js.indexOf(splitFile) < 0) {
            depModules.js.push(splitFile.split(path.sep).join('\/'));
          }
          if (isCss && depModules.css.indexOf(splitFile) < 0) {
            if (/\.js$/.test(secFile) && depModules.js.indexOf(secFile) < 0) {
              depModules.js.push(secFile.split(path.sep).join('\/'));
            }
            depModules.css.push(splitFile.split(path.sep).join('\/'));
          }
        }
      });
      commons[name] = depModules;
    });
    return commons;
  }

  getRelativePath(url, commons = []) {
    const resolveUrl = path.resolve(process.cwd(), path.dirname(url));
    return commons.map((common) => {
      return `require("./${path.relative(resolveUrl, path.resolve(process.cwd(), common)).split('\\').join('\/')}");\n`;
    });
  }

  getRelativeCssPath(url, commons = []) {
    const resolveUrl = path.resolve(process.cwd(), path.dirname(url));
    return commons.map((common) => {
      return `@import "./${path.relative(resolveUrl, path.resolve(process.cwd(), common)).split('\\').join('\/')}";\n\n`;
    });
  }
}

exports.default = {
  getEntry,
  MiniappAutoPlugin
};