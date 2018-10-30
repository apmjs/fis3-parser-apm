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
        let pkg = Package.create(path.resolve(this.modulesPath, id, 'package.json'));
        return pkg.getFiles()
        .map(file => this.relativePath(file))
        .map(path => '__inline(' + JSON.stringify(path) + ');')
        .join('\n');
    }
    amdConfig(path2url) {
        let config = {};
        path2url = path2url || defaultPath2url;
        Package.getInstalledPackages(this.modulesPath)
        .forEach(pkg => pkg.getFiles().forEach(file => {
            let relativePath = this.relativePath(file);
            let url = path2url(relativePath).replace(/^"/, '').replace(/"$/, '');
            let id = this.amdID(file);
            config[id] = url;
        }));
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
    parse(content, settings) {
        let result = '';

        if (settings.inline) {
        }

        result += content
        .replace(
            /__inlinePackage\(['"](.*)['"]\)/g,
            (match, id) => this.inlinePackage(id)
        )
        .replace(
            /__AMD_CONFIG/g,
            () => this.amdConfig(settings.path2url)
        );
        return result;
    }
}
