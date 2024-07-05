/**
 * 模块内子页面路由404页面
 */
import React from 'react';
import intl from 'react-intl-universal';
import NotFoundImg from '@/assets/images/404.svg';
import './style.less';

const NotFoundChildPage = () => {
  return (
    <div className="not-found-childPage">
      <div className="not-found-childPage-content">
        <img src={NotFoundImg} alt="404" />
        <div className="not-found-childPage-msg">{intl.get('adminManagement.newManagement.errorMsg.pageNotFound')}</div>
      </div>
    </div>
  );
};

export default NotFoundChildPage;
