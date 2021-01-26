#!/usr/bin/env node
const { Command } = require('commander');
const create = require('./src/create');

const program = new Command();

program
  .version('0.0.9', '-v, --version')
  .option(
    '-r, --request',
    '如需生成request.ts模板文件, 请使用此参数, 否则勿传, 以免覆盖已有文件!',
    false
  )
  .command('create <url> <path>')
  .action((url, path) => {
    create(url, path, program.opts());
  });

program.parse(process.argv);
