import {spawnSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import glob from 'glob';

export default class Package {
    constructor(meta, pkgPath) {
        this.meta = meta;
        this.dir = path.dirname(pkgPath);
        this.name = meta.name || this.nameFromDir(this.dir);
        this.main = this.getMain(meta.main, meta.browser);
        this.mainPath = path.resolve(this.dir, this.main);
    }
    nameFromDir(dir) {
        let name = path.basename(dir);
        let parent = path.dirname(dir);
        let scope = path.basename(parent);
        return scope[0] === '@' ? scope + '/' + name : name;
    }
    getMain(main, browser) {
        main = main || 'index.js';
        if (!browser) {
            return main;
        }
        if (typeof browser === 'string') {
            return browser;
        }
        if (browser.main) {
            return browser.main;
        }
        return main;
    }
    getFiles() {
        if (this.files) {
            return this.files;
        }
        const prefix = this.dir + path.sep;
        this.files = Package
            .getDependencies(this.mainPath)
            .filter(fullname => fullname.indexOf(prefix) === 0);
        return this.files;
    }
    static getDependencies(entry) {
        let bin = require.resolve('madge/bin/cli');
        let result = spawnSync('node', [bin, entry, '--json']);
        if (result.status === 1) {
            throw result.error || new Error(String(result.stderr) || String(result.stdout));
        }
        let stdout = String(result.stdout);
        let graph;
        try {
            graph = JSON.parse(stdout);
        }
        catch (e) {
            console.error('failed to parse dependencies', stdout);
            throw e;
        }
        let dirname = path.dirname(entry);
        return Object.keys(graph).map(file => path.resolve(dirname, file));
    }
    static getInstalledPackageDirs(modulesPath) {
        let files = glob.sync('/{@*/*,*}/package.json', {root: modulesPath});
        return files.map(file => path.dirname(file));
    }
    static create(dir) {
        const pkgPath = path.resolve(dir, 'package.json')
        let cache = Package.cache;
        if (cache[pkgPath]) {
            return cache[pkgPath];
        }
        let meta = Package.loadJson(pkgPath);
        cache[pkgPath] = new Package(meta, pkgPath);
        return cache[pkgPath];
    }
    static loadJson(file) {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
}

Package.cache = {};
