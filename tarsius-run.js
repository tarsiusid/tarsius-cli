#!/usr/bin/env node
const p = require('commander');
const pkg = require('./package.json');
const s = require('shelljs');
const logger = require('./utils').log;
const os = require('os');
const path = require('path');
const fs   = require('fs');
const spawn = require('child_process').spawn;

p
  .version(pkg.version)
  .option('-p, --project-name <project_name>','set project name, eg: example','.')
  .parse(process.argv)

const pwd  = path.join(process.cwd(), p.projectName);
let app = require(pwd+"/app.json").run;
let exec = spawn(app[0],app.slice(1));
exec.stdout.on('data', (data) => {
  console.log(logger.green(`stdout: ${data}`));
});

exec.stderr.on('data', (data) => {
  console.log(logger.red(`stderr: ${data}`));
});

exec.on('close', (code) => {
  console.log(logger.green(`child process exited with code ${code}`));
});
