import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { LeftOutlined, CloseOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import Format from '@/components/Format';
import RetrievalVidRes from './RetrievalVidRes';
import SqlQueryRes from './SqlQueryRes';
import NeighborQueryRes from './NeighborQueryRes';
import PathQueryRes from './PathQueryRes';
import { RESULT_TYPE } from './enums';
import { constructRetrievalVid, constructNeighbor, constructPaths, constructSql } from './utils';
import './style.less';

export interface ResultPanelProps {
  className?: string;
  style?: React.CSSProperties;
  visible?: boolean;
  selectedItem?: any; // 画布实例
  data: any; // 数据
  originData: any; // 原始数据
  from: keyof typeof RESULT_TYPE;
  hideStatement?: boolean; // 图服务隐藏查询语句
  jsonOption?: boolean; // 是否显示json
  params?: Record<string, any>; // 请求的参数, json弹窗中需要显示
  checkable?: boolean; // 是否可选择添加
  title?: React.ReactNode; // 标题
  header?: React.ReactNode; // 显式设置null则无头部
  onAdd?: (data: { graph: any; groups?: any[] }) => void; // 添加的回调, 返回图数据和子图列表
  onClose?: () => void; // 关闭面板的回调
  onBack?: () => void; // 返回的回调
  updateGraph?: (data: any) => void; // 更新画布的方法
}

type CheckInfo = {
  checked: string[] | Record<string, any>;
  used: string[] | Record<string, any>;
};

/**
 * 搜索结果面板组件
 */
const ResultPanel = (props: ResultPanelProps) => {
  const {
    className,
    style,
    selectedItem,
    data,
    originData,
    from,
    hideStatement = false,
    jsonOption = true,
    params,
    checkable,
    title,
    header,
    onClose,
    onBack,
    onAdd,
    updateGraph
  } = props;
  const [jsonVisible, setJsonVisible] = useState(false); // json弹窗
  const [checkInfo, setCheckInfo] = useState<CheckInfo>(() =>
    from === RESULT_TYPE.sql ? { checked: {}, used: {} } : { checked: [], used: [] }
  );

  /**
   * 选择添加时, 添加一个标识, 用于禁止操作顶部工具栏的部分功能
   * WARNING 组件是设计成 `真条件渲染` 才能这样写, 注意后续的变动
   */
  useEffect(() => {
    checkable && updateGraph?.({ type: 'resultSelecting', data: true });
    return () => {
      checkable && updateGraph?.({ type: 'resultSelecting', data: false });
    };
  }, [checkable]);

  /**
   * 选中的回调
   * @param keys
   */
  const onCheckChange = (keys: string[] | Record<string, any>) => {
    const checked = Array.isArray(keys)
      ? _.uniq([...keys, ...(checkInfo.used as string[])])
      : _.merge({ ...keys }, checkInfo.used);
    setCheckInfo(pre => ({ ...pre, checked }));
  };

  /**
   * 添加到画布
   * @param isAll 是否全部添加
   */
  const handleAdd = (isAll = false) => {
    let graph: any = { nodes: [], edges: [] };
    let groups: undefined | any[];
    let curChecked;
    if (!isAll) {
      if (Array.isArray(checkInfo.checked) && !checkInfo.checked?.length) return;
      curChecked = checkInfo.checked as string[];
    }
    switch (true) {
      case _.includes([RESULT_TYPE.search, RESULT_TYPE.vid], from):
        ({ graph } = constructRetrievalVid(data, curChecked));
        break;
      case from === RESULT_TYPE.neighbor:
        ({ graph } = constructNeighbor(data, curChecked));
        break;
      case from === RESULT_TYPE.path:
        ({ graph, groups } = constructPaths(data, curChecked));
        break;
      case from === RESULT_TYPE.sql:
        ({ graph, groups } = constructSql(data, isAll ? undefined : checkInfo));
        if (!isAll && !graph.nodes.length) return; // 数据比较复杂, 处理后才能确定是否都已经添加
        break;
      default:
        break;
    }
    setCheckInfo(pre => ({ ...pre, used: _.cloneDeep(pre.checked) }));
    onAdd?.({ graph, groups });
    // 全部添加时直接关闭
    if (isAll) {
      setJsonVisible(false);
      onClose?.();
    }
  };

  /**
   * 选中结果对应的图元素
   */
  const onFocusItem = ({ type, data }: any) => {
    const nodes: any = [];
    const edges: any = [];
    _.forEach(data.nodes, d => {
      const node = selectedItem?.graph?.current?.findById(d.id);
      if (node) {
        node.show();
        nodes.push(node);
      }
    });
    _.forEach(data.edges, d => {
      const edge = selectedItem?.graph?.current?.findById(d.id);
      if (edge) {
        edge.show();
        edges.push(edge);
      }
    });
    updateGraph?.({ type: 'selected', data: { nodes, edges, length: nodes.length + edges.length } });
    const centerNode = nodes[Math.floor(nodes.length / 2)];
    centerNode &&
      selectedItem?.graph?.current?.focusItem(centerNode, true, {
        easing: 'easeCubic',
        duration: 800
      });
  };

  /**
   * 是否禁用添加
   */
  const isDisableAdd = () => {
    return JSON.stringify(checkInfo.checked) === JSON.stringify(checkInfo.used);
  };

  return (
    <div className={classNames('result-panel-root', className)} style={style}>
      <div className="flex-box kw-h-100 kw-w-100">
        {header === null
          ? null
          : header || (
              <div className="res-header kw-space-between">
                <div className="kw-pointer" onClick={onBack}>
                  <LeftOutlined className="kw-mr-3" />
                  <Format.Title>{title}</Format.Title>
                </div>
                <div className="kw-pl-1 kw-pr-1 kw-pointer" onClick={() => onClose?.()}>
                  <CloseOutlined style={{ fontSize: 16 }} />
                </div>
              </div>
            )}
        <div className="res-title kw-space-between kw-mt-4 kw-mb-2">
          <Format.Title strong={4}>{intl.get('exploreGraph.searchResult')}</Format.Title>
          <Button type="link" onClick={() => setJsonVisible(true)}>
            {intl.get('exploreGraph.viewJson')}
          </Button>
        </div>
        <div className="res-list-box">
          {_.includes([RESULT_TYPE.search, RESULT_TYPE.vid], from) && (
            <RetrievalVidRes
              dataSource={data}
              checkable={checkable}
              checkedKeys={checkInfo.checked}
              disabledKeys={checkInfo.used}
              onCheckChange={onCheckChange}
            />
          )}
          {_.includes([RESULT_TYPE.sql, RESULT_TYPE.graphQuery], from) && (
            <SqlQueryRes
              dataSource={data}
              hideStatement={hideStatement}
              checkable={checkable}
              checkedKeys={checkInfo.checked}
              disabledKeys={checkInfo.used}
              onCheckChange={onCheckChange}
              onFocusItem={onFocusItem}
            />
          )}
          {_.includes([RESULT_TYPE.neighbor, RESULT_TYPE.neighborByServices], from) && (
            <NeighborQueryRes
              dataSource={data.nodes}
              checkable={checkable}
              checkedKeys={checkInfo.checked}
              disabledKeys={checkInfo.used}
              onCheckChange={onCheckChange}
            />
          )}
          {_.includes([RESULT_TYPE.path, RESULT_TYPE.pathByServices], from) && (
            <PathQueryRes
              dataSource={data}
              checkable={checkable}
              checkedKeys={checkInfo.checked}
              disabledKeys={checkInfo.used}
              onCheckChange={onCheckChange}
              onFocusItem={onFocusItem}
            />
          )}
        </div>

        {checkable && (
          <div className="res-footer-box">
            <Button className="kw-mr-1" onClick={() => handleAdd(true)}>
              {intl.get('exploreGraph.addAll')}
            </Button>
            <Button type="primary" className="kw-ml-1" disabled={isDisableAdd()} onClick={() => handleAdd()}>
              {intl.get('exploreGraph.addTwo')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default (props: ResultPanelProps) => (props.visible ? <ResultPanel {...props} /> : null);
export * from './enums';
export * from './parse';
export const getInitResState = () => ({
  visible: false,
  data: [] as any,
  originData: {} as any,
  checkable: false,
  params: {} as any
});
