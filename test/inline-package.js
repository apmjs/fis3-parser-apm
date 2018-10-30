import Parser from '../src/parser';
import path from 'path';
import {dir, mock, restore} from '../stub';
import {expect} from 'chai';

// describe('__package', function () {
    // this.timeout(5000);
    // before(mock);
    // after(restore);

    // it('打包指定文件的所有依赖', function () {
        // let parser = new Parser(path.resolve(dir, 'multiple-files'));
        // let src = '__package("foo")';
        // let result = parser.parse(src, {});

        // expect(result).to.equal(`__inline("/amd_modules/foo/dep1.js");
// __inline("/amd_modules/foo/index.js");
// __inline("/amd_modules/foo/subfolder/dep2.js");
// __inline("/amd_modules/foo.js");`);
    // });
// });

describe('__inlinePackage', function () {
    this.timeout(5000);
    beforeEach(mock);
    afterEach(restore);

    it('should __inline the all files required', function () {
        let parser = new Parser(path.resolve(dir, 'multiple-files'));
        let src = '__inlinePackage("foo")';
        let result = parser.parse(src, {});

        expect(result).to.equal(`__inline("/amd_modules/foo/dep1.js");
__inline("/amd_modules/foo/index.js");
__inline("/amd_modules/foo/subfolder/dep2.js");
__inline("/amd_modules/foo.js");`);
    });
});
