const fs = require('fs');
const path = require('path');

/**
 * @function 将字符串转为驼峰格式
 * @param {string} str 待转换的字符串
 *      example: '/app/pro-released-apps', 'image_build.Info' or '#/definitions/image_build.BoolResp'
 * @returns AppProReleasedApps, ImageBuildInfo or ImageBuildBoolResp
 */
const generateCamelName = function (str) {
  let camelNameResult = '';
  let useString = '';
  const isRef = str.indexOf('#') === 0 ? true : false;

  if (isRef) {
    const nameSplit = str.split('/');
    const len = nameSplit.length;
    useString = nameSplit[len - 1];
  } else {
    useString = str;
  }

  const singleWordArr = useString.split(/[-_./]/);
  singleWordArr.forEach((s) => {
    camelNameResult += nameCase(s);
  });

  return camelNameResult;
};

/**
 * @function 字符串首字母大写
 * @param {string} str
 */
function nameCase(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

/**
 * @function 转换integer为number
 * @param {string} type 普通类型的字符串
 */
function exchangeType(type) {
  return type === 'integer' ? 'number' : type;
}

/**
 * 查询路径是否存在，不存在则创建
 * @param {string} dir 路径
 */
async function exitsFolder(dir) {
  let isExists = await getStat(dir);

  if (isExists && isExists.isDirectory()) {
    // 路径存在, 且不是文件，返回true
    return true;
  } else if (isExists) {
    // 路径存在, 但为文件，返回false
    return false;
  }

  // 如果该路径不存在, 递归往上查询
  let tempDir = path.parse(dir).dir;
  let status = await exitsFolder(tempDir);

  let mkdirStatus;
  if (status) {
    mkdirStatus = await mkdir(dir);
  }
  return mkdirStatus;
}

/**
 * 读取路径信息
 * @param {string} path 路径
 */
function getStat(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        resolve(false);
      } else {
        resolve(stats);
      }
    });
  });
}

/**
 * 创建路径
 * @param {string} dir 路径
 */
function mkdir(dir) {
  return new Promise((resolve, reject) => {
    fs.mkdir(dir, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

module.exports = {
  generateCamelName,
  nameCase,
  exchangeType,
  exitsFolder,
};
