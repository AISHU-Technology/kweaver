import React, { useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { useHistory, useLocation } from 'react-router-dom';
import { message } from 'antd';

import { GRAPH_CONFIG } from '@/enums';
import { getParam, isDef } from '@/utils/handleFunction';
import servicesVisualAnalysis from '@/services/visualAnalysis';

import GraphContainer, { CONFIG_OPERATE } from '../../GraphContainer';
import { graphPolyfill } from '../../polyfill';

import './style.less';

type TabsPaneType = {
  canvasJson?: string; // json图数据
  newTabData?: any;
  selectedItem: any;
  empty?: React.ReactNode; // 自定义为空的缺醒
  leftDrawerKey: string;
  onChangeData: (item: { type: string; data: any }) => void;
  onOpenLeftDrawer: (key: string) => void;
  onCloseLeftDrawer: () => void;
  onOpenRightDrawer: (key: string) => void;
  onCloseRightDrawer: () => void;
  onOpenSaveModal?: (data: { targetKey?: string; callBack?: any; isSkipPopup?: boolean }) => void;
  onChangeGraphItems?: (item: any) => void;
};
const TabsPane = (props: TabsPaneType) => {
  const history = useHistory();
  const location = useLocation();
  const { canvasJson, newTabData, selectedItem, leftDrawerKey, empty } = props;
  const {
    onChangeData,
    onOpenLeftDrawer,
    onCloseLeftDrawer,
    onOpenRightDrawer,
    onCloseRightDrawer,
    onOpenSaveModal,
    onChangeGraphItems
  } = props;

  useEffect(() => {
    if (!isDef(canvasJson)) return;
    try {
      const { nodes = [], edges = [], layoutConfig = {} } = JSON.parse(canvasJson!) || {};
      if (_.isEmpty(nodes)) return;
      onChangeData({ type: 'layoutConfig', data: layoutConfig });
    } catch (error) {
      //
    }
  }, [canvasJson]);

  useEffect(() => {
    if (getParam('opType') === 'add') {
      if (newTabData?.type === 'add') {
        const { kg_id, kg_name } = newTabData;
        onChangeData({
          type: 'detail',
          data: { ...selectedItem.detail, kg: { kg_id, name: kg_name }, canvas_name: selectedItem?.title }
        });
      } else if (newTabData?.type === 'open') {
        getData(newTabData?.c_id);
      } else {
        const kg_id = getParam('graphId');
        const kg_name = getParam('kg_name');
        onChangeData({
          type: 'detail',
          data: { ...selectedItem.detail, kg: { kg_id, name: kg_name }, canvas_name: selectedItem?.title }
        });
      }
    } else {
      if (newTabData?.type === 'add') {
        const { kg_id, kg_name } = newTabData;
        onChangeData({
          type: 'detail',
          data: { ...selectedItem.detail, kg: { kg_id, name: kg_name }, canvas_name: selectedItem?.title }
        });
      } else if (newTabData?.type === 'open') {
        getData(newTabData?.c_id);
      } else {
        getData(getParam('c_id'));
      }
    }
  }, [selectedItem?.key, location?.search]);
  const getData = async (c_id: number | string) => {
    if (!c_id) return;
    try {
      const result = await servicesVisualAnalysis.visualGetCanvasInfoById(c_id);
      if (result?.res) {
        const detail = result?.res;
        if (getParam('opType') === 'copy' && newTabData?.type !== 'add') {
          detail.c_id = null;
          detail.canvas_name = intl.get('exploreGraph.copyOf', { name: detail.canvas_name });
        }
        if (getParam('opType') === 'edit') detail.currentTime = new Date().valueOf();
        onChangeData({ type: 'detail', data: { ...selectedItem.detail, ...detail } });
        if (result?.res?.canvas_body) {
          try {
            const canvas_body = JSON.parse(result?.res?.canvas_body) || {};
            const {
              nodes = [],
              edges = [],
              graphConfig = {},
              layoutConfig = {},
              rules = {},
              graphStyle = {},
              sliced = []
            } = canvas_body || {};
            const graphData = { nodes, edges };
            graphPolyfill(graphData);
            onChangeData({ type: 'rules', data: rules }); // 获取之前保存的规则
            onChangeData({ type: 'graphStyle', data: graphStyle });
            onChangeData({ type: 'graphConfig', data: { ...GRAPH_CONFIG.DEFAULT, ...graphConfig } });
            onChangeData({ type: 'layoutConfig', data: { ...layoutConfig, initLayout: layoutConfig?.key } });
            onChangeData({ type: 'sliced', data: sliced });
            if (_.isEmpty(nodes)) return;
            onChangeData({ type: 'graphData', data: graphData });
          } catch (error) {}
        }
      } else {
        message.warning(intl.get('exploreGraph.notCurrentlyExist'));
        history.goBack();
      }
    } catch (error) {}
  };

  return (
    <div className="graphContainerRoot">
      <GraphContainer
        toolbarVisible={true}
        selectedItem={selectedItem}
        empty={empty}
        leftDrawerKey={leftDrawerKey}
        onChangeData={onChangeData}
        onOpenLeftDrawer={onOpenLeftDrawer}
        onCloseLeftDrawer={onCloseLeftDrawer}
        onOpenRightDrawer={onOpenRightDrawer}
        onCloseRightDrawer={onCloseRightDrawer}
        onOpenSaveModal={onOpenSaveModal}
        onChangeGraphItems={onChangeGraphItems}
        configOperate={{
          ...CONFIG_OPERATE,
          downloadImage: { checked: false },
          sliced: { checked: false }
        }}
      />
    </div>
  );
};

export default TabsPane;
