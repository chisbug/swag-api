const os = require('os');

// const
let INTERFACE_REQ_DATA = {};
let INTERFACE_RES_DATA = {};
let INTERFACE_REQUIRE_FLAG = [];
let REQUEST_FUNC_DATA = [];

module.exports = function generate(json) {
  const interface_defines = json.definitions;
  const interface_paths = json.paths;

  analysisPaths(interface_paths, (err) => {
    if (err) throw err;
  });
  analysisDefines(interface_defines, (err2) => {
    if (err2) throw err;
  });

  const result = analysisResult();
  return result;
};

function analysisResult() {
  let result = `import request from './request';${os.EOL}${os.EOL}`;

  const result1 = loopInterRes(INTERFACE_REQ_DATA);
  const result2 = loopInterReq(INTERFACE_RES_DATA);
  const result3 = loopFunction(REQUEST_FUNC_DATA);

  result += result1;
  result += result2;
  result += result3;

  return result;
}

function loopInterRes(data) {
  let result = '';
  for (const interfaceName in data) {
    if (Object.hasOwnProperty.call(data, interfaceName)) {
      const element = data[interfaceName];
      result += `export interface ${interfaceName} { ${os.EOL}`;

      const isRequire = INTERFACE_REQUIRE_FLAG.includes(interfaceName);

      for (const proName in element) {
        if (Object.hasOwnProperty.call(element, proName)) {
          const proBody = element[proName];
          result += proBody.desc ? `  /* ${proBody.desc} */${os.EOL}` : '';
          result += `  ${proName}${proBody.require || isRequire ? '' : '?'}: ${proBody.type};${
            os.EOL
          }`;
        }
      }
      result += `}${os.EOL}${os.EOL}`;
    }
  }
  return result;
}

function loopInterReq(data) {
  let result = '';
  for (const interfaceName in data) {
    if (Object.hasOwnProperty.call(data, interfaceName)) {
      const element = data[interfaceName];
      result += `export type ${interfaceName} = ${element.type} ${os.EOL}`;
    }
  }
  return result;
}

function loopFunction(data) {
  let result = '';
  data.forEach((item) => {
    result += item.summary ? `${os.EOL}/* 
  ${item.summary}
  ${item.desc === item.summary ? '' : item.desc}
*/${os.EOL}` : '';
    result += `export const ${item.name} = () => {
  return request.${item.method}<${item.reqType || '{}'}, ${item.resType}>('${item.path}', { bodyType: '${item.requestType}' });
};`
    console.log(item);
  });

  return result;
}

function analysisPaths(paths, callback) {
  if (!paths) {
    callback(new Error('json文件中未找到接口定义, 请检查'));
  }

  for (const pathName in paths) {
    if (Object.hasOwnProperty.call(paths, pathName)) {
      let _REQ_NAME = '';
      let _RES_NAME = '';
      const pathContent = paths[pathName];
      const pathMethod = pathContent.hasOwnProperty('get') ? 'get' : 'post';
      const pathBody = pathContent[pathMethod];

      const pathConsume = pathBody.consumes
        ? pathBody.consumes[0]
        : 'application/x-www-form-urlencoded'; // 接口header
      const pathSummary = pathBody.summary; // 接口作用
      const pathDesc = pathBody.description || ''; // 接口说明
      const pathParams = pathBody.parameters || null;
      const pathResponse = pathBody.responses['200'] || null;

      // 处理params
      if (pathParams) {
        if (pathParams.length === 1 && pathParams[0].name === 'entity') {
          // 有实体定义, 标记interfaceName记录即可
          const isRequired = pathParams[0].hasOwnProperty('required') || false;
          const _ref = pathParams[0].schema.$ref;
          const _refName = createNameFromRef(_ref);

          _REQ_NAME = _refName;

          if (isRequired) INTERFACE_REQUIRE_FLAG.push(_refName);
        } else {
          // 生成interface对象
          let interfaceContent = {};
          pathParams.forEach((item) => {
            interfaceContent[item.name] = {
              type: exchangeType(item.type),
              require: item.hasOwnProperty('required') || false,
              desc: item.description || '',
            };
          });

          const interfaceName = createNameFromPath(pathMethod, pathName, 1);
          _REQ_NAME = interfaceName;
          INTERFACE_REQ_DATA[interfaceName] = interfaceContent;
        }
      }

      // 处理response
      if (pathResponse) {
        if (pathResponse.hasOwnProperty('schema')) {
          if (pathResponse.schema.hasOwnProperty('type')) {
            const _ref = pathResponse.schema.items.$ref;
            const _refName = createNameFromRef(_ref);

            // 生成interface对象
            let interfaceContent = {
              type: `Array<${_refName}>`,
              desc: pathResponse.description || '',
            };

            const interfaceName = `${pathMethod}${_refName}`;
            _RES_NAME = interfaceName;
            INTERFACE_RES_DATA[interfaceName] = interfaceContent;
          } else {
            const _ref = pathResponse.schema.$ref;
            const _refName = createNameFromRef(_ref);

            // 生成interface对象
            let interfaceContent = {
              type: _refName,
              desc: pathResponse.description || '',
            };

            const interfaceName = `${pathMethod}${_refName}`;
            _RES_NAME = interfaceName;
            INTERFACE_RES_DATA[interfaceName] = interfaceContent;
          }
        }
      }

      // 生成代码json
      const codeObj = {
        summary: pathSummary,
        desc: pathDesc,
        name: createNameFromPath(pathMethod, pathName, 2),
        path: pathName,
        method: pathMethod,
        requestType: pathConsume === 'application/x-www-form-urlencoded' ? 'formData' : 'json',
        reqType: _REQ_NAME,
        resType: _RES_NAME,
      };
      REQUEST_FUNC_DATA.push(codeObj);
    }
  }
}

function analysisDefines(defines, callback) {
  if (!defines) {
    callback(new Error('json文件中未找到类型定义, 请检查'));
  }

  for (const define in defines) {
    let interfaceObj = {};
    const interfaceName = createNameFromDefine(define);
    const defineBody = defines[define];

    for (const defName in defineBody.properties) {
      const proObject = defineBody.properties[defName];
      let subObj = {};

      let _type = '';
      if (proObject.type === 'object') {
        if (proObject.hasOwnProperty('$ref')) {
          _type = createNameFromRef(proObject.$ref);
        } else {
          // 未说明类型
          _type = 'any';
        }
      } else if (proObject.type === 'array') {
        _type = proObject.items.hasOwnProperty('$ref')
          ? `Array<${createNameFromRef(proObject.items.$ref)}>`
          : `Array<${exchangeType(proObject.items.type)}>`;
      } else {
        _type = exchangeType(proObject.type);
      }

      subObj = {
        desc: proObject.description || '',
        type: _type,
      };
      interfaceObj[defName] = subObj;
    }

    INTERFACE_REQ_DATA[interfaceName] = interfaceObj;
  }
}

function createNameFromPath(method, name, type) {
  /* 
    input: /app/pro-released-apps   /app/list
    output: DemandUpdateAppStatusReq
    type: 1 params 2 ajax func
  */
  const strArr = name.split('/');
  let result = `${method === 'get' ? 'get' : 'post'}${nameCase(strArr[1])}`;
  for (let index = 2; index < strArr.length; index++) {
    const element = strArr[index];
    if (element.indexOf('-') > -1) {
      const subStrArr = element.split('-');
      let subResult = '';
      subStrArr.forEach((item) => {
        subResult += nameCase(item);
      });
      result += subResult;
    } else {
      result += nameCase(element);
    }
  }

  result += type === 1 ? 'Req' : '';

  return result;
}

function createNameFromRef(ref) {
  /* 
    input: #/definitions/demand.UpdateAppStatusReq  #/definitions/image_build.BoolResp
    output: DemandUpdateAppStatusReq
  */
  const str = ref.split('/')[2];
  const arr = str.split('.');

  let result = '';
  for (let index = 0; index < arr.length; index++) {
    const element = arr[index];
    if (element.indexOf('_') > -1) {
      const subStrArr = element.split('_');
      let subResult = '';
      subStrArr.forEach((item) => {
        subResult += nameCase(item);
      });
      result += subResult;
    } else {
      result += nameCase(element);
    }
  }
  return result;
}

function createNameFromDefine(name) {
  /* 
    input: image_build.Info  env.UpdateRequest
    output: ImageBuildInfo
  */
  let result = '';
  const arr = name.split('.');

  arr.forEach((item) => {
    if (item.indexOf('_') > -1) {
      const subArr = item.split('_');
      let subResult = '';
      subArr.forEach((subItem) => {
        subResult += nameCase(subItem);
      });
      result += subResult;
    } else {
      result += nameCase(item);
    }
  });

  return result;
}

// 首字母大写
function nameCase(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

// 转换integer类型为number类型
function exchangeType(type) {
  return type === 'integer' ? 'number' : type;
}
