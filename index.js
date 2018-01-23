/**
 * @file
 * @author harttle<harttle@harttle.com>
 */
import fs from 'fs';
import path from 'path';
import process from 'process';
import {spawnSync} from 'child_process';

const modulePath = findModulePath();
const index = packageIndex();

module.exports = function (content, file, settings) {
    let root = fis.project.getProjectPath();
    return content.replace(/__inline_package\(['"](.*)['"]\)/g, function (match, id) {
        return extractPackage(id)
        .map(filepath => filepath.replace(root, ''))
        .map(filepath => `__inline("${filepath}")`)
        .join('\n');
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
    let dirname = path.dirname(filepath);
    return Object.keys(graph).map(file => path.resolve(dirname, file));
}

function findModulePath() {
    let filepath = findPackageJson();
    if (!filepath) {
        return path.resolve(process.cwd(), 'amd_modules');
    }
    let pkg = loadJson(filepath);
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
    let packages = loadJson(indexPath);
    let index = {};
    packages.forEach(pkg => (index[pkg.name] = pkg));
    return index;
}

function loadJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}
