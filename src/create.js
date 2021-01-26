const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const axios = require('axios');
const generate = require('./generate');
const util = require('./util');

const logG = (content) => {
  console.log(chalk.green(content));
};
const logY = (content) => {
  console.log(chalk.yellow(content));
};
const logB = (content) => {
  console.log(chalk.blue(content));
};

module.exports = async (url, filePath, opts) => {
  console.log('---------------------------------------------------------------------------------');
  logY('📎 Get swagger.json: ' + url);

  const dataJson = await axios.get(url).then((res) => {
    return res.data;
  });
  const result = generate(dataJson);

  logG('⚙️  Wroking...');

  try {
    // check folder exits
    await util.exitsFolder(path.dirname(filePath));

    // copy request.ts
    if (opts.request) {
      const fromFile = path.resolve(__dirname, './request.ts');
      const toFile = path.resolve(path.dirname(filePath), './request.ts');
      fs.copyFile(fromFile, toFile, 0, () => {
        logB(`🗄️  Create request.ts: ${toFile}`);
      });
    }

    // create api.ts
    fs.writeFile(filePath, result, 'utf8', (err) => {
      if (err !== null) {
        console.log(err);
        return;
      }

      logB(`🗄️  Create api.ts: ${path.resolve('./', filePath)}`);
      logG(`✔️  Completed!`);
      console.log(
        '---------------------------------------------------------------------------------'
      );
    });
  } catch (e) {
    throw Error(e.msg);
  }
};
