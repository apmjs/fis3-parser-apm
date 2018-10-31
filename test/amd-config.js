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
        let result = parser.parse(src, {fullname: '/what'}, {});
        expect(result).to.equal(`{
    "foo": "/amd_modules/foo"
}`);
    });
    it('应该支持 amdPrefix', function () {
        let parser = new Parser(path.resolve(dir, 'prefixed'));
        let result = parser.parse('__AMD_CONFIG', {fullname: '/root'}, {});
        expect(result).to.equal(`{
    "bar": "/assets/3rd-party/bar",
    "foo": "/assets/3rd-party/foo"
}`);
    });
    it('应该支持 path2url 配置', function () {
        let parser = new Parser(path.resolve(dir, 'simple'));
        let path2url = x => `__getAMDUri("${x}")`;
        let result = parser.parse('__AMD_CONFIG', {fullname: '/root'}, {path2url});
        expect(result).to.equal(`{
    "foo": __getAMDUri("/amd_modules/foo.js")
}`);
    });
    it('应该支持 scoped package', function () {
        let parser = new Parser(dir + '/multiple', dir + '/multiple');
        let result = parser.parse('__AMD_CONFIG', {fullname: '/root'}, {});
        expect(result).equal(`{
    "@baidu/bar": "/amd_modules/@baidu/bar",
    "bar": "/amd_modules/bar",
    "foo": "/amd_modules/foo"
}`);
    });
});
