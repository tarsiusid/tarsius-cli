const fs = require('fs');
let colors = require('colors/safe');
const yaml = require('js-yaml');

colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

const buildCached = (tsfile,manifest,table) => {
    tsfile.cache[table] = {
        scopeRead : false,
        scopeList : false,
        scopeCreate : false,
        scopeDelete : false,
        scopeUpdate : false
    }
    let isCached = false;
    Object.keys(manifest).forEach(acl => {
        let expired = 1;
        //console.log((typeof(manifest[acl]) === 'object') && ('cache' in manifest[acl]))
        if((typeof(manifest[acl]) === 'object') && ('cache' in manifest[acl])){
            if(typeof(manifest[acl].cache) === 'object' && 'expired' in manifest[acl].cache){
                tsfile.cache[table]['scope'+acl.capitalize()] = manifest[acl].cache.expired;
                isCached = true;
            }
            else {
                if(manifest[acl].cache){
                    tsfile.cache[table]['scope'+acl.capitalize()] = expired;
                    isCached = true;
                }
                else{
                    tsfile.cache[table]['scope'+acl.capitalize()] = manifest[acl].cache;
                }
            }
        }
    });
    if(!isCached){
        tsfile.cache[table] = {};
    }
}

const buildParams = (tsfile,manifest,table,acls) => {
    if(acls === 'read' || acls === 'list'){
        if(manifest[acls] && manifest[acls].params && (manifest[acls].params.length > 0)){
            tsfile[acls+"Params"][table] = manifest[acls].params
        }
    }
}

module.exports = {
    writeFile: (path, data) => {
        try {
            fs.writeFile(path, data, function (err) {
                if (err) {
                    return console.log(err);
                }
            });
        }
        catch (e) {
            return false;
        }
        return true;
    },
    log: colors,
    manifest: (p,errorMsg="ERROR") => {
        if (!fs.existsSync(p.file) && !fs.existsSync("tarsius.yml")) {
            console.log(colors.error(errorMsg));
            p.outputHelp();
            process.exit(0);
        }
        
        let tsfile;
        try {
            tsfile = {
                tables : {},
                cache : {},
                acls : {},
                readParams : {},
                listParams : {}
            }
            let manifest = yaml.safeLoad(fs.readFileSync(p.file, 'utf8'));
            // parse tables
            Object.keys(manifest.objects).forEach((table)=>{
                if(typeof(manifest.objects[table].fields) == 'string'){
                    let include = manifest.objects[table].fields;
                    if(fs.lstatSync(include).isFile()){
                        let manifestDep = yaml.safeLoad(fs.readFileSync(include, 'utf8'));
                        tsfile.tables[table] = manifestDep.objects[table].fields;
                        let acls = manifest.objects[table].acls;
                        tsfile.acls[table] = Object.keys(acls);
                        buildCached(tsfile,acls,table)
                        buildParams(tsfile, acls,table,"read");
                        buildParams(tsfile, acls,table,"list");
                    }
                }
                else {
                    tsfile.tables[table] = manifest.objects[table].fields;
                    let acls = manifest.objects[table].acls;
                    tsfile.acls[table] = Object.keys(acls);
                    buildCached(tsfile,acls,table)
                    buildParams(tsfile, acls,table,"read");
                    buildParams(tsfile, acls,table,"list");
                }
            });
        } catch (e) {
            console.log(e);
            process.exit(0);
        }
        return tsfile;
    }

}