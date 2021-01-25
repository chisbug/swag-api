#!/usr/bin/env node
const { Command } = require('commander');

const program = new Command();

program
  .version('0.0.1', '-V, --version')
  .command('create <url> <path>')
  .action(require('./create'));

program.parse(process.argv);
