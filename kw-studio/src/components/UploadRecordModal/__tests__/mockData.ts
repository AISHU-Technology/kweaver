const mockUploadList = (() => {
  const data = Array.from({ length: 4 }, (_, i) => ({
    cause: i === 3 ? '导出失败----+++++----失败详情' : '',
    created: '2022-01-01 00:00:00',
    finished: '2022-01-01 00:00:00',
    graphName: `图谱${i}`,
    id: String(i + 1),
    ip: '127.0.0.0',
    relatedGraphNetName: `知识网络${i}`,
    transferProgress: i % 10,
    transferState: String(i),
    transferStatus: String(i),
    updated: '2022-01-01 00:00:00'
  }));
  return { res: { data, total: data.length } };
})();

export { mockUploadList };
