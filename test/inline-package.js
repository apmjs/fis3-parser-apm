import Parser from '../src/parser';
import path from 'path';
import {dir, mock, restore} from '../stub';
import {expect} from 'chai';

describe('__inlinePackage', function () {
    this.timeout(5000);
    beforeEach(mock);
    afterEach(restore);

    it('should __inline the all files required', function () {
        let parser = new Parser(path.resolve(dir, 'multiple-files'));
        let src = '__inlinePackage("foo")';
        let result = parser.parse(src, {fullname: '/root'}, {});

        expect(result).to.equal('__inline("/amd_modules/foo.js");');
    });
});
