/**
 * 右键菜单
 */
import React, { useRef, useState, useLayoutEffect } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import './style.less';

export type MenuConfig = {
  x: number;
  y: number;
  shape: any;
};
export interface MenuBoxProps {
  menuConfig: MenuConfig;
  graphContainer: any;
  onDelete: (shape: any) => void;
}

const MenuBox = (props: MenuBoxProps) => {
  const { menuConfig, graphContainer, onDelete } = props;
  const menuRef = useRef<any>(null);
  const [position, setPosition] = useState<MenuConfig>(menuConfig);

  useLayoutEffect(() => {
    const containerWidth = graphContainer.current?.clientWidth;
    const containerHeight = graphContainer.current?.clientHeight;
    const menuWidth = menuRef.current?.clientWidth;
    const menuHeight = menuRef.current?.clientHeight;
    const newPosition = { ...position };
    if (menuHeight + position?.y > containerHeight) newPosition.y = position?.y - menuHeight;
    if (menuWidth + position?.x > containerWidth) newPosition.x = position?.x - menuWidth;
    setPosition(newPosition);
  }, []);

  return (
    <div style={{ position: 'absolute', borderRadius: 3, top: position.y + 10, left: position.x + 10 }}>
      <div ref={menuRef} className="flow-3-right-menu">
        <div className="menu-item kw-pointer" onClick={() => onDelete(menuConfig.shape)}>
          {intl.get('global.delete')}
        </div>
      </div>
    </div>
  );
};

export default MenuBox;
