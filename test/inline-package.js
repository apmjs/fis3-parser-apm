/**
 * @file
 * @author harttle<yangjvn@126.com>
 */
import parser from '../index';
import path from 'path';
import {expect} from 'chai';

const STUB_DIR = path.resolve(__dirname, '../stub');
const originLoadJson = parser.loadJson;

describe('__inlinePackage', function () {
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
    it('should __inline the all files required', function () {
        var cwd = path.resolve(STUB_DIR, 'multiple-files');
        parser.setRoot(cwd, cwd);
        let src = '__inlinePackage("foo")';
        let result = parser(src, null, {});

        expect(result).to.equal(`__inline("/amd_modules/foo/dep1.js");
__inline("/amd_modules/foo/index.js");
__inline("/amd_modules/foo/subfolder/dep2.js");
__inline("/amd_modules/foo.js");`);
    });
    it('should throw no fullpathFile Error', function () {
        var cwd = path.resolve(STUB_DIR, 'multiple-nofullpathfile');
        parser.setRoot(cwd, cwd);
        let src = '__inlinePackage("foo")';
        try{
            let result = parser(src, null, {});
        }catch(error){
            expect(error.message).to.equal(`未找到${cwd}/amd_modules/foo/index1.js对应的文件`);
        }
    });
});
describe('withoutFullpath',function(){
    it('should throw no fullpath Error', function () {
        var cwd = path.resolve(STUB_DIR, 'multiple-nofullpath');
        parser.setRoot(cwd, cwd);
        let src = '__inlinePackage("foo")';
        try{
            let result = parser(src, null, {});
        }catch(error){
            expect(error.message).to.equal(`index.json文件下foo模块的fullpath字段缺失`);
        }
    });
});
