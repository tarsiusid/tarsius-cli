#!/usr/bin/env node
const p = require('commander');
const pkg = require('./package.json');

p
    .version(pkg.version)
    .command('config', 'config db connection')
    .command('create', 'create database')
    .parse(process.argv)
