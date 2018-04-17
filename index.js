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
const cache = {};
const root = fis.project.getProjectPath();

module.exports = function (content, file, settings) {
    return content
    .replace(/__inlinePackage\(['"](.*)['"]\)/g,
        (match, id) => extractPackage(id)
        .map(item => `__inline("${item.relative}")`)
        .join('\n')
    )
    .replace(/__AMD_CONFIG/g, () => {
        let lines = extractAll(settings.path2url)
        .map(item => `    '${item.id}': ${item.url}`)
        .join(',\n');

        return '{\n' + lines + '\n}';
    });
};

module.exports.extractAll = extractAll;
module.exports.extractAllFiles = function (transformer) {
    return extractAll(transformer).map(item => item.relative);
};

function getPackageEntry(id) {
    let entry = index[id];
    if (!entry) {
        throw new Error(`无法 inline 包 ${id}，是不是没安装？`);
    }
    return entry;
}

function extractAll(transformer) {
    let modules = [];
    transformer = transformer || (x => x);

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
    if (!cache[id]) {
        let entry = getPackageEntry(id);
        let bin = require.resolve('madge/bin/cli');
        let script = `${bin} ${entry.fullpath} --json`;
        let result = spawnSync('bash', ['-c', script]);

        if (result.status === 1) {
            throw result.error || new Error(String(result.stdout))
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
                let relative = fullpath.replace(root, '');
                let id = fullpath.replace(modulePath, '')
                .replace(/^\//, '')
                .replace(/\.js$/, '');
                return {id, relative};
            });
        files.push({
            id,
            relative: JSON.stringify(path.resolve(modulePath, id + '.js').replace(root, ''))
        });

        cache[id] = files;
    }
    return cache[id];
}

function findModulePath() {
    let filepath = findPackageJson(process.cwd());
    if (!filepath) {
        return path.resolve(process.cwd(), 'amd_modules');
    }
    let pkg = loadJson(filepath);
    let relative = pkg.amdPrefix || 'amd_modules';
    return path.resolve(filepath, '..', relative);
}

function findPackageJson(dir) {
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
