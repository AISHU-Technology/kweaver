import React from 'react';

import Header, { HeaderType } from '@/components/Header';
import Sidebar, { SidebarType } from '@/components/Sidebar';

import './style.less';

type LayoutType = {
  header?: HeaderType;
  sidebar: SidebarType;
  mainStyle?: any;
  isHeaderHide?: boolean;
  children: React.FunctionComponent | JSX.Element;
};
const Layout = (props: LayoutType) => {
  const { header = {}, sidebar = {}, mainStyle = {}, isHeaderHide = false, children } = props;

  return (
    <div className="layoutRoot">
      {!isHeaderHide && <Header {...header} />}
      <div className="l-layout">
        <Sidebar {...sidebar} />
        <div className="l-content">
          <div className="l-main" style={mainStyle}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
