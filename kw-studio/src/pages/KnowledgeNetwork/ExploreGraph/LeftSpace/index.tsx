import React, { useEffect, useState, useRef } from 'react';
import _ from 'lodash';
import classnames from 'classnames';

import { GRAPH_LAYOUT } from '@/enums';
import { formatStatements } from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/assistant';

import RetrievalAndVid from './RetrievalVid';
import SqlQuery from './SqlQuery';
import NeighborQuery from './NeighborQuery';
import PathQuery from './PathQuery';
import Display from './Display';
import Layout from './Layout';
import Algorithm from './Algorithm';
import CustomSearchTool from './CustomSearchTool';
import Sliced from './Sliced';

import './style.less';

type LeftSpaceType = {
  ontoData: any;
  selectedItem: any;
  leftDrawerKey: string;
  onChangeData: (data: { type: string; data: any }) => void;
  onOpenLeftDrawer: (key: string) => void;
  onCloseLeftDrawer: (isOpen?: string) => void;
  onCloseRightDrawer: () => void;
  onChangeGraphItems?: (item: any) => void;
  configOperate?: any;
};

const LeftSpace = (props: LeftSpaceType) => {
  const { ontoData, selectedItem, leftDrawerKey, configOperate } = props;
  const { onChangeData, onOpenLeftDrawer, onCloseLeftDrawer, onCloseRightDrawer, onChangeGraphItems } = props;
  const searchToolRef = useRef<any>();
  const authorKgView = selectedItem?.detail?.authorKgView;
  const isLayoutTree = selectedItem?.layoutConfig?.key === GRAPH_LAYOUT.TREE;

  useEffect(() => {
    // 打开自定义右键功能
    const customEvt = selectedItem?.customRightClick;
    if (!customEvt) return;
    if (customEvt.visible) {
      onChangeConfig('custom', customEvt.data);
    }
  }, [selectedItem?.customRightClick]);

  const [classData, setClassData] = useState<Array<any>>([]);
  useEffect(() => {
    if (_.isEmpty(ontoData) || !authorKgView) return;
    setClassData(ontoData);
  }, [ontoData, authorKgView]);

  const setSelectNodes = (nodes: any) => {
    const selected = { ...selectedItem?.selected, nodes };
    selected.length = selected?.nodes?.length + selected?.edges?.length;
    Promise.resolve().then(() => onChangeData({ type: 'selected', data: selected }));
  };

  const [configData, setConfigData] = useState<any>({});
  const onChangeConfig = (key: string, data: any) => {
    const parameters = data.func?.parameters;
    // 单实体直接触发搜索
    if (
      data.node &&
      parameters?.length === 1 &&
      parameters?.[0]?.param_type === 'entity' &&
      parameters?.[0]?.options === 'single'
    ) {
      const paramItem = { ...parameters[0] };
      paramItem.input = data.node.id;
      const statements = formatStatements(data.func.code, [paramItem]);
      searchToolRef.current?.search([paramItem], 'add', statements);
      return;
    }

    onOpenLeftDrawer('custom');
    setConfigData(data);
  };

  return (
    <div className="leftSpaceRoot">
      {/* 关闭侧边保存数据的问题 */}
      <div className={classnames('leftSpaceDrawer', { displayBlock: leftDrawerKey === 'search' })}>
        <RetrievalAndVid
          leftDrawerKey={leftDrawerKey}
          classData={classData}
          isLayoutTree={isLayoutTree}
          selectedItem={selectedItem}
          onChangeData={onChangeData}
          onCloseLeftDrawer={onCloseLeftDrawer}
        />
      </div>
      <div className={classnames('leftSpaceDrawer', { displayBlock: leftDrawerKey === 'sql' })}>
        <SqlQuery
          leftDrawerKey={leftDrawerKey}
          selectedItem={selectedItem}
          onChangeData={onChangeData}
          onCloseLeftDrawer={onCloseLeftDrawer}
        />
      </div>
      <div className={classnames('leftSpaceDrawer', { displayBlock: leftDrawerKey === 'neighbors' })}>
        <NeighborQuery
          selectedItem={selectedItem}
          setSelectNodes={setSelectNodes}
          classData={classData}
          isLayoutTree={isLayoutTree}
          leftDrawerKey={leftDrawerKey}
          onChangeData={onChangeData}
          onCloseLeftDrawer={onCloseLeftDrawer}
          onCloseRightDrawer={onCloseRightDrawer}
        />
      </div>
      <div className={classnames('leftSpaceDrawer', { displayBlock: leftDrawerKey === 'path' })}>
        <PathQuery
          selectedItem={selectedItem}
          leftDrawerKey={leftDrawerKey}
          classData={classData}
          onChangeData={onChangeData}
          onCloseLeftDrawer={onCloseLeftDrawer}
          setSelectNodes={setSelectNodes}
          onCloseRightDrawer={onCloseRightDrawer}
        />
      </div>
      <Display
        className={classnames('leftSpaceDrawer', { displayBlock: leftDrawerKey === 'display' })}
        style={{ width: 400 }}
        isVisible={leftDrawerKey === 'display'}
        selectedItem={selectedItem}
        onChangeData={onChangeData}
        onCloseLeftDrawer={onCloseLeftDrawer}
      />
      <Layout
        className={classnames('leftSpaceDrawer', { displayBlock: leftDrawerKey === 'layout' })}
        selectedItem={selectedItem}
        onChangeData={onChangeData}
        onCloseLeftDrawer={onCloseLeftDrawer}
      />
      <Algorithm
        className={classnames('leftSpaceDrawer', { displayBlock: leftDrawerKey === 'algorithm' })}
        isVisible={leftDrawerKey === 'algorithm'}
        selectedItem={selectedItem}
        configOperate={configOperate}
        onChangeData={onChangeData}
        onCloseLeftDrawer={onCloseLeftDrawer}
      />
      <Sliced
        className={classnames('leftSpaceDrawer', { displayBlock: ['sliced', 'sliced-result'].includes(leftDrawerKey) })}
        visible={['sliced', 'sliced-result'].includes(leftDrawerKey)}
        selectedItem={selectedItem}
        onChangeData={onChangeData}
        onCloseLeftDrawer={onCloseLeftDrawer}
        onChangeGraphItems={onChangeGraphItems}
      />
      <div className={classnames('leftSpaceDrawer', { displayBlock: leftDrawerKey === 'custom' })}>
        <CustomSearchTool
          ref={searchToolRef}
          key={configData?.key}
          forceMultiple
          autoSearch
          hideExpandIcon
          canvasInstance={selectedItem}
          visible={leftDrawerKey === 'custom'}
          data={configData?.func || {}}
          updateGraph={onChangeData}
          onVisibleChange={visible => {
            if (!visible) {
              onCloseLeftDrawer('');
              onChangeData({ type: 'customRightClick', data: { visible: false, data: {} } });
            }
          }}
        />
      </div>
    </div>
  );
};

export default LeftSpace;
