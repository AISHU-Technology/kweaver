import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import Panel, { PanelProps } from './Panel';
import _ from 'lodash';
import './style.less';

export interface AdSplitPanelProps {
  className?: string;
  style?: React.CSSProperties;
  mode?: 'horizontal' | 'vertical'; // horizontal or vertical
  minWidthLeft?: number; // Minimum width of left container
  maxWidthLeft?: number; // Maximum width of left container
  defaultWidthLeft?: number; // Left default width
}

interface CoordinateProps {
  x: number;
  y: number;
}

interface IDom1Props {
  width: number;
  height: number;
}

/**
 * 公共的分割面板
 * @param props
 * @constructor
 */
const AdSplitPanel: React.FC<AdSplitPanelProps> = props => {
  const {
    className,
    style,
    mode = 'horizontal',
    minWidthLeft = 100,
    maxWidthLeft = 500,
    defaultWidthLeft = 100,
    children
  } = props;
  const prefixCls = 'kw-split-panel';

  const resizesElement = useRef<HTMLElement>(null);
  const parentContainerDOM = useRef<HTMLDivElement>(null); // Define the DOM of the parent container
  const mouseDownPosition = useRef<CoordinateProps>({
    x: 0,
    y: 0
  }); // Record the mouse click position
  const mouseDownDom1 = useRef<IDom1Props>({
    width: 0,
    height: 0
  }); // Record the information of DOM1 when the mouse is pressed
  const resizesElementPosition = useRef<CoordinateProps>({
    x: 0,
    y: 0
  }); // Record the position of the split element when the mouse is pressed
  const domId1 = useRef<string>(_.uniqueId(`${prefixCls}-item_`));
  const domId2 = useRef<string>(_.uniqueId(`${prefixCls}-item_`));
  const domResizer = useRef<HTMLElement>();

  /**
   * 鼠标按下事件，记录鼠标按下时的坐标以及此时分割线元素的坐标以及此时dom1元素的宽度或者高度
   */
  const onMouseDown = (e: React.MouseEvent) => {
    const resizesElementDOM = resizesElement.current as HTMLElement;
    const dom1 = document.getElementById(domId1.current) as HTMLDivElement;
    mouseDownPosition.current = {
      x: e.clientX,
      y: e.clientY
    };
    mouseDownDom1.current = {
      width: dom1.getBoundingClientRect().width,
      height: dom1.getBoundingClientRect().height
    };
    resizesElementPosition.current = {
      x: resizesElementDOM.getBoundingClientRect().x,
      y: resizesElementDOM.getBoundingClientRect().y
    };
    // @ts-ignore
    parentContainerDOM.current.addEventListener('mousemove', onMousemove);
    // @ts-ignore
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMousemove = (e: React.MouseEvent) => {
    const dom1 = document.getElementById(domId1.current) as HTMLDivElement;
    const dom2 = document.getElementById(domId2.current) as HTMLDivElement;
    const mouseMovePosition = {
      x: e.clientX,
      y: e.clientY
    };
    if (mode === 'horizontal') {
      // Horizontal segmentation only considers the distance moved in the horizontal direction
      const moveDistance = mouseMovePosition.x - mouseDownPosition.current.x;
      if (moveDistance < 0) {
        // Mouse move left
        const width = Number(parseInt(String(mouseDownDom1.current.width))) - Math.abs(moveDistance);
        const res = width < minWidthLeft ? minWidthLeft : width;
        dom1.style.width = `${res}px`;
        dom2.style.inset = `0 0 0 ${res}px`;
        (resizesElement.current as HTMLElement).style.left = `${res}px`;
      }
      if (moveDistance > 0) {
        // Mouse move right
        const width = Number(parseInt(String(mouseDownDom1.current.width))) + Math.abs(moveDistance);
        const res = width > maxWidthLeft ? maxWidthLeft : width;
        dom1.style.width = `${res}px`;
        dom2.style.inset = `0 0 0 ${res}px`;
        (resizesElement.current as HTMLElement).style.left = `${res}px`;
      }
    }
    if (mode === 'vertical') {
      // Vertical segmentation only considers the distance moved in the vertical direction
      const moveDistance = mouseMovePosition.y - mouseDownPosition.current.y;
      if (moveDistance < 0) {
        // Mouse move up
        dom1.style.height = `${mouseDownDom1.current.height - Math.abs(moveDistance)}px`;
      }
      if (moveDistance > 0) {
        // Mouse move down
        dom1.style.height = `${mouseDownDom1.current.height + Math.abs(moveDistance)}px`;
      }
    }
  };

  const onMouseUp = (e: React.MouseEvent) => {
    // @ts-ignore
    parentContainerDOM.current.removeEventListener('mousemove', onMousemove);
    // @ts-ignore
    window.removeEventListener('mouseup', onMouseUp);
  };

  /**
   * 自定义渲染传入的子组件的逻辑
   */
  const renderChildren = (): React.ReactNode => {
    if (React.Children.count(children) === 2) {
      return React.Children.map(children, (child, index) => {
        const childElement = child as React.FunctionComponentElement<PanelProps>;
        const displayName = childElement.type.displayName;
        if (displayName === `${prefixCls}-item`) {
          if (mode === 'horizontal') {
            if (index === 0) {
              return (
                <>
                  {React.cloneElement(childElement, {
                    className: classNames(`${prefixCls}-left-item`, childElement.props.className),
                    id: domId1.current,
                    style: { width: defaultWidthLeft }
                  })}
                  <span
                    style={{ left: defaultWidthLeft }}
                    ref={resizesElement}
                    onMouseDown={onMouseDown}
                    className={`${prefixCls}-resizes`}
                  />
                </>
              );
            }
            if (index === 1) {
              return React.cloneElement(childElement, {
                className: classNames(`${prefixCls}-right-item`, childElement.props.className),
                id: domId2.current
              });
            }
          } else {
            if (index === 0) {
              return (
                <>
                  {React.cloneElement(childElement, {
                    className: classNames(`${prefixCls}-top-item`, childElement.props.className),
                    id: domId1.current
                  })}
                  <span ref={resizesElement} onMouseDown={onMouseDown} className={`${prefixCls}-resizes`} />
                </>
              );
            }
            if (index === 1) {
              return React.cloneElement(childElement, {
                className: classNames(`${prefixCls}-bottom-item`, childElement.props.className),
                id: domId2.current
              });
            }
          }
        } else {
          console.error('Split组件的子元素请使用Panel组件，Panel组件从Split身上获取');
        }
      });
    }
    console.error('Split组件只能接受两个Panel组件，多一个或者少一个都不行。');
  };

  const classes = classNames(prefixCls, className, {
    [`${prefixCls}-horizontal`]: mode === 'horizontal',
    [`${prefixCls}-vertical`]: mode === 'vertical'
  });

  return (
    <div className={classes} style={style} ref={parentContainerDOM}>
      {renderChildren()}
    </div>
  );
};

export default AdSplitPanel;
