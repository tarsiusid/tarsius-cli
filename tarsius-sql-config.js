#!/usr/bin/env node
const p = require('commander');
const pkg = require('./package.json');
const s = require('shelljs');
const logger = require('./utils').log;
const writeFile = require('./utils').writeFile;
const fs = require('fs');
const os = require('os');
const i = require('inquirer');
const tshome = os.homedir() + "/.tarsius";
const tsdbconfig = tshome + "/db.json"

p
    .version(pkg.version)
    .parse(process.argv)


let prompt = (conf=null)=>{
    if(!conf){
        conf = {"host":"127.0.0.1","user":"root","password":"","port":26257,"database":"tarsius"}
    }
    let questions = [
        { type: 'input', name: 'host', message: 'hostname :', default: conf.host },
        { type: 'input', name: 'user', message: 'user :', default: conf.user },
        { type: 'input', name: 'password', message: 'password :', default: conf.password },
        { type: 'input', name: 'port', message: 'port :', default: conf.port },
        { type: 'input', name: 'database', message: 'db name :', default: conf.database }
    ]
    i
        .prompt(questions)
        .then(function (answers) {
            try{
                console.log(logger.green("Write db config file to "+tsdbconfig));
                writeFile(tsdbconfig,JSON.stringify(answers));
            }
            catch(e){
                console.log(e)
            }
        })
}
if (!fs.existsSync(tshome)) s.mkdir("-p", tshome)
if (!fs.existsSync(tsdbconfig)) {
    prompt()
}
else{
    let conf = require(tsdbconfig);
    prompt(conf)
}