import Package from '../src/package.js';

const originLoadJson = Package.loadJson;
export const dir = __dirname;

function stubLoadJson(file) {
    let json = originLoadJson(file);
    if (file.match(/index.json/)) {
        json.forEach(entry => {
            entry.fullpath = entry.fullpath.replace(/STUB_DIR/g, dir);
        });
    }
    return json;
}

export function mock() {
    Package.loadJson = stubLoadJson;
    Package.cache = {};
}

export function restore() {
    Package.loadJson = originLoadJson;
}

