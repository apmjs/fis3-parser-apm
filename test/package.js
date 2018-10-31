import Parser from '../src/parser';
import fs from 'fs';
import {dir, mock, restore} from '../stub';
import path from 'path';
import {expect} from 'chai';

describe('文件打包参数：package', function () {
    this.timeout(5000);
    beforeEach(mock);
    afterEach(restore);
    it('需要打包当前文件及其依赖', function () {
        let parser = new Parser(path.resolve(dir, 'simple'));
        let fullname = path.resolve(dir, 'simple/amd_modules/foo.js');
        let content = fs.readFileSync(fullname, 'utf8');
        let result = parser.parse(content, {fullname}, {package: true});
        expect(result).to.equal(`${content};
__inline("/amd_modules/foo/index.js");`);
    });
    it('应该支持 scoped package', function () {
        let parser = new Parser(path.resolve(dir, 'multiple'));
        let fullname = path.resolve(dir, 'multiple/amd_modules/@baidu/bar.js');
        let content = fs.readFileSync(fullname, 'utf8');
        let result = parser.parse(content, {fullname}, {package: true});
        expect(result).equal(`${content};
__inline("/amd_modules/@baidu/bar/index.js");`);
    });
});
