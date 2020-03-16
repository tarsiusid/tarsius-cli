#!/usr/bin/env node
const p = require('commander');
const pkg = require('./package.json');

p
    .version(pkg.version)
    .command('build', 'build docker image')
    .command('push', 'push docker image to registry')
    .parse(process.argv)
