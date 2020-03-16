#!/usr/bin/env node

const program = require('commander');
const pkg = require('./package.json');

program
  .name('tarsius-cli')
  .version(pkg.version)
  // Register your module here
  .command('init', 'Initial new project')
  .command('sql', 'a sql command')
  .command('docker', 'a docker command')
  .command('build','a build your own binary')
  .command('run', 'a run project command')
  .parse(process.argv)
