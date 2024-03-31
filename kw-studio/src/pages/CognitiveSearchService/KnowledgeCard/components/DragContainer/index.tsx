import React, { useRef, useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Popconfirm } from 'antd';

import HOOKS from '@/hooks';
import IconFont from '@/components/IconFont';
import KNOWLEDGE_CARD from '../../enums';

import './style.less';

const LABEL: any = KNOWLEDGE_CARD.getLabel();
const DragBox = (props: any) => {
  const { item, active, style, className, disabled } = props;
  const { onInit, onMouseDown, onMouseUp, onDeleteComponent } = props;

  const boxRfg = useRef<any>(null);
  const tegRef = useRef<any>(null);

  useEffect(() => {
    if (!boxRfg.current && item.disabled) return;
    onInit(item, boxRfg);
  }, [boxRfg.current]);

  return (
    <div ref={boxRfg} className={classnames('boxRoot', className)} style={style} onMouseUp={onMouseUp}>
      <div className={classnames({ active })} />
      <div className="content">{props.children}</div>
      <div className="background" onMouseDown={(e: any) => onMouseDown({ e, boxRfg, item, eventType: 'mousedown' })} />
      <div
        className="tag"
        ref={tegRef}
        style={{
          left: -((tegRef?.current?.clientWidth || 0) + 20),
          backgroundColor: active ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, .25)'
        }}
        onClick={(e: any) => onMouseDown({ e, boxRfg, item, eventType: 'click' })}
      >
        {intl.get(LABEL[item.type])}
      </div>
      <Popconfirm
        overlayClassName="deletePopconfirm"
        title={intl.get('knowledgeCard.delComponentTip')}
        okButtonProps={{ size: 'small', style: { width: 49, height: 24, minWidth: 49 } }}
        cancelButtonProps={{ size: 'small', style: { width: 49, height: 24, minWidth: 49 } }}
        getPopupContainer={triggerNode => triggerNode?.parentElement || document.body}
        onConfirm={() => onDeleteComponent(item?.id)}
      >
        <div className={classnames('deleteButton', { deleteVisible: !item.disabled && active && !disabled })}>
          <IconFont type="icon-lajitong" />
        </div>
      </Popconfirm>
    </div>
  );
};

type SourceItemType = { id: string; dom: React.ReactNode; disabled: boolean };
type DragContainerType = {
  refreshKey?: any;
  source: SourceItemType[];
  activeID: string | undefined;
  className?: string;
  onChangeSort: (items: any) => void;
  onChangeActive: (id: string) => void;
  onDeleteComponent: (id: string) => void;
};
const DragContainer = (props: DragContainerType) => {
  const { source, activeID, className } = props;
  const { onChangeSort, onChangeActive, onDeleteComponent } = props;
  const forceUpdate = HOOKS.useForceUpdate();
  const [offset, setOffset] = useState<any>({ x: 0, y: 0, dirX: 'right', dirY: 'bottom' });

  const timer = useRef<any>(null);
  const items = useRef<any>([]); // 展示组件
  const containerRef = useRef<any>(null); // dragContainer 容器元素
  const dragTargetRef = useRef<any>(null); // 需要进行拖拽的元素
  const position = useRef<any>({ x: 0, y: 0 }); // 鼠标初始坐标，不用更新，用以计算鼠标移动距离
  const prePosition = useRef<any>({ x: 0, y: 0 }); // 鼠标初始坐标，实时更新，用以判断鼠标移动方向
  const { offsetWidth = 0, offsetHeight = 0, offsetTop = 0, offsetLeft = 0 } = dragTargetRef.current?.position || {};

  useEffect(() => {
    if (!source.length) return;
    items.current = source;
    onChangeSort(items.current);
    forceUpdate();
    return () => onMouseUp();
  }, [source.length]);
  useEffect(() => {
    if (containerRef.current) forceUpdate();
  }, [containerRef]);

  /** 排序 */
  const onSort = (dirY: string, borderTop: number, borderBottom: number) => {
    let dragIndex = 0;
    let targetIndex = 0;
    let dragItemTop = 0;
    let dragItemBottom = 0;

    _.forEach(items.current, (item, index: number) => {
      if (item.id === dragTargetRef.current.item.id) {
        dragIndex = index;
        dragItemTop = item.html.current.offsetTop;
        dragItemBottom = item.html.current.offsetTop + item.html.current.offsetHeight;
        return false;
      }
    });
    _.forEach(items.current, (item, index: number) => {
      if (item.id === dragTargetRef.current.item.id || item.disabled) return;
      if (dirY === 'toB') {
        const line = item.html.current.offsetTop + item.html.current.offsetHeight - item.html.current.offsetHeight / 4;
        if (borderBottom > line && line > dragItemBottom) {
          targetIndex = index;
          [items.current[dragIndex], items.current[targetIndex]] = [
            items.current[targetIndex],
            items.current[dragIndex]
          ];
          onChangeSort(items.current);
          return false;
        }
      }
      if (dirY === 'toT') {
        const line = item.html.current.offsetTop + item.html.current.offsetHeight / 4;
        if (borderTop < line && line < dragItemTop) {
          targetIndex = index;
          [items.current[dragIndex], items.current[targetIndex]] = [
            items.current[targetIndex],
            items.current[dragIndex]
          ];
          onChangeSort(items.current);
          return false;
        }
      }
    });
  };

  /** 鼠标移动事件 */
  const onMoveMask = useCallback((e: any) => {
    const { scrollTop, scrollHeight, offsetHeight: c_offsetHeight = 0 } = containerRef?.current || {};
    const { offsetTop: d_offsetTop = 0, offsetHeight: d_offsetHeight = 0 } = dragTargetRef?.current?.position || {};
    const offsetX = e.pageX - position.current.x;
    const offsetY = e.pageY - position.current.y;
    const borderTop = offsetY + d_offsetTop <= 0 ? 0 : offsetY + d_offsetTop;
    const borderBottom = borderTop + d_offsetHeight >= scrollHeight ? scrollHeight : borderTop + d_offsetHeight;

    const dirX = e.pageX - prePosition.current.x > 0 ? 'toR' : 'toL';
    const dirY = e.pageY - prePosition.current.y > 0 ? 'toB' : 'toT';

    prePosition.current.x = e.pageX;
    prePosition.current.y = e.pageY;

    if (Math.abs(offsetY) > 10) {
      onSort(dirY, borderTop, borderBottom);
    }

    if (dirY === 'toB') {
      const distance = borderBottom - (c_offsetHeight + scrollTop);
      if (distance > 0) containerRef.current.scrollTo(0, distance + scrollTop);
    }
    if (dirY === 'toT') {
      if (borderTop < scrollTop) containerRef.current.scrollTo(0, borderTop);
    }

    if (borderTop <= 0) {
      setOffset({ x: offsetX, y: -d_offsetTop, dirX, dirY });
      containerRef.current.scrollTo(0, 0);
    } else if (borderBottom >= scrollHeight) {
      const bottom = scrollHeight - d_offsetHeight - d_offsetTop;
      setOffset({ x: offsetX, y: bottom, dirX, dirY });
      containerRef.current.scrollTo(0, scrollHeight - c_offsetHeight);
    } else {
      setOffset({ x: offsetX, y: offsetY, dirX, dirY });
    }
  }, []);

  useEffect(() => {
    const setInit = () => {
      setOffset({ x: 0, y: 0 });
      dragTargetRef.current = null;
      document.removeEventListener('mousemove', onMoveMask);
      forceUpdate();
    };
    document.addEventListener('mouseup', setInit);
    return () => document.removeEventListener('mouseup', setInit);
  }, []);

  const onInit = (data: any, ref: any) => {
    _.forEach(items.current, item => {
      if (item.id === data.id) item.html = ref;
    });
    forceUpdate();
  };

  /** 鼠标在拖拽元素上的按下事件 */
  const onMouseDown = (data: any, disabled: boolean) => {
    const { e, boxRfg, item, eventType } = data;
    if (item.id !== activeID) onChangeActive && onChangeActive(item.id);
    if (disabled || eventType === 'click') return;

    const { pageX, pageY } = e;
    const { offsetWidth = 0, offsetHeight = 0, offsetTop = 0, offsetLeft = 0 } = boxRfg?.current || {};

    timer.current = setTimeout(() => {
      dragTargetRef.current = {
        item,
        position: {
          offsetWidth,
          offsetHeight,
          offsetTop,
          offsetLeft
        }
      };
      position.current = { x: pageX, y: pageY };
      prePosition.current = { x: pageX, y: pageY };
      document.addEventListener('mousemove', onMoveMask);
      forceUpdate();
    }, 300);
  };

  /** 鼠标在拖拽元素上的弹起事件 */
  const onMouseUp = () => {
    clearTimeout(timer.current);
    dragTargetRef.current = null;
    document.removeEventListener('mousemove', onMoveMask);
    forceUpdate();
  };

  /** 鼠标离开时关闭拖拽 */
  const onMouseLeave = () => {
    if (dragTargetRef.current || timer.current) onMouseUp();
  };

  return (
    <div className="dragContainerRoot" ref={containerRef}>
      <div className={classnames('dragContainer', className)} onMouseLeave={onMouseLeave}>
        {_.map(items.current, (item, index: number) => {
          const { id, dom, updateKey, disabled } = item;
          const isActive = id === activeID;
          return (
            <DragBox
              key={`${id}_${updateKey}`}
              className={index < items.current.length - 1 ? 'line' : ''}
              item={item}
              active={isActive}
              disabled={!index && items.current.length === 1} // 最后一个不允许删除
              onInit={onInit}
              onMouseUp={onMouseUp}
              onMouseDown={(data: any) => onMouseDown(data, !!disabled)}
              onDeleteComponent={onDeleteComponent}
            >
              {dom}
            </DragBox>
          );
        })}
        <div
          className={classnames('boxMoving', { moving: !!dragTargetRef.current })}
          style={{ width: offsetWidth, height: offsetHeight, top: offsetTop + offset.y, left: offsetLeft }}
        />
      </div>
    </div>
  );
};

export default DragContainer;
