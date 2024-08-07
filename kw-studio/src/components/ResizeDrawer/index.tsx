import React, { useEffect } from 'react';
import { Drawer } from 'antd';
import type { DrawerProps } from 'antd';
import intl from 'react-intl-universal';
import ExplainTip from '@/components/ExplainTip';
import classNames from 'classnames';

import './style.less';
import _ from 'lodash';

interface ResizeDrawerType extends DrawerProps {
  placement?: 'left' | 'right' | 'bottom';
  children: any;
  title: string;
  isOpen: boolean | undefined;
  height: number;
  minHeight: number;
  titleExtraContent?: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  onClose: () => void;
  maxClientHeight?: any;
  zIndex?: number;
}
const resetLine: any = {
  left: 'resizeLineL',
  right: 'resizeLineR',
  bottom: 'resizeLineB'
};
const ResizeDrawer = (props: ResizeDrawerType) => {
  const {
    placement = 'bottom',
    maxClientHeight = 0,
    children,
    title,
    minHeight,
    height,
    className,
    isOpen,
    titleExtraContent,
    minWidth,
    maxWidth,
    ...otherProps
  } = props;

  useEffect(() => {
    if (isOpen) {
      const maxHeight = height > 0 ? height : document.body.clientHeight - maxClientHeight;
      const antDrawer = document.getElementsByClassName('ant-drawer') as any;
      const drawer = document.getElementsByClassName('ant-drawer-content-wrapper') as any;
      if (antDrawer.length > 1) {
        const parent = antDrawer[0].parentNode;
        if (!_.isEmpty(parent)) {
          parent.removeChild(antDrawer[0]);
        }
      }
      drawer[0].style.height = `${maxHeight}px`;
      antDrawer[0].style.height = `${maxHeight}px`;
    }
  }, [isOpen]);

  const onmousedown = () => {
    let isDown = false;
    isDown = true;

    window.onmousemove = e => {
      if (isDown === false) return;

      const drawer = document.getElementsByClassName('ant-drawer-content-wrapper')[0] as any;
      const antDrawer = document.getElementsByClassName('ant-drawer') as any;

      if (placement === 'bottom') {
        const maxHeight = document.body.clientHeight - maxClientHeight;

        document.getElementById('resizeLine')!.style.bottom = `${0}px`;
        drawer.style.height = `${document.body.clientHeight - e.pageY}px`;
        antDrawer[0].style.height = `${document.body.clientHeight - e.pageY}px`;
        drawer.style.maxHeight = `${maxHeight}px`;
        drawer.style.minHeight = `${minHeight}px`;
      }
      if (placement === 'right') {
        document.getElementById('resizeLine')!.style.left = `${0}px`;
        drawer.style.width = `${document.body.clientWidth - e.screenX}px`;
      }
      if (placement === 'left') {
        document.getElementById('resizeLine')!.style.right = `${0}px`;
        let width = e.screenX;
        if (minWidth && width < minWidth) width = minWidth;
        if (maxWidth && width > maxWidth) width = maxWidth;
        drawer.style.width = `${width}px`;
      }
    };

    window.onmouseup = () => {
      window.onmousemove = null;
    };
  };

  /**
   * 双击标题最大最小
   */
  const doubleClick = () => {
    const drawer = document.getElementsByClassName('ant-drawer-content-wrapper')[0] as any;
    const antDrawer = document.getElementsByClassName('ant-drawer') as any;

    if (placement === 'bottom') {
      const maxHeight = document.body.clientHeight - maxClientHeight;
      const height = drawer.style.height === `${minHeight}px` ? maxHeight : minHeight;
      drawer.style.height = `${height}px`;
      antDrawer[0].style.height = `${height}px`;
    }
  };

  return (
    <Drawer
      className={classNames('resizeDrawerRoot', className)}
      title={
        title ? (
          <div
            className="kw-align-center drawerTitle kw-w-100 kw-pl-6"
            style={{ height: 55 }}
            onDoubleClick={doubleClick}
          >
            {title}
            <ExplainTip placement="topLeft" className="kw-ml-3" title={intl.get('exploreGraph.drawerTitle')} />
            <div className="kw-ml-9">{titleExtraContent || ''}</div>
          </div>
        ) : null
      }
      mask={false}
      placement={placement}
      destroyOnClose={true}
      open={isOpen}
      height={height}
      {...otherProps}
    >
      <div id="resizeLine" onMouseDown={onmousedown} className={resetLine?.[placement]}></div>
      {children}
    </Drawer>
  );
};

export default (props: any) => {
  const { isOpen } = props;
  if (!isOpen) return null;
  return <ResizeDrawer {...props} />;
};
