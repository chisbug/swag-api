/**
 * @function 将字符串转为驼峰格式
 * @param {
 *  str: string example: '/app/pro-released-apps', 'image_build.Info' or '#/definitions/image_build.BoolResp'
 * }
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
 * @param {
 *  str: string
 * }
 */
function nameCase(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

/**
 * @function 转换integer为number
 * @param {
  *   type: 一个定义普通类型的字符串
  * }
  */
 function exchangeType(type) {
   return type === 'integer' ? 'number' : type;
 }
 

module.exports.generateCamelName = generateCamelName;
module.exports.nameCase = nameCase;
module.exports.exchangeType = exchangeType;
