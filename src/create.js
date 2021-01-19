const fs = require("fs");
const chalk = require("chalk");
const request = require("./request");
const generate = require("./generate");

const logG = (content) => {
  console.log(chalk.green(content));
};
const logY = (content) => {
  console.log(chalk.yellow(content));
};
const logB = (content) => {
  console.log(chalk.blue(content));
};

module.exports = async (url, path) => {
  logG("swagger url: " + url);
  logG("保存路径: " + path);
  const dataJson = await request(url);
  const result = await generate(dataJson);
  logY(
    "-------------------- 👌 获取swagger json成功, 开始生成代码 --------------------"
  );
  fs.writeFile("dist/api.ts", result, "utf8", (err) => {
    logB(`👌 保存成功:
  ${path}`);
  });
};
