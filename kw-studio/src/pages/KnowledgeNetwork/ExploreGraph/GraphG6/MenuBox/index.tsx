import React, { useRef, useState, useLayoutEffect } from 'react';
import _ from 'lodash';

import './style.less';

const MenuBox = (props: any) => {
  const { menuConfig = {}, graphContainer } = props;

  const menuRef = useRef<any>(null);
  const [position, setPosition] = useState(menuConfig);
  const { x, y } = position;

  useLayoutEffect(() => {
    if (!menuRef.current) return;
    const containerWidth = graphContainer.current.clientWidth;
    const containerHeight = graphContainer.current.clientHeight;
    const menuWidth = menuRef?.current.clientWidth;
    const menuHeight = menuRef?.current.clientHeight;
    const newPosition = { ...position };
    if (menuHeight + position?.y > containerHeight) newPosition.y = position?.y - menuHeight;
    if (menuWidth + position?.x > containerWidth) newPosition.x = position?.x - menuWidth;
    setPosition(newPosition);
  }, [menuRef.current]);

  return (
    <div style={{ background: '#fff', position: 'absolute', top: y + 10, left: x + 10, zIndex: 12 }}>
      <div ref={menuRef}>{props.children({ x, y })}</div>
    </div>
  );
};

export default MenuBox;
