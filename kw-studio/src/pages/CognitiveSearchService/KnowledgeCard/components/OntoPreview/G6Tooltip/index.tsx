import React, { useState, useEffect, useRef } from 'react';
import type { Graph, IG6GraphEvent } from '@antv/g6';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import Format from '@/components/Format';
import serviceGraphDetail from '@/services/graphDetail';
import IndexesList from '@/pages/KnowledgeNetwork/KnowledgeGraph/GraphContent/GraphDetail/Menus/GraphInfo/ConfigurationDetails/IndexesList';
import './style.less';

export interface G6TooltipProps {
  className?: string;
  graph: Graph;
  graphId: number;
}

export interface Positions {
  /** 当前状态 */
  visible: boolean;
  x: number;
  y: number;
  /** 触发的元素数据 */
  data?: any;
}

const G6Tooltip = (props: G6TooltipProps) => {
  const { className, graph, graphId } = props;
  const forceShow = useRef(false); // 移入tooltip强制显示
  const timer = useRef<number>();
  const indexesCache = useRef<Record<string, any>>({}); // 索引的缓存
  const [positions, setPositions] = useState<Positions>({
    visible: false,
    x: 0,
    y: 0,
    data: null
  });

  useEffect(() => {
    graph.on('node:mouseenter', handleShow);
    graph.on('node:mouseleave', handleClose);
    graph.on('afterremoveitem', handleClose);
    graph.on('node:dragstart', handleDragStart);
    graph.on('node:dragend', handleDragEnd);

    return () => {
      forceShow.current = false;
      clearTimeout(timer.current);
      graph.off('node:mouseenter', handleShow);
      graph.off('node:mouseleave', handleClose);
      graph.off('afterremoveitem', handleClose);
      graph.off('node:dragstart', handleDragStart);
      graph.off('node:dragend', handleDragEnd);
    };
  }, []);

  /**
   * 调接口获取本体的索引
   * @param entity 本体数据
   */
  const getIndexes = async (entity: any) => {
    if (indexesCache.current[entity.name]) return indexesCache.current[entity.name];
    let result: any = {};
    try {
      result = await serviceGraphDetail.graphGetInfoDetail({
        graph_id: graphId,
        name: entity.name,
        type: 'entity'
      });
    } catch {
      //
    }

    const { indexes = [] } = result?.res || {};
    Object.assign(indexesCache.current, { [entity.name]: indexes });
    return indexes;
  };

  /**
   * 计算边界值
   * @param position
   */
  const getBoundaryXY = (position: { x: number; y: number }, data: any) => {
    const container = graph.getContainer();
    const { clientWidth, clientHeight } = container;
    const { properties = [], indexes = [] } = data || {};
    const tooltipWidth = 320;
    const proHeight = (properties.length + 1) * 28;
    const indexesHeight = _.reduce(indexes, (height, item) => height + (item.properties.length + 2) * 22 + 50, 45);
    const expectHeight = 125 + proHeight + indexesHeight;
    const tooltipHeight = Math.min(expectHeight, 500);
    let { x, y } = position;
    if (x + tooltipWidth > clientWidth) {
      x = clientWidth - tooltipWidth;
    }
    if (y + tooltipHeight > clientHeight) {
      y = Math.max(clientHeight - tooltipHeight, 0);
    }
    return { x, y };
  };

  // 打开tip
  const openTip = async (e: IG6GraphEvent) => {
    const node: any = e?.item?.getModel?.() || {};
    const { x, y, _sourceData } = node;
    if (!_sourceData) return;
    const indexes = await getIndexes(_sourceData);
    const data = { ..._sourceData, indexes };
    const { x: cX, y: cY } = graph.getCanvasByPoint(x || 0, y || 0);
    setPositions(pre => {
      return {
        ...pre,
        visible: true,
        data,
        ...getBoundaryXY({ x: cX + 20, y: cY }, data)
      };
    });
  };

  /**
   * 显示tooltip
   * @param e
   */
  const handleShow = (e: IG6GraphEvent) => {
    if (!e.item) return;
    e.preventDefault();
    e.stopPropagation();
    if (timer.current) {
      window.clearTimeout(timer.current);
    }

    // 设置位置
    timer.current = window.setTimeout(() => {
      openTip(e);
    }, 0);
  };

  /**
   * 关闭tooltip
   */
  const handleClose = () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
    }
    timer.current = window.setTimeout(() => {
      if (forceShow.current) return;
      setPositions({
        visible: false,
        data: null,
        x: 0,
        y: 0
      });
    }, 300);
  };

  /**
   * 拖拽时关闭
   */
  const handleDragStart = () => {
    forceShow.current = false;
    setPositions({
      visible: false,
      x: 0,
      y: 0,
      data: null
    });
  };

  /**
   * 拖拽结束恢复
   * @param e
   */
  const handleDragEnd = (e: IG6GraphEvent) => {
    if (!e.item) return;
    // 设置位置
    timer.current = window.setTimeout(() => {
      openTip(e);
    }, 0);
  };

  return (
    <div
      className={classNames(className, 'knw-card-g6-tooltip kw-p-5 kw-pb-3')}
      style={{ display: positions.visible ? 'block' : 'none', left: positions.x, top: positions.y }}
      onMouseEnter={() => (forceShow.current = true)}
      onMouseLeave={() => {
        forceShow.current = false;
        handleClose();
      }}
    >
      <Format.Title className="kw-mb-2">{intl.get('graphDetail.categoryInformation')}</Format.Title>
      <div className="kw-flex kw-mb-2">
        <div className="kw-w-50">{intl.get('graphDetail.entity')}</div>
        <div className="kw-w-50 text-right">
          <span
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              height: 12,
              width: 12,
              borderRadius: '50%',
              background: positions.data?.color
            }}
          />
          <Format.Title
            className="kw-ellipsis kw-ml-2"
            title={positions.data?.name}
            style={{ display: 'inline-block', verticalAlign: 'middle', maxWidth: 120 }}
          >
            {positions.data?.name}
          </Format.Title>
        </div>
      </div>
      <div className="kw-flex kw-mb-3">
        <div className="kw-w-50">{intl.get('graphDetail.entityAlias')}</div>
        <div className="kw-w-50 kw-ellipsis text-right" title={positions.data?.alias}>
          {positions.data?.alias}
        </div>
      </div>
      <Format.Title className="kw-mb-2">
        {intl.get('knowledgeCard.attribute')}
        <span className="kw-ml-1 kw-c-subtext" style={{ fontWeight: 400 }}>
          ({positions.data?.properties?.length || 0})
        </span>
      </Format.Title>
      {_.map(positions.data?.properties, item => (
        <div key={item.name} className="kw-flex kw-mb-2">
          <div className="kw-w-70 kw-ellipsis">
            {item.alias} ({item.name})
          </div>
          <div className="kw-w-30 kw-ellipsis text-right">{_.toUpper(item.type)}</div>
        </div>
      ))}
      {!!positions.data?.indexes?.length && <IndexesList items={positions.data.indexes} />}
    </div>
  );
};

export default (props: G6TooltipProps) => (props.graph ? <G6Tooltip {...props} /> : null);
