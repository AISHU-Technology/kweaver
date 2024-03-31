import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import { Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import { GRAPH_CONFIG } from '@/enums';
import apiService from '@/utils/axios-http/engineServer';
import { getParam } from '@/utils/handleFunction';
import serviceGraphDetail from '@/services/graphDetail';

import GraphG6 from '../GraphG6/index';
import HeaderOperation from './HeaderOperation';
import ExploreLoadTip from './ExploreLoadTip';
import SimpleLayout from './SimpleLayout';
import LeftSpace from '../LeftSpace';
import IconPreRender from './IconPreRender';
import RemindTip from './RemindTip';

import kgEmpty from '@/assets/images/kgEmpty.svg';

import './style.less';

type GraphContainerType = {
  toolbarVisible?: boolean; // 是否展示操作条
  configMenu?: {
    canvas: { [key: string]: any };
    node: { [key: string]: any };
    edge: { [key: string]: any };
    subgraph: { [key: string]: any };
  }; // 右键菜单配置
  configSearch?: any; // 操作条的第一个下拉元素的配置项
  configOperate?: any; // 操作条的配置项
  configFeatures?: any; // 画布其他散碎功能配置(欢迎语、参数搜索工具), 目前仅图服务生效
  selectedItem: any;
  empty?: React.ReactNode; // 自定义为空的缺醒
  leftDrawerKey: string;
  graphLayoutPattern?: string;
  onChangeData: (item: { type: string; data: any }) => void;
  onOpenLeftDrawer: (key: string) => void;
  onCloseLeftDrawer: (key?: string) => void;
  onOpenRightDrawer: (key: string) => void;
  onCloseRightDrawer: () => void;
  onOpenSaveModal?: (data: { targetKey?: string; callBack?: any; isSkipPopup?: boolean }) => void;
  onChangeGraphItems?: (item: any) => void;
};
const DEFAULT_CONFIG_SEARCH = {
  search: { checked: true },
  sql: { checked: true },
  neighbors: { checked: true },
  path: { checked: true }
};
export const CONFIG_OPERATE = {
  undo: { checked: true },
  redo: { checked: true },
  removeSelected: { checked: true },
  removeOther: { checked: true },
  removeAll: { checked: true },
  'hide&show': { checked: true },
  styleSetting: { checked: true },
  layout: { checked: true },
  algorithm: { checked: true },
  louvain: { checked: true },
  loopDetection: { checked: true },
  pageRank: { checked: true },
  layoutSimple: { checked: true },
  sliced: { checked: true },
  simpleSearch: { checked: false },
  simpleSql: { checked: false },
  simpleNeighbors: { checked: false },
  simplePath: { checked: false },
  zoom: { checked: true },
  locate: { checked: true },
  fitView: { checked: true },
  fitCenter: { checked: true },
  statistics: { checked: true },
  canvasSetting: { checked: true },
  downloadImage: { checked: true },
  save: { checked: true }
};
const COMMON_PROPERTIES = (type: string) => [
  { key: '#id', alias: 'Id', value: '', type: 'string', isChecked: false, isDisabled: false },
  {
    key: type === 'node' ? '#entity_class' : '#edge_class',
    alias: '类名',
    value: '',
    type: 'string',
    isChecked: false,
    isDisabled: false
  },
  { key: '#alias', alias: '类的显示名', value: '', type: 'string', isChecked: false, isDisabled: false }
];
const DEFAULT_COLOR = '#126ee3';

const GraphContainer = (props: GraphContainerType) => {
  const {
    toolbarVisible = false,
    configMenu,
    configSearch = DEFAULT_CONFIG_SEARCH,
    configOperate = CONFIG_OPERATE,
    configFeatures
  } = props;

  const { selectedItem, empty, leftDrawerKey, graphLayoutPattern } = props;
  const {
    onChangeData,
    onOpenLeftDrawer,
    onCloseLeftDrawer,
    onOpenRightDrawer,
    onCloseRightDrawer,
    onOpenSaveModal,
    onChangeGraphItems
  } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [ontoData, setOntoData] = useState({});

  const kgId = selectedItem?.detail?.kg?.kg_id;
  const backColor = GRAPH_CONFIG.BACKGROUND_COLOR?.[selectedItem?.graphConfig?.color];
  const backImage = GRAPH_CONFIG.BACKGROUND_IMAGE?.[selectedItem?.graphConfig?.image];

  selectedItem.ontoData = ontoData;
  selectedItem.configFeatures = configFeatures; // 把configFeatures挂载到selectedItem，用来控制结果显示面板
  selectedItem.graphLayoutPattern = graphLayoutPattern; // 把图分析的的图谱类型挂载到对象上

  useEffect(() => {
    !toolbarVisible && onCloseLeftDrawer();
  }, [toolbarVisible]);

  useEffect(() => {
    if (!kgId) return;
    getClassData();
  }, [kgId]);

  useEffect(() => {
    if (_.isEmpty(ontoData)) return;
    if (selectedItem?.graphStyle?.notUpdate) return;
    // 监听 selectedItem?.graphStyle 是为了在图谱渲染后取回样式，但是在手动调整后不需要重新构造
    onUpdateGraphStyle(ontoData);
  }, [ontoData, JSON.stringify(selectedItem?.graphStyle)]);

  const onUpdateGraphStyle = (source: any) => {
    const newGraphStyle = {
      node: {},
      edge: {},
      more: {
        __more: {
          class: '__more',
          alias: intl.get('exploreGraph.more'),
          fillColor: 'rgba(0,0,0,.25)',
          strokeColor: 'rgba(0,0,0,.25)',
          icon: '',
          scope: 'all',
          type: 'customCircle',
          size: 36,
          position: 'top',
          labelLength: 15,
          labelFill: '#000000',
          showLabels: [{ key: 'more', alias: 'more', value: intl.get('exploreGraph.more'), isChecked: true }]
        }
      },
      ..._.cloneDeep(selectedItem?.graphStyle)
    };

    _.forEach(source?.entity, (item: any) => {
      const { name, alias, color = DEFAULT_COLOR, icon = 'null', default_tag, properties } = item;
      const _showLabels: any = [];
      _.forEach(properties, item => {
        const { name, alias, type } = item;
        const newShowLabel = { key: name, alias, value: '', type, isChecked: false, isDisabled: false };
        if (name === default_tag) return _showLabels.unshift({ ...newShowLabel, isChecked: true });
        _showLabels.push(newShowLabel);
      });

      const style = {
        _class: name,
        alias,
        icon,
        iconColor: 'rgba(255,255,255,1)',
        fillColor: color,
        strokeColor: color,
        type: 'customCircle',
        scope: 'all',
        size: 36,
        position: 'top',
        labelLength: 15,
        labelFixLength: 160,
        labelType: 'adapt',
        labelFill: '#000000',
        showLabels: [...COMMON_PROPERTIES('node'), ..._showLabels],
        ...(newGraphStyle?.node?.[item?.name] || {})
      };
      newGraphStyle.node[item.name] = style;
    });
    _.forEach(source?.edge, (item: any) => {
      const { name, alias, color = DEFAULT_COLOR, properties } = item;

      const style = {
        _class: name,
        alias,
        type: 'line',
        scope: 'all',
        size: 0.75,
        position: 'top',
        labelLength: 15,
        labelFill: color,
        strokeColor: color,
        showLabels: [
          ...COMMON_PROPERTIES('edge'),
          ..._.map(properties, item => {
            const { name, alias, type } = item;
            return { key: name, alias, value: '', type, isChecked: false, isDisabled: false };
          })
        ],
        ...(newGraphStyle?.edge?.[item?.name] || {})
      };
      _.forEach(style.showLabels, label => {
        if (label.key === '#alias') label.isChecked = true;
      });

      newGraphStyle.edge[item.name] = style;
    });

    onChangeData({ type: 'graphStyle', data: newGraphStyle });
  };
  const getClassData = async () => {
    const id = kgId || getParam('graphId'); // 图谱id
    const { action } = getParam(['action']);

    if (action === 'import') {
      if (parseInt(id) <= 0 || typeof parseInt(id) === 'number') return;
    } else {
      if (!parseInt(id)) return;
    }

    try {
      const resultOnto = await serviceGraphDetail.graphGetInfoOnto({ graph_id: id });
      const entityData = resultOnto?.res || {};
      setOntoData(entityData);
    } catch (err) {
      //
    }
  };

  // 取消操作
  const cancelOperation = () => {
    Object.keys(apiService.sources).forEach((key: string) => {
      (apiService.sources as any)[key](intl.get('exploreGraph.cancelRequest')); // 取消请求
    });
    onChangeData({ type: 'exploring', data: { isExploring: false } });
    // selectedItem?.graph?.current?.__stopRender();
  };

  const onTriggerLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <div
      className={classNames('graphContainerRoot', { 'graphContainerRoot-hideToolbar': !toolbarVisible })}
      style={{
        ...(backImage ? { backgroundImage: `url(${backImage})` } : {}),
        backgroundColor: backColor
      }}
    >
      <IconPreRender />

      {selectedItem?.exploring?.isExploring && (
        <ExploreLoadTip hasCancel={selectedItem?.exploring?.hasCancel} cancelOperation={cancelOperation} />
      )}

      <RemindTip
        style={{ top: toolbarVisible ? 60 : 0 }}
        selectedItem={selectedItem}
        content={configFeatures?.welcomeMessage?.visible ? configFeatures?.welcomeMessage?.content : ''}
        iframeStyle={selectedItem?.componentOrigin === 'AnalysisServiceConfig'}
      />

      {toolbarVisible && (
        <HeaderOperation
          configSearch={configSearch}
          configOperate={configOperate}
          selectedItem={selectedItem}
          onChangeData={onChangeData}
          onOpenLeftDrawer={onOpenLeftDrawer}
          onOpenRightDrawer={onOpenRightDrawer}
          onCloseRightDrawer={onCloseRightDrawer}
          onOpenSaveModal={onOpenSaveModal}
        />
      )}
      <LeftSpace
        ontoData={ontoData}
        selectedItem={selectedItem}
        leftDrawerKey={leftDrawerKey}
        configOperate={configOperate}
        onChangeData={onChangeData}
        onOpenLeftDrawer={onOpenLeftDrawer}
        onCloseLeftDrawer={onCloseLeftDrawer}
        onCloseRightDrawer={onCloseRightDrawer}
        onChangeGraphItems={onChangeGraphItems}
      />
      {!isLoading && !selectedItem?.graphData?.nodes?.length
        ? empty || (
            <div className="kw-center" style={{ height: '100%', flexDirection: 'column' }}>
              <img src={kgEmpty} />
              <div className="kw-c-text">
                {intl.get('exploreGraph.clickSearch').split('|')[0]}
                <Button type="link" style={{ padding: 0, minWidth: 0 }} onClick={() => onOpenLeftDrawer('search')}>
                  {intl.get('exploreGraph.clickSearch').split('|')[1]}
                </Button>
                {intl.get('exploreGraph.clickSearch').split('|')[2]}
              </div>
            </div>
          )
        : null}
      <div className="graphLoadingBox">
        {isLoading && (
          <div className="loading">
            <LoadingOutlined style={{ fontSize: 30 }} />
          </div>
        )}
        <GraphG6
          configMenu={configMenu}
          selectedItem={selectedItem}
          onChangeData={onChangeData}
          onTriggerLoading={onTriggerLoading}
          onOpenLeftDrawer={onOpenLeftDrawer}
          onOpenRightDrawer={onOpenRightDrawer}
          onCloseRightDrawer={onCloseRightDrawer}
        />
      </div>
      {toolbarVisible && configOperate?.layout?.checked && (
        <SimpleLayout selectedItem={selectedItem} onChangeData={onChangeData} onCloseLeftDrawer={onCloseLeftDrawer} />
      )}
    </div>
  );
};

export default GraphContainer;
