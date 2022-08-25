// import React from 'react';
// import PropTypes from 'prop-types';
import authMapping from './authMapping';

// 用户身份标识{ 0: admin, 1: 普通用户, 2: 知识网络管理员}
const IDENTITY_LIST = [0, 1, 2];

// 用户权限标识{ 1: 所有者, 2: 管理者, 3: 编辑者, 4: 查看者 }
const AUTHOR_LIST = [1, 2, 3, 4];

/**
 * 合法性验证, 若数值非法, 给予最低权限
 * @param {Number} identity 用户身份标识
 * @param {Number} author 用户权限标识
 */
const verifyParams = (identity, author) => {
  const curidentity = IDENTITY_LIST.includes(identity) ? identity : 1;
  const curAuthor = AUTHOR_LIST.includes(author) ? author : 4;

  return [curidentity, curAuthor];
};

/**
 * 生成用户权限码
 * 管理员 '0-0' 最高权限, 其他比如 '2-1' 表示 '知识网络管理员-所有者'
 * @param {Number} identity 用户身份标识
 * @param {Number} author 用户权限标识
 */
const generateAuthCode = (identity, author) => {
  const [curidentity, curAuthor] = verifyParams(identity, author);

  if (curidentity === 0) return '0-0';

  return `${curidentity}-${curAuthor}`;
};

/**
 * 验证组件是否符合符合权限
 * @param {Any} viewId 需要权限控制的组件id
 * @param {Number} identity 用户身份标识
 * @param {Number} author 用户权限标识
 */
const isAuthorized = (viewId, identity, author) => {
  if (identity === 0) return true; // admin直接放行

  const code = generateAuthCode(identity, author);
  const isPermit = authMapping.some(item => item.viewId === viewId && item.authorities.includes(code));

  return isPermit;
};

/**
 * 高级组件, 根据权限控制视图
 * @param {ReactNode} children 包裹的需要验证的组件
 * @param {Number} userType 用户类型
 * @param {Number} authorId 权限id
 * @param {Any} viewId 对应 authMapping 映射表中的id
 * @param {ReactNode || Function} notPermit 不符合权限时渲染, 或执行一个函数(如跳转到其他页面)
 */
const AuthorizedView = props => {
  const { userType, authorId, viewId, notPermit, children } = props;
  const isPermit = isAuthorized(viewId, userType, authorId);

  if (isPermit) return children;

  return typeof notPermit === 'function' ? notPermit() : notPermit;
};

AuthorizedView.defaultProps = {
  // userType: 1,
  // authorId: 4,
  // viewId: 0,
  notPermit: null
};

AuthorizedView.propTypes = {
  // userType: PropTypes.number.isRequired,
  // authorId: PropTypes.number.isRequired
};

export { isAuthorized };
export default AuthorizedView;
