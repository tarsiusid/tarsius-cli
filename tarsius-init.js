#!/usr/bin/env node
const p = require('commander');
const pkg = require('./package.json');
const s = require('shelljs');
const logger = require('./utils').log;
const manifest = require('./utils').manifest;
const writeFile = require('./utils').writeFile;
const os = require('os');
const path = require('path');
const i = require('inquirer');
const tshome = os.homedir() + "/.tarsius";
const tsdbconfig = tshome + "/db.json"
const tsdir = path.resolve(__dirname);
const tsstackdir = tsdir + "/template/stacks";
const pg = require('pg');
const async = require('async');
const fs = require('fs');
const ejs = require('ejs');
const spawn = require('child_process').spawn;

p
    .version(pkg.version)
    .option('-s, --stack <langauge_stack>', 'set language stack, eg: go', 'go')
    .option('-p, --project-name <project_name>', 'set project name, eg: example', '.')
    .option('-f, --file <tarsius.yml>', 'set specific sdml tarsius db model [tarsius.yml]', "tarsius.yml")
    .parse(process.argv)


String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

let tsManifest = manifest(p, "ERROR : db model file not found");
let tables = tsManifest.tables;
let cache = tsManifest.cache;
let acls = tsManifest.acls;
let readParams = tsManifest.readParams;
let listParams = tsManifest.listParams;
let stack = p.stack;
let project = p.projectName;

let tableList = Object.keys(tables);
let queryList = []

tableList.forEach((table) => {
    let fields = tables[table];
    let doCached = {};
    let doReadParams = [];
    let doListParams = [];
    let ACLs = acls[table];
    if (table in cache) {
        doCached = cache[table]
    }
    if (table in readParams){
        doReadParams = readParams[table];
    }
    if (table in listParams){
        doListParams = listParams[table];
    }

    let tableName = table;
    let queryFields = [];
    Object.keys(fields).forEach((f) => {
        let field = {
            name: null,
            type: null,
            relationTable: null,
            relationField: null,
            relationListField: null,
            notNull: false,
            isIdentifier: false,
            graphQL: {
                tableName: null,
                fieldName: null,
                type: null
            }
        }
        field.name = f;
        field.type = fields[f].type.replace(/\(([0-9\s])+\)/gm, "").replace(" ", "");
        // check forigein key or not
        let checkFK = field.type.split(".");
        if (checkFK.length == 2) {
            if (tables[checkFK[0]][checkFK[1]].type) {
                field.type = tables[checkFK[0]][checkFK[1]].type;
                field.relationTable = checkFK[0];
                field.relationField = checkFK[1];
                field.relationListField = Object.keys(tables[checkFK[0]]);
            }
            else {
                console.log(logger.error("Can't find table relation " + fields[f].type))
                process.exit(0);
            }
        }

        let fieldType;
        let graphQLType;
        switch (field.type) {
            case 'varchar':
                fieldType = 'string';
                graphQLType = 'String';
                break;
            case 'text':
                fieldType = 'string';
                graphQLType = 'String';
                break;
            case 'int':
                fieldType = 'int';
                graphQLType = 'Int';
                break;
            case 'date':
                fieldType = 'time.Time';
                graphQLType = 'String';
                break;
            case 'serial':
                fieldType = 'int';
                graphQLType = 'Int';
                break;
            case 'uuid':
                fieldType = 'string';
                graphQLType = 'String';
                break;
            case 'timestamp':
                fieldType = 'time.Time';
                graphQLType = 'DateTime';
                break;
            case 'timestamptz':
                fieldType = 'time.Time';
                graphQLType = 'DateTime';
                break;
            case 'bool':
                fieldType = 'bool';
                graphQLType = 'Boolean';
                break;
            default:
                console.log(logger.error("ERROR: parsing data type on table ") + logger.warn(tableName) + logger.error(" and field ") + logger.warn(field.name));
                process.exit(0);
        }

        field.notNull = fields[f].notNull ? true : false;
        field.isIdentifier = fields[f].primaryKey ? true : false;
        field.type = fieldType;
        field.graphQL.tableName = tableName.capitalize();
        field.graphQL.fieldName = f.capitalize();
        if (fields[f].primaryKey) {
            field.graphQL.type = "ID";
        }
        else {
            field.graphQL.type = graphQLType;
        }

        queryFields.push(field);
    });
    let queryTable = { table: tableName, field: queryFields, cache: doCached, acls: ACLs, readParams: doReadParams, listParams: doListParams };
    queryList.push(queryTable);
});

//console.log(JSON.stringify(tsManifest,null,2));
//console.log(JSON.stringify(queryList,null,2));

const pwd = path.join(process.cwd(), p.projectName);
const svcName = path.basename(pwd);
const projectName = svcName.replace("svc-", "");
let appJSON = require(tsstackdir + "/" + stack + "/app.json");
let appListTmp = [];
appJSON.templates.forEach((f) => {
    appListTmp.push(tsstackdir + "/" + stack + "/" + f);
});
console.log(logger.green("COPY template to project directory"));
s.cp("-rf", appListTmp, project);
s.cp("-rf", tsstackdir + "/" + stack + "/gitignore", project + "/.gitignore")
s.sed('-i', '<project_name>', projectName, project + "/.gitignore");

console.log(logger.green("SET project name"));
appJSON.templates.forEach((file) => {
    s.sed('-i', '<project_name>', projectName, file);
    s.sed('-i', '<service_name>', svcName, file);
})

console.log(logger.green("CHECK orcinus env"));
if(!fs.existsSync("orcinus.yml")){
    s.cp("-rf",tsstackdir + "/" + stack + "/orcinus.yml",project+"/orcinus.yml")
    s.sed('-i', '<project_name>', projectName, "orcinus.yml");
    s.sed('-i', '<service_name>', svcName, "orcinus.yml");
}

console.log(logger.green("GENERATE code......"));
templateString = fs.readFileSync(tsstackdir + "/" + stack + "/main.ejs", 'utf-8');

let templateRender = ejs.render(templateString, { data: queryList });
if (stack == "go") {
    writeFile(project + "/main.go", templateRender);
    console.log(logger.green("INITIALIZE Go lang dep......"));
    const init = spawn("make", ["init-dev"]);
    init.stdout.on('data', (data) => {
        console.log(logger.green(`stdout: ${data}`));
    });

    init.stderr.on('data', (data) => {
        console.log(logger.red(`stderr: ${data}`));
    });

    init.on('close', (code) => {
        console.log(logger.green(`child process exited with code ${code}`));
    });
}


