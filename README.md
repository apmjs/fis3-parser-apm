## 使用方式

```bash
npm install fis3-parser-apm --save-dev
```

`fis-conf.js` 配置：

```javascript
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
