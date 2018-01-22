/**
 * @file
 * @author harttle<harttle@harttle.com>
 */
const fs = require('fs');
const path = require('path');
const process = require('process');
const madge = require('madge');
const spawnSync = require('child_process').spawnSync;
const modulePath = findModulePath();
const index = packageIndex();

module.exports = function (content, file, settings) {
    return content.replace(/__inline_package\(['"](.*)['"]\)/g, function (match, id) {
        let files = extractPackage(id);
        let contents = files.map(file => fs.readFileSync(file, 'utf8'));
        return contents.join('\n');
    });
};

function getPackageEntry(id) {
    let entry = index[id];
    if (!entry) {
        throw new Error(`无法 inline 包 ${id}，是不是没安装？`);
    }
    return entry.fullpath;
}

function extractPackage(id) {
    let filepath = getPackageEntry(id);
    let script = `\`npm bin\`/madge ${filepath} --json`;
    let result = spawnSync('bash', ['-c', script]);

    if (result.status === 1) {
        throw result.error;
    }
    let graph = JSON.parse(String(result.stdout));
    return Object.keys(graph);
}

function findModulePath() {
    let filepath = findPackageJson();
    if (!filepath) {
        return path.resolve(process.cwd(), 'amd_modules');
    }
    let pkg = require(filepath);
    let modulePath = pkg.amdPrefix || 'amd_modules';
    return path.resolve(filepath, '..', modulePath);
}

function findPackageJson() {
    let dir = process.cwd();
    let pathname = path.resolve(dir, 'package.json');
    if (fs.existsSync(pathname)) {
        return pathname;
    }
    let parent = path.resolve(dir, '..');
    // root exceeded
    if (parent === dir) {
        return null;
    }
    return findPackageJson(parent);
}

function packageIndex() {
    let indexPath = path.resolve(modulePath, 'index.json');
    let packages = require(indexPath);
    let index = {};
    packages.forEach(pkg => (index[pkg.name] = pkg));
    return index;
}

