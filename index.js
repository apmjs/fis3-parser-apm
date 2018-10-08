/**
 * @file
 * @author harttle<yangjvn@126.com>
 */
import fs from 'fs';
import path from 'path';
import process from 'process';
import {spawnSync} from 'child_process';

const pathSep = new RegExp('\\' + path.sep, 'g');

let modulePath;
let index;
let cache;
let projectPath;

module.exports = function (content, file, settings) {
    if (!modulePath) {
        module.exports.setRoot(process.cwd(), fis.project.getProjectPath());
    }
    return content
    .replace(/__inlinePackage\(['"](.*)['"]\)/g,
        (match, id) => extractPackage(id)
        .map(item => '__inline(' + JSON.stringify(item.relative) + ');')
        .join('\n')
    )
    .replace(/__AMD_CONFIG/g, () => {
        let lines = extractAll(settings.path2url)
        .map(item => `    '${item.id}': ${item.url}`)
        .join(',\n');

        return '{\n' + lines + '\n}';
    });
};

module.exports.setRoot = function (cwd, pathname) {
    cache = {};
    modulePath = findModulePath(cwd);
    index = packageIndex();
    projectPath = path.resolve(pathname);
};

function extractAllFiles(transformer) {
    return extractAll(transformer).map(item => item.relative);
}

function getPackageEntry(id) {
    let entry = index[id];
    if (!entry) {
        throw new Error(`无法 inline 包 ${id}，是不是没安装？`);
    }
    return entry;
}

function extractAll(transformer) {
    let modules = [];
    transformer = transformer || (x => JSON.stringify(x.replace(/\.js$/, '')));

    Object
    .keys(index)
    .forEach(key => extractPackage(key)
        .forEach(item => {
            item.url = transformer(item.relative);
            modules.push(item);
        })
    );
    return modules;
}

function extractPackage(id) {
    id = id.replace(pathSep, '/');
    if (!cache[id]) {
        let entry = getPackageEntry(id);
        let bin = require.resolve('madge/bin/cli');
        if (!entry.fullpath) {
            throw new Error(`index.json文件下${entry.name}模块的fullpath字段缺失`);
        }
        let result = spawnSync('node', [bin, entry.fullpath, '--json']);
        if (result.status === 1) {
            if (result.stderr) {
                throw new Error(`未找到${entry.fullpath}对应的文件`)
            }
            throw result.error || new Error(String(result.stdout));
        }
        let graph;
        let output = String(result.stdout);
        try {
            graph = JSON.parse(output);
        }
        catch (e) {
            e.message += 'cannot parse dependencies: ' + result.stdout;
            throw e;
        }
        let dirname = path.dirname(entry.fullpath);
        let files = Object
            .keys(graph)
            .map(file => {
                let fullpath = path.resolve(dirname, file);
                let relative = fullpath
                .replace(projectPath, '')
                .replace(pathSep, '/');
                let id = fullpath.replace(modulePath, '')
                .replace(/\.js$/, '')
                .replace(pathSep, '/')
                .replace(/^\//, '');
                return {id, relative};
            });
        let entryFile = path
            .resolve(modulePath, id + '.js')
            .replace(projectPath, '')
            .replace(pathSep, '/');

        files.push({
            id,
            relative: entryFile
        });

        cache[id] = files;
    }
    return cache[id];
}

function findModulePath(cwd) {
    let filepath = findPackageJson(cwd);
    if (!filepath) {
        return path.resolve(cwd, 'amd_modules');
    }
    let pkg = module.exports.loadJson(filepath);
    let relative = pkg.amdPrefix || 'amd_modules';
    return path.resolve(filepath, '..', relative);
}

function findPackageJson(dir) {
    let pathname = path.resolve(dir, 'package.json');
    if (fs.existsSync(pathname)) {
        return pathname;
    }
    let parent = path.resolve(dir, '..');
    if (parent === dir) {
        return null;
    }
    return findPackageJson(parent);
}

function packageIndex() {
    let indexPath = path.resolve(modulePath, 'index.json');
    let packages = module.exports.loadJson(indexPath);
    let index = {};
    packages.forEach(pkg => (index[pkg.name] = pkg));
    return index;
}

function loadJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

module.exports.extractAll = extractAll;
module.exports.loadJson = loadJson;
module.exports.extractAllFiles = extractAllFiles;
