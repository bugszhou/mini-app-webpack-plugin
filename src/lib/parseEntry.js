const path = require("path"),
  fs = require("fs"),
  exists = fs.existsSync,
  isObject = require("lodash/isObject"),
  isEmpty = require("lodash/isEmpty"),
  isArray = require("lodash/isArray");

/**
 *
 * pages ==> [js, wxml, json, scss]
 * template ==> [wxml]
 * component ==> [js, wxml, json, scss] 独立
 * wxs ==> [wxs(js)] 单独一个webpack
 */

module.exports = function ({
  baseUrl = "./src",
  entryFile = "",
  cssSuffix,
  xmlSuffix,
  compileCssSuffix,
  jsSuffix = "js",
} = {}) {
  let pages = entryFile.pages,
    subpackages = entryFile.subpackages || entryFile.subPackages;

  if (hasSubPackages(subpackages)) {
    let tmp = [];
    subpackages.forEach((subpkg) => {
      const root = subpkg.root;
      subpkg.pages.forEach((page) => {
        tmp.push(`${root}/${page}`);
      });
    });
    pages = pages.concat(tmp);
  }
  return getBaseEntry(
    pages,
    cssSuffix,
    xmlSuffix,
    baseUrl,
    compileCssSuffix,
    jsSuffix,
  );
};

function hasSubPackages(packages) {
  return isArray(packages);
}

function isPlugin(url) {
  return /^plugin\:\/\//.test(url);
}

function getBaseEntry(
  pages = [],
  cssSuffix,
  xmlSuffix,
  baseUrl,
  compileCssSuffix,
  jsSuffix,
) {
  const cwd = process.cwd();
  let entry = {},
    entryJsonFiles = {};
  pages.forEach((page) => {
    if (isPlugin(page)) {
      return false;
    }
    let { jsPath, xml, css, json, ocss } = getEntryFileUrl(
      page,
      cwd,
      baseUrl,
      cssSuffix,
      xmlSuffix,
      compileCssSuffix,
      jsSuffix,
    );
    let { pageEntry, jsonFiles } = getEntry(
      [jsPath, xml, css, json, ocss],
      baseUrl,
      cssSuffix,
      xmlSuffix,
      compileCssSuffix,
    );

    if (exists(json.reourcePath)) {
      let components = getJsonComponents(
        json.reourcePath,
        JSON.parse(fs.readFileSync(json.reourcePath).toString() || "{}"),
        {
          cssSuffix,
          compileCssSuffix,
          xmlSuffix,
          cwd,
          baseUrl,
          jsSuffix,
        },
      );
      let jsonComponentsData = eachJsonComponents(
        components,
        baseUrl,
        cssSuffix,
        xmlSuffix,
        compileCssSuffix,
      );
      entry = { ...entry, ...jsonComponentsData.entry };
      entryJsonFiles = {
        ...entryJsonFiles,
        ...jsonComponentsData.entryJsonFiles,
      };
    }
    if (pageEntry.length) {
      entry[`${page}`] = pageEntry;
    }
    if (jsonFiles.length) {
      entryJsonFiles[`${page}`] = jsonFiles;
    }
  });
  return {
    entry,
    entryJsonFiles,
  };
}

function getEntryFileUrl(
  page,
  cwd,
  baseUrl,
  cssSuffix,
  xmlSuffix,
  compileCssSuffix,
  jsSuffix,
) {
  const basePath = page.includes("node_modules") ? "" : `${baseUrl}/`;
  const tmpJsSuffix = page.includes("node_modules") ? "js" : `${jsSuffix}`;
  return {
    jsPath: {
      reourcePath: path.resolve(cwd, `${basePath}${page}.${jsSuffix}`),
      entry: `${page}.${tmpJsSuffix}`,
    },
    xml: {
      reourcePath: path.resolve(cwd, `${basePath}${page}.${xmlSuffix}`),
      entry: `${page}.${xmlSuffix}`,
    },
    css: {
      reourcePath: path.resolve(cwd, `${basePath}${page}.${compileCssSuffix}`),
      entry: `${page}.${compileCssSuffix}`,
    },
    ocss: {
      reourcePath: path.resolve(cwd, `${basePath}${page}.${cssSuffix}`),
      entry: `${page}.${cssSuffix}`,
    },
    json: {
      reourcePath: path.resolve(cwd, `${basePath}${page}.json`),
      entry: `${page}.json`,
    },
  };
}

function getEntry(
  entry = [],
  baseUrl = "./src",
  cssSuffix,
  xmlSuffix,
  compileCssSuffix,
) {
  let pageEntry = [],
    jsonFiles = [];
  entry.forEach(({ reourcePath, entry }) => {
    let entryUrl = entry.includes("node_modules") ? `./${entry}` : `${baseUrl}/${entry}`;
    if (new RegExp(`\.(${cssSuffix}|${compileCssSuffix}|json)$`).test(entry)) {
      if (exists(reourcePath)) {
        pageEntry.push(entryUrl);
        if (/\.json$/.test(entry)) {
          jsonFiles.push(entryUrl);
        }
      }
    } else {
      if (!new RegExp(`\/app\.${xmlSuffix}$`).test(entryUrl)) {
        pageEntry.push(entryUrl);
      }
    }
  });
  return {
    pageEntry,
    jsonFiles,
  };
}

/**
 * 解析component path
 * @param {string} resourcePath 引用组件的文件绝对路径
 * @param {Object} json 页面或者组件的json配置
 * @param {Object} options 文件后缀信息
 */
function getJsonComponents(resourcePath, json = {}, options = {}) {
  let isUseComponent =
    isObject(json.usingComponents) && !isEmpty(json.usingComponents);
  if (!isUseComponent) {
    return [];
  }
  const results = {};
  findComponents(resourcePath, json, options, results);
  return Object.values(results || {});
}

/**
 * 遍历解析
 * @param {string} resourcePath 引用组件的文件绝对路径
 * @param {Object} json 页面或者组件的json配置
 * @param {Object} options 文件后缀信息
 */
function findComponents(resourcePath, json = {}, options = {}, returnData = {}) {
  let isUseComponent =
    isObject(json.usingComponents) && !isEmpty(json.usingComponents);
  if (!isUseComponent) {
    return;
  }
  Object.entries(json.usingComponents).forEach(([componentName, url]) => {
    if (isPlugin(url) || url.includes("weui-miniprogram")) {
      return {
        entryName: "",
        data: {},
      };
    }
    let entryKey = getRequire(resourcePath, url);
    console.log("getNodeModulesSource ===> ", getNodeModulesSource(resourcePath, url));
    const data = {
      entryName: entryKey,
      data: getEntryFileUrl(
        getNodeModulesSource(resourcePath, url, entryKey),
        options.cwd,
        options.baseUrl,
        options.cssSuffix,
        options.xmlSuffix,
        options.compileCssSuffix,
        options.jsSuffix,
      ),
    };
    returnData[data.entryName] = data;
    const jsonPath = data.data.json.reourcePath;
    if (exists(jsonPath)) {
      const jsonData = JSON.parse(fs.readFileSync(jsonPath).toString() || "{}");
      if (jsonData.usingComponents) {
        findComponents(jsonPath, jsonData, options, returnData);
      }
    }
  });
}

function eachJsonComponents(
  components = [],
  baseUrl,
  cssSuffix,
  xmlSuffix,
  compileCssSuffix,
) {
  const entry = {},
    entryJsonFiles = {};
  components.forEach(({ entryName, data }) => {
    if (entryName) {
      let componentsEntryObj = getEntry(
        [data.jsPath, data.xml, data.css, data.json, data.ocss],
        baseUrl,
        cssSuffix,
        xmlSuffix,
        compileCssSuffix,
      );
      let componentsEntry = componentsEntryObj.pageEntry;
      let componentsJsonFiles = componentsEntryObj.jsonFiles;
      if (componentsEntry.length) {
        entry[`${entryName}`] = componentsEntry;
      }
      if (componentsJsonFiles.length) {
        entryJsonFiles[`${entryName}`] = componentsJsonFiles;
      }
    }
  });
  return {
    entry,
    entryJsonFiles,
  };
}

function getRequire(resourcePath, url) {
  const isRootUrl = url.indexOf("/") === 0,
    fileDir = path.dirname(resourcePath),
    srcName = path.relative(process.cwd(), fileDir).split(path.sep)[0] || "src",
    srcDir = path.resolve(process.cwd(), srcName);

  if (!isRootUrl) {
    return path.relative(srcDir, path.resolve(fileDir, url));
  }

  return url.replace("/", "");
}

function getNodeModulesSource(resourcePath, url, entryKey) {
  const isRootUrl = url.indexOf("/") === 0,
    fileDir = path.dirname(resourcePath),
    srcName = path.relative(process.cwd(), fileDir).split(path.sep)[0] || "src";

  if (srcName !== "node_modules") {
    return entryKey;
  }

  if (!isRootUrl) {
    return path.relative(process.cwd(), path.resolve(fileDir, url));
  }

  return entryKey;
}
