/**
 * @module generate core method
 * @author Ch 
 */
const os = require('os');
const util = require('./util');

module.exports = function generate(json) {
  const { paths, definitions } = json;

  let resultJson = {
    interfaceData: {},
    functionData: [],
  };

  analysisPaths(paths, resultJson);
  analysisDefines(definitions, resultJson);

  const finalResult = analysisResult(resultJson);
  return finalResult;
};

/**
 * @function 将处理好的json元数据转为可输出的字符串
 * @param {
 *   resultJson: {
 *     interfaceData: {},
 *     functionData: [],
 *   }
 * }
 */
function analysisResult(resultJson) {
  let result = `import request from './request';${os.EOL}${os.EOL}`;

  const interfaceStr = createStringFromInterfaceJSON(resultJson.interfaceData);
  const functionStr = createStringFromFunctionJSON(resultJson.functionData);

  return result + interfaceStr + functionStr;
}

/**
 * @function 把interface对象数据转换为可输出的字符串
 * @param {
 *   data: Record<string, unknown> interface对象
 * }
 */
function createStringFromInterfaceJSON(data) {
  let result = '';
  for (const interfaceName in data) {
    if (Object.hasOwnProperty.call(data, interfaceName)) {
      const element = data[interfaceName];

      result += `export interface ${interfaceName} { ${os.EOL}`;

      const isRequired = element.hasOwnProperty('isRequired') ? element.isRequired : false;

      for (const proName in element.content) {
        if (Object.hasOwnProperty.call(element.content, proName)) {
          const proBody = element.content[proName];
          const isWenhao = isRequired ? '' : `${proBody.required === true ? '' : '?'}`;
          result += proBody.desc ? `  /* ${proBody.desc} */${os.EOL}` : '';
          result += `  ${proName}${isWenhao}: ${proBody.type};${os.EOL}`;
        }
      }
      result += `}${os.EOL}${os.EOL}`;
    }
  }
  return result;
}

/**
 * @function 把function对象列表转换为可输出的字符串
 * @param {
 *   data: Record<string, unknown>[] function对象列表
 * }
 */
function createStringFromFunctionJSON(data) {
  let result = '';
  data.forEach((item) => {
    result += item.summary
      ? `${os.EOL}/** 
 * @function ${item.summary}${item.desc === item.summary ? '' : `${os.EOL} * @summary ${item.desc}`}
 */${os.EOL}`
      : '';
    result += `export const ${item.name} = () => {
  return request.${item.method}<${item.reqType || '{}'}, ${item.resType}>('${
      item.path
    }', { bodyType: '${item.requestType}' });
};${os.EOL}`;
  });

  return result;
}

/**
 * @function 解析swagger.json[paths]
 * @param {
 *   paths: swagger.json[paths]
 *   resultJson: 一个来自外部的通用空对象
 * }
 */
function analysisPaths(paths, resultJson) {
  if (!paths) {
    throw new Error('json文件中未找到接口定义, 请检查');
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
          // 参数有定义ref
          const isRequired = pathParams[0].hasOwnProperty('required')
            ? pathParams[0].required
            : false;
          const _ref = pathParams[0].schema.$ref;
          requestInterfaceName = util.generateCamelName(_ref);

          // 新建一个空对象, 并标记这个interface对象是否必填
          let newInterface = { isRequired: isRequired };
          resultJson.interfaceData[requestInterfaceName] = newInterface;
        } else {
          // 没有定义ref, 新建一个对象
          let interfaceContent = {};
          pathParams.forEach((item) => {
            interfaceContent[item.name] = {
              type: util.exchangeType(item.type),
              required: item.hasOwnProperty('required') ? item.required : false,
              desc: item.description || '',
            };
          });

          requestInterfaceName = `${pathMethod}${util.generateCamelName(pathName)}Request`;
          let newInterface = { content: interfaceContent };
          resultJson.interfaceData[requestInterfaceName] = newInterface;
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
            resultJson.interfaceData[interfaceName] = { isRequired: true };
          } else {
            const _ref = pathResponse.schema.$ref;
            responseInterfaceName = util.generateCamelName(_ref);
            resultJson.interfaceData[responseInterfaceName] = { isRequired: true };
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
      resultJson.functionData.push(codeObj);
    }
  }

  return resultJson;
}

/**
 * @function 解析swagger.json[definitions]
 * @param {
 *   paths: swagger.json[definitions]
 *   resultJson: 一个来自外部的通用空对象
 * }
 */
function analysisDefines(defines, resultJson) {
  if (!defines) {
    throw new Error('json文件中未找到类型定义, 请检查');
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
          : `${util.exchangeType(proObject.items.type)}[]`;
      } else {
        if (proObject.hasOwnProperty('$ref')) {
          _type = util.generateCamelName(proObject.$ref);
        } else {
          _type = util.exchangeType(proObject.type);
        }
      }

      subObj = {
        desc: proObject.description || '',
        type: _type,
      };

      interfaceObj[defName] = subObj;
    }

    if (resultJson.interfaceData.hasOwnProperty(interfaceName)) {
      resultJson.interfaceData[interfaceName].content = interfaceObj;
    } else {
      resultJson.interfaceData[interfaceName] = { content: interfaceObj };
    }
  }

  return resultJson;
}
