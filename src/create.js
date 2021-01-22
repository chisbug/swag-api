const fs = require('fs');
const chalk = require('chalk');
const request = require('./request');
const generate = require('./generate');

const logG = (content) => {
  console.log(chalk.green(content));
};
const logY = (content) => {
  console.log(chalk.yellow(content));
};
const logB = (content) => {
  console.log(chalk.blue(content));
};

module.exports = async (url, filePath) => {
  console.log('---------------------------------------------------------------------');
  logY('📎 获取swagger.json: ' + url);

  const dataJson = await request(url);
  const result = generate(dataJson);

  logG('⚙️  开始生成代码');
  
  fs.writeFile(filePath, result, 'utf8', (err) => {
    if (err !== null) {
      console.log(err);
      return;
    }

    logB(`🗄️  文件已保存在: [${filePath}]`);
    logB(`✔️  完成`);
    console.log('---------------------------------------------------------------------');
  });
};
