/**
 * G6的web-worker配置项
 *
 * G6默认使用的是 @antv/layout 线上的脚本, 内网访问不到线上资源, 所以直接下载 layout 脚本, 放在public文件夹中(放在这里文件名不会被webpack哈希)
 * 脚本资源: https://unpkg.com/@antv/layout@0.3.23/dist/layout.min.js
 * 启用worker布局, 大数据量时不会阻塞页面导致崩溃, 但初次渲染时所有点和边没有坐标信息会聚成一簇
 * 树图不支持worker布局
 */

const workerConfig = {
  workerEnabled: true,
  workerScriptURL: `${window.location.origin}/antv_layout_worker.min.js`
};
export default workerConfig;
