const os = require('os');

/* 
  接口方法元数据: requestFuncArr = [
    {
      name: 'postAppCreate,
      path: '/app/create',
      dataType: 'json',
      summary: '接口作用注释'
      reqType: AppCreateReq || 生成interface并指定名字
      resType:AppBoolResp || 生成interface并指定名字
    }
  ]

  必选接口元数据: requestRequiredArr = [
    'AppCreateReq', ...
  ]

  req interface元数据(生成时判断是否必选): interfaceReqArr = ['result字符串', ...]

  res interface元数据: interfaceResArr = ['result字符串', ...]


*/

/* 
  - 循环paths, 每次循环, 加入到一个数组里
    1. get或者post
    2. 有parameters的话,循环参数arr, 
        有schema的话, 使用definitions[renderType(schema.$ref)]指定<interface>, 在requestInterfaceRequired数组里添加此interface是否必选 
        没有schema, 生成interface, 处理是否必选, push进interfaceReqArray
    3. consumes处理header
    4. 根据responses.200生成response interface, push进interfaceResArray

  - 把所有元数据转换成字符串返回

*/

module.exports = function generate(dataJson) {
  // 先生成接口请求JSON, 再生成代码, 生成interface时可以判断接口参数是否必须
  const requestCode = generateRequestCode(dataJson.paths)
  // console.log(requestCode);


  // 根据definitions生成interface
  const interfaces = generateInterface(dataJson.definitions, dataJson.paths);

  return interfaces;
};

function generateRequestCode(paths) {
  for (const pathName in paths) {
    const requestBody = paths[pathName].hasOwnProperty('get') ? paths[pathName].get : paths[pathName].post


    if (requestBody.hasOwnProperty('schema')) {
      // 使用definitions的类型
      const _type = renderType(requestBody.schema.$ref)
    } else {
      // 新生成

    }
    
  }
}

function generateInterface(definitions) {
  let result = '';
  for (const interfaceName in definitions) {
    const _interfaceName = renderName(interfaceName);
    result += `export interface ${_interfaceName} { ${os.EOL}`;

    // 增加一个interface
    const properties = definitions[interfaceName].properties;

    for (const proKey in properties) {
      if (properties.hasOwnProperty(proKey)) {
        // 查找此接口参数是否为必传



        const proObject = properties[proKey];
        // 注释
        const desc = proObject.description ? `  /* ${proObject.description} */${os.EOL}` : '';

        // 类型
        let _type = '';
        if (proObject.type === 'object') {
          if (proObject.hasOwnProperty('$ref')) {
            _type = renderName(proObject.$ref);
          } else {
            // 未说明类型
            _type = 'any';
          }
        } else if (proObject.type === 'array') {
          _type = proObject.items.hasOwnProperty('$ref')
            ? `Array<${renderName(proObject.items.$ref)}>`
            : `Array<${renderType(proObject.items.type)}>`;
        } else {
          _type = renderType(proObject.type);
        }

        result += `${desc}  ${proKey}: ${_type};${os.EOL}`;
      }
    }
    result += `}${os.EOL}${os.EOL}`;
  }

  return result;
}

// 处理interface name
function renderName(name) {
  let arr = [];
  if (name.indexOf('#') > -1) {
    const splitArr = name.split('/');
    const len = splitArr.length;
    arr = splitArr[len - 1].split('.');
  } else {
    arr = name.split('.');
  }

  return nameCase(arr[0]) + arr[1];
}

// 首字母大写
function nameCase(str) {
  newStr = str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
  return newStr;
}

// 转换integer类型为number类型
function renderType(type) {
  return type === 'integer' ? 'number' : type;
}
