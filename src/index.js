"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});

const pluginName = "mini-app-webpack-plugin",
  path = require("path"),
  readFileSync = require("fs").readFileSync,
  exists = require("fs").existsSync,
  globby = require("globby"),
  parseEntry = require("./lib/parseEntry"),
  funcHelper = require("./helpers/Function");

const UNESCAPED_GLOB_SYMBOLS_RE = /(\\?)([()*?[\]{|}]|^!|[!+@](?=\())/g;

function getEntry({
  entry = "./src/app.json",
  cssSuffix = "css",
  compileCssSuffix = "css",
  xmlSuffix = "html",
  jsSuffix = "js",
  autoImportAppConfigPath = "src/outside",
} = {}) {
  const entryFile = path.resolve(process.cwd(), entry);
  let subsAppJSON = [];
  if (autoImportAppConfigPath) {
    const context = process.cwd();
    const globbyPath = path.posix.join(
      replaceBackslashes(context).replace(UNESCAPED_GLOB_SYMBOLS_RE, "\\$2"),
      replaceBackslashes(autoImportAppConfigPath),
    );
    const results = globby.sync(globbyPath, {
      expandDirectories: {
        files: ["app.json"],
      },
    });
    results.forEach((pathurl) => {
      let subData = readFileSync(pathurl, "utf-8");
      try {
        subData = JSON.parse(subData || "{}");
      } catch (e) {
        subData = null;
      }
      if (
        subData &&
        subData.subpackages &&
        Array.isArray(subData.subpackages)
      ) {
        if (subData.subpackages[0]) {
          subsAppJSON.push(subData.subpackages[0]);
        }
      }
    });
  }
  if (!exists(entryFile)) {
    throw new Error(`Can not find module '${entry}'`);
  }
  let appJson = readFileSync(entryFile, "utf-8");
  try {
    appJson = JSON.parse(appJson || "{}");
    if (subsAppJSON && subsAppJSON.length > 0) {
      appJson.subpackages = [
        ...(Array.isArray(appJson.subpackages) ? appJson.subpackages : []),
        ...subsAppJSON,
      ];
    }
  } catch (e) {
    console.error(e);
    throw new Error("Entry must be json string!");
  }

  appJson.pages.unshift("app");

  const sitemap = appJson.sitemapLocation || "",
    entryFiles = parseEntry({
      baseUrl: "./src",
      entryFile: appJson,
      cssSuffix,
      compileCssSuffix,
      xmlSuffix,
      jsSuffix,
    });

  if (sitemap) {
    let sitemapName = sitemap.replace(/(\.[\s\S]*?)$/, "");
    entryFiles.entryJsonFiles[sitemapName] = [`./src/${sitemap}`];
  }
  return entryFiles;
}

class MiniappAutoPlugin {
  constructor(
    options = {
      cssSuffix: "css",
      xmlSuffix: "html",
    },
  ) {
    this.options = options;
  }

  apply(compiler) {
    const options = compiler.options || {};

    compiler.hooks.emit.tap("miniapp-webpack-plugin-emit", (compilation) => {
      const { entrypoints, assets } = compilation || {};
      let commons = this.getCommonSplit(entrypoints);

      if (assets["commons/runtime.js"]) {
        const children = assets["commons/runtime.js"].children;
        if (children && children[0]) {
          assets["commons/runtime.js"].children[0]._value += funcHelper;
        } else {
          if (assets["commons/runtime.js"]._source) {
            assets["commons/runtime.js"]._source.children.push(funcHelper);
          } else {
            assets["commons/runtime.js"]._value += funcHelper;
          }
        }
      }

      Object.keys(assets).forEach((pathurl) => {
        const unixPathurl = pathurl.split("\\").join("/"),
          entryCommon =
            commons[
              unixPathurl.replace(
                new RegExp(`\.(${this.options.cssSuffix}|js)$`),
                "",
              )
            ];
        if (!entryCommon) {
          return false;
        }
        const { js, css } = entryCommon,
          jsLen = js.length,
          cssLen = css.length;

        if (/\.js$/.test(pathurl) && js.indexOf(unixPathurl) < 0 && jsLen) {
          // let commonStrArr = this.getRelativePath(pathurl, ['commons/runtime.js', ...js]);
          let commonStrArr = this.getRelativePath(pathurl, js);
          if (assets[pathurl]._value) {
            assets[pathurl]._value =
              commonStrArr.join("") + assets[pathurl]._value;
          } else {
            if (
              assets[pathurl].children &&
              Array.isArray(assets[pathurl].children)
            ) {
              assets[pathurl].children[0]._value =
                commonStrArr.join("") + assets[pathurl].children[0]._value;
            } else {
              assets[pathurl]._source.children.unshift(commonStrArr.join(""));
            }
          }
        } else if (
          cssLen &&
          new RegExp(`\.${this.options.cssSuffix}$`).test(pathurl) &&
          css.indexOf(unixPathurl) < 0
        ) {
          let commonStrArr = this.getRelativeCssPath(pathurl, css);
          if (assets[pathurl]._value) {
            assets[pathurl]._value =
              commonStrArr.join("") + assets[pathurl]._value;
          } else {
            if (
              assets[pathurl].children &&
              Array.isArray(assets[pathurl].children)
            ) {
              assets[pathurl].children[0]._value =
                commonStrArr.join("") + assets[pathurl].children[0]._value;
            } else {
              if (assets[pathurl]._source) {
                assets[pathurl]._source.children.unshift(commonStrArr.join(""));
              } else {
                assets[pathurl]._value =
                  commonStrArr.join("") + assets[pathurl]._value;
              }
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
          isCss = new RegExp(`\.${this.options.cssSuffix}$`).test(runtimeFile);

        if (isJs && depModules.js.indexOf(runtimeFile) < 0) {
          depModules.js.push(runtimeFile.split(path.sep).join("/"));
        }
        if (isCss && depModules.css.indexOf(runtimeFile) < 0) {
          if (/\.js$/.test(secFile) && depModules.js.indexOf(secFile) < 0) {
            depModules.js.push(secFile.split(path.sep).join("/"));
          }
          depModules.css.push(runtimeFile.split(path.sep).join("/"));
        }
      }
      chunks.forEach((c) => {
        if (c.chunkReason) {
          let [splitFile, secFile] = c.files,
            isJs = /\.js$/.test(splitFile),
            isCss = new RegExp(`\.${this.options.cssSuffix}$`).test(splitFile);

          if (isJs && depModules.js.indexOf(splitFile) < 0) {
            depModules.js.push(splitFile.split(path.sep).join("/"));
          }
          if (isCss && depModules.css.indexOf(splitFile) < 0) {
            if (/\.js$/.test(secFile) && depModules.js.indexOf(secFile) < 0) {
              depModules.js.push(secFile.split(path.sep).join("/"));
            }
            depModules.css.push(splitFile.split(path.sep).join("/"));
          }
        }
      });
      commons[name] = depModules;
    });
    return commons;
  }

  getRelativePath(url, commons = []) {
    const isRootUrl = url.indexOf("/") === 0;
    const resolveUrl = path.resolve(
      process.cwd(),
      path.dirname(isRootUrl ? url.substr(1) : url),
    );

    return commons.map((common) => {
      return `require("./${path
        .relative(resolveUrl, path.resolve(process.cwd(), common))
        .split("\\")
        .join("/")}");\n`;
    });
  }

  getRelativeCssPath(url, commons = []) {
    const isRootUrl = url.indexOf("/") === 0;
    const resolveUrl = path.resolve(
      process.cwd(),
      path.dirname(isRootUrl ? url.substr(1) : url),
    );

    return commons.map((common) => {
      return `@import "./${path
        .relative(resolveUrl, path.resolve(process.cwd(), common))
        .split("\\")
        .join("/")}";\n\n`;
    });
  }
}

function getAppJson({
  entry = "./src/app.json",
  autoImportAppConfigPath = "src/outside",
} = {}) {
  const entryFile = path.resolve(process.cwd(), entry);
  let subsAppJSON = [];
  if (autoImportAppConfigPath) {
    const context = process.cwd();
    const globbyPath = path.posix.join(
      replaceBackslashes(context).replace(UNESCAPED_GLOB_SYMBOLS_RE, "\\$2"),
      replaceBackslashes(autoImportAppConfigPath),
    );
    const results = globby.sync(globbyPath, {
      expandDirectories: {
        files: ["app.json"],
      },
    });
    results.forEach((pathurl) => {
      let subData = readFileSync(pathurl, "utf-8");
      try {
        subData = JSON.parse(subData || "{}");
      } catch (e) {
        subData = null;
      }
      if (
        subData &&
        subData.subpackages &&
        Array.isArray(subData.subpackages)
      ) {
        if (subData.subpackages[0]) {
          subsAppJSON.push(subData.subpackages[0]);
        }
      }
    });
  }
  if (!exists(entryFile)) {
    throw new Error(`Can not find module '${entry}'`);
  }
  let appJson = readFileSync(entryFile, "utf-8");
  try {
    appJson = JSON.parse(appJson || "{}");
    if (subsAppJSON && subsAppJSON.length > 0) {
      appJson.subpackages = [
        ...(Array.isArray(appJson.subpackages) ? appJson.subpackages : []),
        ...subsAppJSON,
      ];
    }
  } catch (e) {
    console.error(e);
    throw new Error("Entry must be json string!");
  }
  return appJson;
}

/**
 * @param {string} str
 * @returns {string}
 */

function replaceBackslashes(str) {
  return str.replace(/\\/g, "/");
}

exports.default = {
  getEntry,
  MiniappAutoPlugin,
  getAppJson,
};
