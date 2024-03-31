import React, { useState } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Algorithm as AlgorithmSource } from '@antv/g6';
import { message, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import HOOKS from '@/hooks';

import { LeftDrawer } from '../components';
import { AlgorithmType } from './type';
import AlgorithmItemLine from './AlgorithmItemLine';
import Louvain from './Louvain';
import PageRank from './PageRank';
import LoopDetection, { LoopDetectionDataProps } from './LoopDetection';

import './style.less';

const getDefaultMenus = () => [
  {
    items: [
      {
        key: 'louvain',
        label: `Louvain ${intl.get('exploreGraph.algorithm.communityDiscovery')}`,
        question: intl.get('exploreGraph.algorithm.louvainDefinition')
      }
    ],
    title: intl.get('exploreGraph.algorithm.communityDiscovery'),
    visible: false
  },
  {
    items: [
      {
        key: 'pageRank',
        label: 'PageRank',
        question: intl.get('exploreGraph.algorithm.calculatedUsing')
      }
    ],
    title: intl.get('exploreGraph.algorithm.centralityCalculation'),
    visible: false
  },
  {
    items: [
      {
        key: 'loopDetection',
        label: intl.get('exploreGraph.algorithm.loopDetection'),
        question: intl.get('exploreGraph.algorithm.loopDetectionDescribe')
      }
    ],
    title: intl.get('exploreGraph.algorithm.graphFeatureDetection'),
    visible: false
  }
];

const Algorithm = (props: any) => {
  const { className, style = {} } = props;
  const { selectedItem, configOperate } = props;
  const { onChangeData, onCloseLeftDrawer } = props;

  const [loopDetectionData, setLoopDetectionData] = useState<LoopDetectionDataProps[]>([]);
  const [algorithmMenu, setAlgorithmMenu] = useState({
    menuDataSource: getDefaultMenus(),
    activeAlgorithmMenu: null as AlgorithmType | null
  });
  const [loading, setLoading] = useState<boolean>(false);

  HOOKS.useDeepCompareEffect(() => {
    handleAlgorithmItemData();
  }, [configOperate]);

  /**
   * 根据配置处理图计算显示菜单的数据源
   */
  const handleAlgorithmItemData = () => {
    const visibleItemsKey: string[] = []; // 儲存要显示的菜单key
    if (configOperate?.louvain?.checked) {
      visibleItemsKey.push('louvain');
    }
    if (configOperate?.pageRank?.checked) {
      visibleItemsKey.push('pageRank');
    }
    if (configOperate?.loopDetection?.checked) {
      visibleItemsKey.push('loopDetection');
    }
    const menuDataSource = getDefaultMenus();
    if (visibleItemsKey.length > 0) {
      menuDataSource.forEach(menu => {
        menu.items.forEach((item, index) => {
          if (visibleItemsKey.includes(item.key)) {
            menu.visible = true;
          } else {
            menu.items.splice(index, 1);
          }
        });
      });
    } else {
      onCloseLeftDrawer?.();
    }
    setAlgorithmMenu(pre => ({
      ...pre,
      menuDataSource
    }));
  };

  const onJudgeOnlyOneClassEdge = () => {
    const temp: any = {};
    _.forEach(selectedItem?.graph?.current?.getEdges(), item => {
      const _sourceData = item.getModel()?._sourceData;
      temp[_sourceData?.class] = { value: _sourceData?.class, label: _sourceData?.alias };
    });
    const edgesClass = _.keys(temp);
    if (edgesClass?.length !== 1) {
      message.warning(intl.get('exploreGraph.algorithm.louvainMustOnlyOneRelationshipClass'));
      return true;
    }
    return false;
  };

  /**
   * 检测graph图中所有的环（有向）
   */
  const detectAllCycles = (): boolean => {
    setLoading(true);
    const graphData = _.cloneDeep(selectedItem?.graphData);
    // 考虑到节点或者边可能会隐藏的情况
    graphData.edges = graphData.edges.filter((item: any) => !item.hide);
    graphData.nodes = graphData.nodes.filter((item: any) => !item.hide);
    graphData?.edges.forEach((edge: any) => {
      edge.source = edge.source ?? edge.relation?.[0];
      edge.target = edge.target ?? edge.relation?.[2];
    });
    const { detectAllCycles } = AlgorithmSource as any;
    const cycleResult: LoopDetectionDataProps[] = detectAllCycles(graphData, true);
    setLoopDetectionData(cycleResult);
    setLoading(false);
    if (cycleResult.length === 0) {
      message.warning(intl.get('exploreGraph.algorithm.loopDetectionToastTip'));
      return false;
    }
    return true;
  };

  /** 选择算法 */
  const onSelectAlgorithm = (data: AlgorithmType) => {
    if (selectedItem.faker) return;
    if (data.key === 'louvain') {
      const isOnlyOneClassEdge = onJudgeOnlyOneClassEdge();
      if (isOnlyOneClassEdge) return;
    }
    if (data.key === 'loopDetection') {
      if (!detectAllCycles()) {
        return;
      }
    }
    setAlgorithmMenu(preState => ({
      ...preState,
      activeAlgorithmMenu: data
    }));
  };

  const onBackToAlgorithmMenu = () => {
    setAlgorithmMenu(preState => ({
      ...preState,
      activeAlgorithmMenu: null
    }));
  };

  // 面板宽度拖拽
  const [canUseScaling, setCanUseScaling] = useState(false);
  const onCanUseScaling = (value: boolean) => {
    setCanUseScaling(value);
  };
  return (
    <LeftDrawer
      className={classnames('algorithmRoot', className)}
      style={style}
      scaling={canUseScaling}
      title={algorithmMenu.activeAlgorithmMenu ? '' : intl.get('exploreGraph.algorithm.graphAlgorithm')}
      onCloseLeftDrawer={onCloseLeftDrawer}
    >
      <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} />} spinning={loading}>
        {!algorithmMenu.activeAlgorithmMenu &&
          algorithmMenu.menuDataSource.map(
            menu =>
              menu.visible && (
                <div className="kw-pt-6" key={menu.title}>
                  <AlgorithmItemLine items={menu.items} title={menu.title} onClick={onSelectAlgorithm} />
                </div>
              )
          )}

        {algorithmMenu.activeAlgorithmMenu?.key === 'louvain' && (
          <Louvain
            selectedItem={selectedItem}
            algorithmData={algorithmMenu.activeAlgorithmMenu}
            onGoBack={onBackToAlgorithmMenu}
            onChangeData={onChangeData}
            onCanUseScaling={onCanUseScaling}
            onCloseLeftDrawer={onCloseLeftDrawer}
            onJudgeOnlyOneClassEdge={onJudgeOnlyOneClassEdge}
          />
        )}
        {algorithmMenu.activeAlgorithmMenu?.key === 'pageRank' && (
          <PageRank
            selectedItem={selectedItem}
            onChangeData={onChangeData}
            onGoBack={onBackToAlgorithmMenu}
            onCanUseScaling={onCanUseScaling}
            onCloseLeftDrawer={onCloseLeftDrawer}
          />
        )}
        {algorithmMenu.activeAlgorithmMenu?.key === 'loopDetection' && (
          <LoopDetection
            onGoBack={onBackToAlgorithmMenu}
            selectedTabItem={selectedItem}
            onCloseLeftDrawer={onCloseLeftDrawer}
            detectAllCycles={detectAllCycles}
            loopDetectionData={loopDetectionData}
            onChangeData={onChangeData}
          />
        )}
      </Spin>
    </LeftDrawer>
  );
};

export default (props: any) => {
  const { isVisible, ...other } = props;
  if (!isVisible) return null;
  return <Algorithm {...other} />;
};
