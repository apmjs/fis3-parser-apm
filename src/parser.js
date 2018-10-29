import fs from 'fs';
import path from 'path';
import Package from './package.js';

const SEP = new RegExp('\\' + path.sep, 'g');
let singleton;

export default class Parser {
    constructor(projectPath) {
        this.cache = {};
        this.modulesPath = this.findModulesPath(projectPath);
        this.index = this.loadIndex(this.modulesPath);
        this.projectPath = path.resolve(projectPath);
    }
    static create(projectPath) {
        if (!singleton) {
            singleton = new Parser(projectPath);
        }
        return singleton;
    }
    inlinePackage(id) {
        return this.extractPackage(id)
        .map(item => '__inline(' + JSON.stringify(item.relativePath) + ');')
        .join('\n');
    }
    amdConfig(path2url) {
        let lines = this.extractAll(path2url)
        .map(item => `    '${item.id}': ${item.url}`)
        .join(',\n');
        return '{\n' + lines + '\n}';
    }
    extractAllFiles(transformer) {
        return this.extractAll(transformer).map(item => item.relativePath);
    }
    extractAll(transformer) {
        let modules = [];
        transformer = transformer || (x => JSON.stringify(x.replace(/\.js$/, '')));

        Object
        .keys(this.index)
        .forEach(key => this.extractPackage(key)
            .forEach(item => {
                item.url = transformer(item.relativePath);
                modules.push(item);
            })
        );
        return modules;
    }
    extractPackage(id) {
        id = id.replace(SEP, '/');
        if (this.cache[id]) {
            return this.cache[id];
        }
        let pkg = Package.create(id, this.modulesPath);
        let mainPath = pkg.mainPath;
        let dirname = path.dirname(mainPath);

        let files = pkg.getFiles()
            .map(file => {
                let fullpath = path.resolve(dirname, file);
                let relativePath = fullpath
                .replace(this.projectPath, '')
                .replace(SEP, '/');
                let id = fullpath.replace(this.modulesPath, '')
                .replace(/\.js$/, '')
                .replace(SEP, '/')
                .replace(/^\//, '');
                return {id, relativePath};
            });
        let relativePath = path
            .resolve(this.modulesPath, id + '.js')
            .replace(this.projectPath, '')
            .replace(SEP, '/');

        files.push({id, relativePath});
        this.cache[id] = files;
        return this.cache[id];
    }
    findModulesPath(projectPath) {
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
    loadIndex(modulesRoot) {
        let indexPath = path.resolve(modulesRoot, 'index.json');
        let packages = Package.loadJson(indexPath);
        let index = {};
        packages.forEach(pkg => (index[pkg.name] = pkg));
        return index;
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
