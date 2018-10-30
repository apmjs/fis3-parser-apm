import Parser from '../src/parser';
import {dir, mock, restore} from '../stub';
import path from 'path';
import {expect} from 'chai';

describe('__AMD_CONFIG', function () {
    this.timeout(5000);
    beforeEach(mock);
    afterEach(restore);
    it('AMD Config 需要是合法的 JSON', function () {
        let parser = new Parser(path.resolve(dir, 'simple'));
        let src = '__AMD_CONFIG';
        let result = parser.parse(src, {});
        expect(result).to.equal(`{
    "foo/index": "/amd_modules/foo/index",
    "foo": "/amd_modules/foo"
}`);
    });
    it('应该支持 amdPrefix', function () {
        let parser = new Parser(path.resolve(dir, 'prefixed'));
        let result = parser.parse('__AMD_CONFIG', {});
        expect(result).to.equal(`{
    "bar/src/index": "/assets/3rd-party/bar/src/index",
    "bar": "/assets/3rd-party/bar",
    "foo/index": "/assets/3rd-party/foo/index",
    "foo": "/assets/3rd-party/foo"
}`);
    });
    it('应该支持 path2url 配置', function () {
        let parser = new Parser(path.resolve(dir, 'simple'));
        let path2url = x => '"http://example.org/assets' + x.replace('.js', '') + '"';
        let result = parser.parse('__AMD_CONFIG', {path2url});
        expect(result).to.equal(`{
    "foo/index": "http://example.org/assets/amd_modules/foo/index",
    "foo": "http://example.org/assets/amd_modules/foo"
}`);
    });
    it('应该支持 scoped package', function () {
        let parser = new Parser(dir + '/multiple', dir + '/multiple');
        let result = parser.parse('__AMD_CONFIG', {});
        expect(result).equal(`{
    "@baidu/bar/index": "/amd_modules/@baidu/bar/index",
    "@baidu/bar": "/amd_modules/@baidu/bar",
    "bar/src/index": "/amd_modules/bar/src/index",
    "bar": "/amd_modules/bar",
    "foo/index": "/amd_modules/foo/index",
    "foo": "/amd_modules/foo"
}`);
    });
});
