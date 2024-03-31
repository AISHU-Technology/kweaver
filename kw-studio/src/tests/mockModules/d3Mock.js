/**
 * UT 运行报错
 * node_modules\@antv\g-base\node_modules\d3-interpolate\src\index.js:1
 *  {export { default as interpolate } from "./value.js";
 *  SyntaxError: Unexpected token 'export'
 * 原因：jest只支持cjs, 不支持esm, 所有esm需要babel编译成cjs, 这里取巧直接映射成这个包导出的cjs
 */
const mockModule = require('d3-interpolate/dist/d3-interpolate.min.js');
module.exports = mockModule;
