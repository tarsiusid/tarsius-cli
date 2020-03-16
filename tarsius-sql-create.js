#!/usr/bin/env node
const p = require('commander');
const pkg = require('./package.json');
const s = require('shelljs');
const logger = require('./utils').log;
const manifest = require('./utils').manifest;
const os = require('os');
const i = require('inquirer');
const tshome = os.homedir() + "/.tarsius";
const tsdbconfig = tshome + "/db.json"
const pg = require('pg');
const async = require('async');
const fs = require('fs');

p
    .version(pkg.version)
    .option('-f, --file <tarsius.yml>', 'set specific sdml tarsius db model [tarsius.yml]', "tarsius.yml")
    .parse(process.argv)

var config = {
    user: 'root',
    host: 'localhost',
    database: 'tarsius',
    port: 26257
};

if (fs.existsSync(tsdbconfig)) {
    config = require(tsdbconfig);
}

var pool = new pg.Pool(config);

let dbExec = (query) => {
    pool.connect(function (err, client, done) {

        var finish = function () {
            done();
            process.exit();
        };

        if (err) {
            console.error('could not connect to cockroachdb', err);
            finish();
        }
        async.waterfall([
            function (next) {
                client.query(query, next);
            }
        ],
            function (err, results) {
                if (err) {
                    console.error('Error: ', err.hint);
                    finish();
                }

                console.log(results);
                finish();
            });
    });
}

let tables = manifest(p, "ERROR : db model file not found").tables;
let tableList = Object.keys(tables);
let queryList = []

tableList.forEach((table) => {
    let fields = tables[table];
    let tableName = table;
    let queryFields = [];
    let primaryKey = [];
    Object.keys(fields).forEach((f) => {
        let field = {
            name: null,
            type: null,
            notNull: false,
            primaryKey: false,
            relationTable: null,
            relationField: null,
            isUnique: false,
            isCascade: false
        }
        field.name = f;
        // check forigein key or not
        let checkFK = fields[f].type.split(".");
        if(checkFK.length == 2){
            if(tables[checkFK[0]][checkFK[1]].type){
                if(tables[checkFK[0]][checkFK[1]].type == "serial"){
                    field.type = "int";
                }
                else{
                    field.type = tables[checkFK[0]][checkFK[1]].type;
                }
                field.relationTable = checkFK[0];
                field.relationField = checkFK[1];
            }
            else{
                console.log(logger.error("Can't find table relation "+fields[f].type))
                process.exit(0);
            }
        }
        else{
            field.type = fields[f].type;
        }

        field.notNull = fields[f].notNull ? true : false;
        field.primaryKey = fields[f].primaryKey ? true : false;
        field.isUnique = fields[f].isUnique ? true : false;
        field.isCascade = fields[f].isCascade ? true : false;

        let queryField = [field.name, field.type];
        if (field.notNull) {
            queryField.push("NOT NULL");
        }

        if (field.isUnique) {
            queryField.push("UNIQUE");
        }

        if (field.primaryKey) {
            //queryField.push("PRIMARY KEY")
            primaryKey.push(f);
            if(field.type.toLowerCase() === 'uuid'){
                queryField.push("DEFAULT gen_random_uuid()");
            }
        }

        if (field.relationTable && field.relationField){
            queryField.push(`REFERENCES ${field.relationTable}(${field.relationField})`);
            primaryKey.push(f);
            if(field.isCascade){
                queryField.push("ON DELETE CASCADE ON UPDATE CASCADE");
            }
        }

        queryFields.push(queryField.join(" "));
    });
    let query = "CREATE TABLE IF NOT EXISTS " + tableName + "(" + queryFields.join(",") + ", PRIMARY KEY ("+primaryKey.join(",")+"));";
    queryList.push(query);
});

let queryListQuestion = []
queryList.forEach((q)=>{
    queryListQuestion.push({name:q,checked: true});
});

let questions = [
    {
        type: 'checkbox',
        message: 'This query will be execute :',
        name: 'query',
        choices: queryListQuestion
    }
]
i
    .prompt(questions)
    .then(function (answers) {
        let q = answers.query.join("");
        dbExec(q);
        
    })