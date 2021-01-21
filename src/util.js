/**
 * ? transform string to camel case
 * *  @argument '/app/pro-released-apps', 'image_build.Info' or '#/definitions/image_build.BoolResp'
 * *  @returns AppProReleasedApps, ImageBuildInfo, ImageBuildBoolResp
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

function nameCase(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

module.exports.generateCamelName = generateCamelName;
