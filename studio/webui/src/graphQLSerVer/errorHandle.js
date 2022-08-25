// 发生错误时返回对应页面
const redirectMap = [
  // 知识网络
  {
    back: '/home/graph-list',
    urls: [
      { path: '/home/workflow/create' }, // 新建图谱
      { path: '/home/workflow/edit' } // 编辑图谱
    ]
  }
];

/**
 * 图谱无权限时，进行页面跳转
 */
const handleBack = () => {
  let backUrl = '/home/graph-list';
  const { pathname, search } = window.location;

  redirectMap.some(item => {
    const { back, urls } = item;
    const isHit = urls.some(url => {
      const { path, params } = url;
      const isSearchEqual = typeof params === 'function' ? params(search) : params === search;

      return path === pathname && (!params || isSearchEqual);
    });

    isHit && (backUrl = back);

    return isHit;
  });

  if (pathname === backUrl) return;

  setTimeout(() => {
    window.location.replace(backUrl);
  }, 2000);
};

export { handleBack };
