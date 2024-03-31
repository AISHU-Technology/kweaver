export const DEFAULT_ROLE_CODE = {
  /**
   * `数据管理员`, 管理所有的知识网络数据的所有者权限, 对于知识网络和知识图谱可以分配用户权限, 数据仅可查看不可操作
   */
  DATA_ADMIN: 'data_admin'
};

export const DEFAULT_PART_ROLE_CODE = {
  /**
   * `系统管理员`, 管理系统功能
   */
  ADMIN: 'admin',

  /**
   * `数据开发者`, 仅管理认知服务中心负责开发的app/应用
   */
  DATA_DEVELOPER: 'data_developer',

  /**
   * `数据科学家`, 可以创建知识网络和管理知识网络下面所有内容, 包括知识图谱、认知引擎、数据源、词库和上传发布
   */
  DATA_SCIENTIST: 'data_scientist',

  /**
   * `普通用户`, 可以查看被授权的知识网络及下面的资源
   */
  ORDINARY: 'ordinary_user'
};
