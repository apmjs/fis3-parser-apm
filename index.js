import Parser from './parser.js';

module.exports = function (content, file, settings) {
    let parser = Parser.create(fis.project.getProjectPath());
    return parser.parse(content, settings);
};
