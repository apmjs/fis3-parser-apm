/**
 * @file
 * @author harttle<yangjvn@126.com>
 */
import parser from '../index';
import path from 'path';
import {expect} from 'chai';

const STUB_DIR = path.resolve(__dirname, '../stub');
const originLoadJson = parser.loadJson;

describe('#extractAll', function () {
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
    it('should include AMD entry file', function () {
        var cwd = path.resolve(STUB_DIR, 'simple');
        parser.setRoot(cwd, cwd);
        let result = parser.extractAll();
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.deep.equal({
            id: 'foo/index',
            relative: '/amd_modules/foo/index.js',
            url: '"/amd_modules/foo/index"'
        });
        expect(result[1]).to.deep.equal({
            id: 'foo',
            relative: '/amd_modules/foo.js',
            url: '"/amd_modules/foo"'
        });
    });
    it('should respect to amdPrefix', function () {
        var cwd = path.resolve(STUB_DIR, 'prefixed');
        parser.setRoot(cwd, cwd);
        let result = parser.extractAll();
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.deep.equal({
            id: 'foo/index',
            relative: '/assets/3rd-party/foo/index.js',
            url: '"/assets/3rd-party/foo/index"'
        });
        expect(result[1]).to.deep.equal({
            id: 'foo',
            relative: '/assets/3rd-party/foo.js',
            url: '"/assets/3rd-party/foo"'
        });
    });
    it('should include multiple packages', function () {
        var cwd = path.resolve(STUB_DIR, 'multiple');
        parser.setRoot(cwd, cwd);
        let result = parser.extractAll();
        expect(result).to.have.lengthOf(6);
        expect(result[0]).to.have.property('id', 'foo/index');
        expect(result[1]).to.have.property('id', 'foo');
        expect(result[2]).to.have.property('id', 'bar/src/index');
        expect(result[3]).to.have.property('id', 'bar');
        expect(result[4]).to.have.property('id', '@baidu/bar/index');
        expect(result[5]).to.have.property('id', '@baidu/bar');
    });
    it('should support scoped package', function () {
        parser.setRoot(STUB_DIR + '/multiple', STUB_DIR + '/multiple');
        let result = parser.extractAll();
        expect(result).to.deep.include({
            id: '@baidu/bar',
            relative: '/amd_modules/@baidu/bar.js',
            url: '"/amd_modules/@baidu/bar"'
        });
        expect(result).to.deep.include({
            id: '@baidu/bar/index',
            relative: '/amd_modules/@baidu/bar/index.js',
            url: '"/amd_modules/@baidu/bar/index"'
        });
    });
});
