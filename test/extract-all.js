import Parser from '../parser';
import {dir, mock, restore} from '../stub';
import path from 'path';
import {expect} from 'chai';

describe('#extractAll', function () {
    this.timeout(5000);
    beforeEach(mock);
    afterEach(restore);

    it('should include AMD entry file', function () {
        let parser = new Parser(path.resolve(dir, 'simple'));
        let result = parser.extractAll();
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.deep.equal({
            id: 'foo/index',
            relativePath: '/amd_modules/foo/index.js',
            url: '"/amd_modules/foo/index"'
        });
        expect(result[1]).to.deep.equal({
            id: 'foo',
            relativePath: '/amd_modules/foo.js',
            url: '"/amd_modules/foo"'
        });
    });
    it('should respect to amdPrefix', function () {
        let parser = new Parser(path.resolve(dir, 'prefixed'));
        let result = parser.extractAll();
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.deep.equal({
            id: 'foo/index',
            relativePath: '/assets/3rd-party/foo/index.js',
            url: '"/assets/3rd-party/foo/index"'
        });
        expect(result[1]).to.deep.equal({
            id: 'foo',
            relativePath: '/assets/3rd-party/foo.js',
            url: '"/assets/3rd-party/foo"'
        });
    });
    it('应该包含所有包', function () {
        let parser = new Parser(path.resolve(dir, 'multiple'));
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
        let parser = new Parser(dir + '/multiple', dir + '/multiple');
        let result = parser.extractAll();
        expect(result).to.deep.include({
            id: '@baidu/bar',
            relativePath: '/amd_modules/@baidu/bar.js',
            url: '"/amd_modules/@baidu/bar"'
        });
        expect(result).to.deep.include({
            id: '@baidu/bar/index',
            relativePath: '/amd_modules/@baidu/bar/index.js',
            url: '"/amd_modules/@baidu/bar/index"'
        });
    });
});
