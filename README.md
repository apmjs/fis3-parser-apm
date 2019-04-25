[![Travis](https://img.shields.io/travis/apmjs/fis3-parser-apm.svg?logo=travis)](https://travis-ci.org/apmjs/fis3-parser-apm)
[![Appveyor](https://ci.appveyor.com/api/projects/status/fg49596xj2bc7f3i?svg=true)](https://ci.appveyor.com/project/harttle/fis3-parser-apm)

## 使用方式

```bash
npm install --save-dev fis3-parser-apm fis3-hook-amd@0.2.0 fis3-hook-commonjs
```

`fis-conf.js` 配置：

```javascript
// 启用 AMD hook，编译 amd_modules 下的文件
fis.hook('amd');
// 设置 amd_modules 下文件的 ID
fis.match('/amd_modules/(**).js', {
    moduleId: '$1',
    parser: fis.plugin('apm')
});
// 包含 __inlinePackage 和 __AMD_CONFIG 的文件，要过 APM praser
fis.match('**/*.js', {
    parser: fis.plugin('apm')
});
```

## __inlinePackage

可以将整个包 inline 到当前文件中，例如：

```javascript
__inlinePackage('foo')
```

Parser 会把它转换为：

```javascript
__inline('/amd_modules/foo.js')
__inline('/amd_modules/foo/index.js')
__inline('/amd_modules/foo/lib/util.js')
// ...
```

## __AMD_CONFIG

生成 require.js 配置对象，并替换文件中的 `__AMD_CONFIG`。
例如：

```javascript
require.config(__AMD_CONFIG)
```

Parser 会把它转换为：

```javascript
require.config({
    'foo': '/amd_modules/foo',
    'foo/index': '/amd_modules/foo/index',
    'foo/lib/util': '/amd_modules/foo/lib/util',

    'bar': '/amd_modules/bar',
    // ...
})
```

## 自定义 AMD URL

require config 中的 URL 可以自定义配置，只需穿软一个 `path2url` 函数，例如：

```javascript
fis.match('**/*.js', {
    parser: fis.plugin('apm', {
        path2url: function (path) {
            // path === '/amd_modules/foo/index'
            return '/static' + path
        }
    })
});
```

这样，生成的 config 如下：

```javascript
require.config({
    'foo': '/static/amd_modules/foo',
    'foo/index': '/static/amd_modules/foo/index',
    'foo/lib/util': '/static/amd_modules/foo/lib/util',

    'bar': '/static/amd_modules/bar',
    // ...
})
```

## .extractAllFiles

为了方便发布和打包，可以提取所有被入口引用到的文件。

```
let files = require('fis3-parser-apm').extractAllFiles();
console.log(files);
// [
//   '/static/amd_modules/foo.js',
//   '/static/amd_modules/foo/index.js',
//   '/static/amd_modules/foo/lib/util.js',
//   ...
// ]
```
