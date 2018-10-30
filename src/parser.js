import fs from 'fs';
import path from 'path';
import Package from './package.js';

const SEP = new RegExp('\\' + path.sep, 'g');
const defaultPath2url = x => JSON.stringify(x.replace(/\.js$/, ''));
let singleton;

export default class Parser {
    constructor(projectPath) {
        this.modulesPath = this.resolveModulesPath(projectPath);
        this.projectPath = path.resolve(projectPath);
    }
    static create(projectPath) {
        if (!singleton) {
            singleton = new Parser(projectPath);
        }
        return singleton;
    }
    inlinePackage(id) {
        let file = path.resolve(this.modulesPath, id) + '.js';
        let relative = this.relativePath(file);
        return '__inline(' + JSON.stringify(relative) + ');';
    }
    amdConfig(path2url) {
        let config = {};
        path2url = path2url || defaultPath2url;
        Package.getInstalledPackageDirs(this.modulesPath)
        .forEach(dir => {
            let file = dir + '.js';
            let relativePath = this.relativePath(file);
            let url = path2url(relativePath).replace(/^"/, '').replace(/"$/, '');
            let id = this.amdID(file);
            config[id] = url;
        });
        return JSON.stringify(config, null, 4);
    }
    relativePath(fullpath) {
        return fullpath.replace(this.projectPath, '').replace(SEP, '/');
    }
    amdID(fullpath) {
        return fullpath.replace(this.modulesPath, '')
            .replace(/\.js$/, '')
            .replace(SEP, '/')
            .replace(/^\//, '');
    }
    resolveModulesPath(projectPath) {
        let filepath = this.findPackageJson(projectPath);
        if (!filepath) {
            return path.resolve(projectPath, 'amd_modules');
        }
        let pkg = Package.loadJson(filepath);
        let relativePath = pkg.amdPrefix || 'amd_modules';
        return path.resolve(filepath, '..', relativePath);
    }
    findPackageJson(dir) {
        let pathname = path.resolve(dir, 'package.json');
        if (fs.existsSync(pathname)) {
            return pathname;
        }
        let parent = path.resolve(dir, '..');
        if (parent === dir) {
            return null;
        }
        return this.findPackageJson(parent);
    }
    parse(content, file, settings) {
        if (settings.package) {
            let inlines = Package.getDependencies(file.fullname)
                .filter(fullname => fullname !== file.fullname)
                .map(file => this.relativePath(file))
                .map(path => '__inline(' + JSON.stringify(path) + ');');
            return content + '\n' + inlines.join('\n');
        }

        return content
        .replace(
            /__inlinePackage\(['"](.*)['"]\)/g,
            (match, id) => this.inlinePackage(id)
        )
        .replace(
            /__AMD_CONFIG/g,
            () => this.amdConfig(settings.path2url)
        );
    }
}
