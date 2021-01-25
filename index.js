#!/usr/bin/env node
const { Command } = require('commander');

const program = new Command();

program
  .version('0.0.6', '-v, --version')
  .command('create <url> <path>')
  .action(require('./src/create'));

program.parse(process.argv);
