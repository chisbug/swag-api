/**
 * ? generate core
 * *  @author Ch
 */
const os = require('os');
const util = require('./util');

// const
let INTERFACE_JSON = {};
let FUNCTION_LIST = [];
let INTERFACE_REQUIRED_JSON = {};

module.exports = function generate(json) {
  const interface_defines = json.definitions;
  const interface_paths = json.paths;

  analysisPaths(interface_paths, (err) => {
    if (err) throw err;
  });
  analysisDefines(interface_defines, (err2) => {
    if (err2) throw err;
  });

  const finalResult = analysisResult();
  return finalResult;
};

function analysisResult() {
  let result = `import request from './request';${os.EOL}${os.EOL}`;

  result += createStringFromInterfaceJSON(INTERFACE_JSON);
  result += createStringFromFunctionJSON(FUNCTION_LIST);

  return result;
}

function createStringFromInterfaceJSON(data) {
  let result = '';
  for (const interfaceName in data) {
    if (Object.hasOwnProperty.call(data, interfaceName)) {
      const element = data[interfaceName];
      result += `export interface ${interfaceName} { ${os.EOL}`;

      const isRequire = INTERFACE_REQUIRED_JSON[interfaceName];

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

function createStringFromFunctionJSON(data) {
  let result = '';
  data.forEach((item) => {
    result += item.summary
      ? `${os.EOL}/* 
  ${item.summary}
  ${item.desc === item.summary ? '' : item.desc}
*/${os.EOL}`
      : '';
    result += `export const ${item.name} = () => {
  return request.${item.method}<${item.reqType || '{}'}, ${item.resType}>('${
      item.path
    }', { bodyType: '${item.requestType}' });
};`;
  });

  return result;
}

/* 
  处理path
*/
function analysisPaths(paths, callback) {
  if (!paths) {
    callback(new Error('json文件中未找到接口定义, 请检查'));
  }

  for (const pathName in paths) {
    if (Object.hasOwnProperty.call(paths, pathName)) {
      let requestInterfaceName = '';
      let responseInterfaceName = '';
      const pathContent = paths[pathName];
      const pathMethod = pathContent.hasOwnProperty('get') ? 'get' : 'post';
      const pathBody = pathContent[pathMethod];

      const pathConsume = pathBody.consumes
        ? pathBody.consumes[0]
        : 'application/x-www-form-urlencoded';
      const pathSummary = pathBody.summary;
      const pathDesc = pathBody.description || '';
      const pathParams = pathBody.parameters || null;
      const pathResponse = pathBody.responses['200'] || null;

      // 处理params
      if (pathParams) {
        if (pathParams.length === 1 && pathParams[0].name === 'entity') {
          // 有ref, 只需标记这个ref是否参数必填
          const isRequired = pathParams[0].hasOwnProperty('required') || false;
          const _ref = pathParams[0].schema.$ref;
          requestInterfaceName = util.generateCamelName(_ref);

          INTERFACE_REQUIRED_JSON[requestInterfaceName] = isRequired;
        } else {
          let interfaceContent = {};
          pathParams.forEach((item) => {
            interfaceContent[item.name] = {
              type: exchangeType(item.type),
              require: item.hasOwnProperty('required') || false,
              desc: item.description || '',
            };
          });

          requestInterfaceName = `${pathMethod}${util.generateCamelName(pathName)}Request`;
          INTERFACE_JSON[requestInterfaceName] = interfaceContent;
        }
      }

      // 处理response
      if (pathResponse) {
        if (pathResponse.hasOwnProperty('schema')) {
          if (pathResponse.schema.hasOwnProperty('type') && pathResponse.schema.type === 'array') {
            // respone 是数组类型
            const _ref = pathResponse.schema.items.$ref;
            const interfaceName = util.generateCamelName(_ref);
            responseInterfaceName = `${interfaceName}[]`;
            INTERFACE_REQUIRED_JSON[interfaceName] = false;
          } else {
            const _ref = pathResponse.schema.$ref;
            responseInterfaceName = util.generateCamelName(_ref);
            INTERFACE_REQUIRED_JSON[responseInterfaceName] = false;
          }
        }
      }

      // 生成代码json
      const codeObj = {
        summary: pathSummary,
        desc: pathDesc,
        name: `${pathMethod}${util.generateCamelName(pathName)}`,
        path: pathName,
        method: pathMethod,
        requestType: pathConsume === 'application/x-www-form-urlencoded' ? 'formData' : 'json',
        reqType: requestInterfaceName,
        resType: responseInterfaceName,
      };
      FUNCTION_LIST.push(codeObj);
    }
  }
}

/* 
  处理定义的ref
*/
function analysisDefines(defines, callback) {
  if (!defines) {
    callback(new Error('json文件中未找到类型定义, 请检查'));
  }

  for (const define in defines) {
    let interfaceObj = {};
    const interfaceName = util.generateCamelName(define);
    const defineBody = defines[define];

    for (const defName in defineBody.properties) {
      const proObject = defineBody.properties[defName];
      let subObj = {};

      // genarate type
      let _type = '';
      if (proObject.type === 'object') {
        _type = 'Record<string, unknown>';
      } else if (proObject.type === 'array') {
        _type = proObject.items.hasOwnProperty('$ref')
          ? `${util.generateCamelName(proObject.items.$ref)}[]`
          : `${exchangeType(proObject.items.type)}[]`;
      } else {
        if (proObject.hasOwnProperty('$ref')) {
          _type = util.generateCamelName(proObject.$ref);
        } else {
          _type = exchangeType(proObject.type);
        }
      }

      subObj = {
        desc: proObject.description || '',
        type: _type,
      };

      interfaceObj[defName] = subObj;
    }

    INTERFACE_JSON[interfaceName] = interfaceObj;
  }
}

// 转换integer类型为number类型
function exchangeType(type) {
  return type === 'integer' ? 'number' : type;
}
