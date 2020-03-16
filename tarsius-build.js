#!/usr/bin/env node
const p = require('commander');
const pkg = require('./package.json');
const spawn = require('child_process').spawn;
const logger = require('./utils').log;
const path = require('path')

p
    .version(pkg.version)
    .option('-p, --project-name <project_name>', 'set project name, default: .', '.')
    .parse(process.argv)

console.log(logger.green("PUSH docker images......"));

const pwd = path.join(process.cwd(), p.projectName);
const makeFile = pwd+"/Makefile"

const init = spawn("make", ["-f",makeFile,"build"]);
init.stdout.on('data', (data) => {
    console.log(logger.green(`stdout: ${data}`));
});

init.stderr.on('data', (data) => {
    console.log(logger.red(`stderr: ${data}`));
});

init.on('close', (code) => {
    console.log(logger.green(`child process exited with code ${code}`));
});