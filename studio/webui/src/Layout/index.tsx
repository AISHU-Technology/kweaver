import React from 'react';

import Header, { HeaderType } from '@/components/Header';
import Sidebar, { SidebarType } from '@/components/Sidebar';

import './style.less';

type LayoutType = {
  header: HeaderType;
  sidebar: SidebarType;
  mainStyle?: any;
  children: React.FunctionComponent | JSX.Element;
};
const Layout = (props: LayoutType) => {
  const { header = {}, sidebar = {}, mainStyle = {}, children } = props;

  return (
    <div className="layoutRoot">
      <Header {...header} />
      <div className="layout">
        <Sidebar {...sidebar} />
        <div className="content">
          <div className="main" style={mainStyle}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
