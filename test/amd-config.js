/**
 * @file
 * @author harttle<yangjvn@126.com>
 */
import parser from '../index';
import path from 'path';
import {expect} from 'chai';

const STUB_DIR = path.resolve(__dirname, '../stub');
const originLoadJson = parser.loadJson;

describe('__AMD_CONFIG', function () {
    before(function () {
        parser.loadJson = file => {
            let json = originLoadJson(file);
            if (file.match(/index.json/)) {
                json.forEach(entry => {
                    entry.fullpath = entry.fullpath.replace(/STUB_DIR/g, STUB_DIR);
                });
            }

            return json;
        };
    });
    after(function () {
        parser.loadJson = originLoadJson;
    });
    it('should generate AMD config', function () {
        var cwd = path.resolve(STUB_DIR, 'simple');
        parser.setRoot(cwd, cwd);
        let src = '__AMD_CONFIG';
        let result = parser(src, null, {});
        expect(result).to.equal(`{
    'foo/index': "/amd_modules/foo/index",
    'foo': "/amd_modules/foo"
}`);
    });
    it('should respect to amdPrefix', function () {
        var cwd = path.resolve(STUB_DIR, 'prefixed');
        parser.setRoot(cwd, cwd);
        let src = '__AMD_CONFIG';
        let result = parser(src, null, {});
        expect(result).to.equal(`{
    'foo/index': "/assets/3rd-party/foo/index",
    'foo': "/assets/3rd-party/foo"
}`);
    });
    it('should respect to path2url', function () {
        var cwd = path.resolve(STUB_DIR, 'simple');
        parser.setRoot(cwd, cwd);
        let src = '__AMD_CONFIG';
        let path2url = x => '"http://example.org/assets' + x.replace('.js', '') + '"';
        let result = parser(src, null, {path2url});
        expect(result).to.equal(`{
    'foo/index': "http://example.org/assets/amd_modules/foo/index",
    'foo': "http://example.org/assets/amd_modules/foo"
}`);
    });
});
