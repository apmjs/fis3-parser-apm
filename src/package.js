import {spawnSync} from 'child_process';
import fs from 'fs';
import path from 'path';

export default class Package {
    constructor(name, meta, dir) {
        this.name = name;
        this.meta = meta;
        this.dir = dir;
        this.main = this.getMain(meta.main, meta.browser);
        this.mainPath = path.resolve(dir, this.main);
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
        let bin = require.resolve('madge/bin/cli');
        let result = spawnSync('node', [bin, this.mainPath, '--json']);
        if (result.status === 1) {
            throw result.error || new Error(String(result.stderr) || String(result.stdout));
        }
        let graph = JSON.parse(String(result.stdout));
        this.files = Object.keys(graph).map(file => './' + file);
        return this.files;
    }
    static create(name, modulesPath) {
        let cache = Package.cache;
        if (cache[name]) {
            return cache[name];
        }
        let pkgPath = path.resolve(modulesPath, name);
        let meta = Package.loadJson(path.resolve(pkgPath, 'package.json'));
        cache[name] = new Package(name, meta, pkgPath);
        return cache[name];
    }
    static loadJson(file) {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
}

Package.cache = {};
