import Parser from '../src/parser';
import {dir, mock, restore} from '../stub';
import path from 'path';
import {expect} from 'chai';

describe('__AMD_CONFIG', function () {
    this.timeout(5000);
    beforeEach(mock);
    afterEach(restore);
    it('should generate AMD config', function () {
        let parser = new Parser(path.resolve(dir, 'simple'));
        let src = '__AMD_CONFIG';
        let result = parser.parse(src, {});
        expect(result).to.equal(`{
    'foo/index': "/amd_modules/foo/index",
    'foo': "/amd_modules/foo"
}`);
    });
    it('should respect to amdPrefix', function () {
        let parser = new Parser(path.resolve(dir, 'prefixed'));
        let src = '__AMD_CONFIG';
        let result = parser.parse(src, {});
        expect(result).to.equal(`{
    'foo/index': "/assets/3rd-party/foo/index",
    'foo': "/assets/3rd-party/foo"
}`);
    });
    it('should respect to path2url', function () {
        let parser = new Parser(path.resolve(dir, 'simple'));
        let src = '__AMD_CONFIG';
        let path2url = x => '"http://example.org/assets' + x.replace('.js', '') + '"';
        let result = parser.parse(src, {path2url});
        expect(result).to.equal(`{
    'foo/index': "http://example.org/assets/amd_modules/foo/index",
    'foo': "http://example.org/assets/amd_modules/foo"
}`);
    });
});
