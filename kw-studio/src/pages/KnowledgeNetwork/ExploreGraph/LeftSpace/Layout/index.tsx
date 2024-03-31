import React, { useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Menu, Modal, Dropdown } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

import { GRAPH_LAYOUT, GRAPH_LAYOUT_PATTERN } from '@/enums';
import IconFont from '@/components/IconFont';
import PreTreeModal from '../../components/PreTreeModal';
import { LeftDrawer } from '../components';

import ConfigTree from './ConfigTree';
import ConfigDagre from './ConfigDagre';
import ConfigForce from './ConfigForce';

import './style.less';

const LAYOUT_LIST = [
  {
    key: GRAPH_LAYOUT.FREE,
    title: intl.get('exploreGraph.layout.freeLayout'),
    icon: <IconFont type="icon-ziyoubuju" style={{ fontSize: 24, color: '#126ee3', padding: '2px 3px 0 0' }} />
  },
  {
    key: GRAPH_LAYOUT.DAGRE,
    title: intl.get('exploreGraph.layout.dagreLayout'),
    icon: <IconFont type="icon-cengcibuju" style={{ fontSize: 24, color: '#126ee3' }} />
  },
  {
    key: GRAPH_LAYOUT.FORCE,
    title: intl.get('exploreGraph.layout.forceLayout'),
    icon: <IconFont type="icon-lidaobuju" style={{ fontSize: 24, color: '#126ee3' }} />
  },
  {
    key: GRAPH_LAYOUT.TREE,
    border: { position: 'Top' },
    title: intl.get('exploreGraph.layout.compactBoxLayout'),
    icon: <IconFont type="icon-shuzhuangbuju" style={{ fontSize: 24, color: '#126ee3' }} />
  }
];
const LAYOUT_PATTERN = {
  [GRAPH_LAYOUT_PATTERN.COMMON]: [GRAPH_LAYOUT.FREE, GRAPH_LAYOUT.DAGRE, GRAPH_LAYOUT.FORCE],
  [GRAPH_LAYOUT_PATTERN.TREE]: [GRAPH_LAYOUT.TREE]
};
const Layout = (props: any) => {
  const { className, selectedItem } = props;
  const { onChangeData, onCloseLeftDrawer } = props;
  const graphLayoutPattern = selectedItem.graphLayoutPattern;

  const layoutConfig = useMemo(() => {
    if (_.isEmpty(selectedItem?.layoutConfig)) return {};
    return selectedItem?.layoutConfig;
  }, [JSON.stringify(selectedItem?.layoutConfig)]);
  const layoutKey = layoutConfig?.key || GRAPH_LAYOUT.FREE;

  const selectLayout = useMemo(() => {
    return _.filter(LAYOUT_LIST, item => item?.key === layoutKey)?.[0] || LAYOUT_LIST[0];
  }, [layoutKey, graphLayoutPattern]);

  const [layouts, setLayouts] = useState(LAYOUT_LIST);
  useEffect(() => {
    if (!graphLayoutPattern) return;
    const filterDeps = LAYOUT_PATTERN[graphLayoutPattern];
    const newLayouts = _.filter(LAYOUT_LIST, item => _.includes(filterDeps, item.key));
    setLayouts(newLayouts);
  }, [graphLayoutPattern]);

  // 切换布局
  const [preTreeModal, setPreTreeModal] = useState(false);
  const onOpenPreTreeModal = () => setPreTreeModal(true);
  const onClosePreTreeModal = () => setPreTreeModal(false);
  const onChangeKey = (key: string) => {
    const mustSelectTreeRoot =
      selectedItem.graph.current?.getNodes()?.length > 0 &&
      key === GRAPH_LAYOUT.TREE &&
      selectedItem?.layoutConfig?.key !== GRAPH_LAYOUT.TREE;
    if (mustSelectTreeRoot) return onOpenPreTreeModal();

    const lockNode = selectedItem.graph.current.find('node', (node: any) => node.get('locked'));

    if (lockNode) {
      Modal.confirm({
        title: intl.get('exploreGraph.layout.tips'),
        icon: <ExclamationCircleOutlined />,
        content: intl.get('exploreGraph.layout.fixedSwitching'),
        onOk: () => {
          const sourceData = selectedItem.graphData;
          sourceData.nodes = _.map(sourceData.nodes, item => ({ ...item, isLock: false }));
          selectedItem.graph.current.__canvasRefresh === false;
          onChangeData({ type: 'graphData', data: sourceData });

          const newConfig = selectedItem?.layoutConfig || {};
          onChangeData({ type: 'layoutConfig', data: { ...newConfig, key, isHaveChanged: true } });
        }
      });
    } else {
      const newConfig = selectedItem?.layoutConfig || {};
      onChangeData({ type: 'layoutConfig', data: { ...newConfig, key, isHaveChanged: true } });
    }
  };

  const onSelectTree = (source: any) => {
    const newConfig = selectedItem?.layoutConfig || {};
    onChangeData({ type: 'graphData', data: source });
    onChangeData({ type: 'layoutConfig', data: { ...newConfig, key: GRAPH_LAYOUT.TREE, isHaveChanged: true } });
    onClosePreTreeModal();
  };

  const menus = (
    <Menu>
      {_.map(layouts, item => {
        const { key, icon, title, border } = item;
        const isSelect = layoutKey === key;
        const borderStyle = border ? { [`border${[border?.position]}`]: '1px dashed var(--kw-line-color)' } : {};
        return (
          <Menu.Item key={key} style={{ padding: '5px 0px' }} onClick={() => onChangeKey(key)}>
            <div
              className={classnames('kw-pointer', className, { layoutRootSelected: isSelect })}
              style={{ height: 60, padding: '8px 16px', borderRadius: 4, ...borderStyle }}
            >
              <div className="kw-align-center">
                <div className="layoutIconBox">{icon}</div>
                <div className="kw-pl-2">{title}</div>
              </div>
            </div>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  // 更新布局
  const onChangeConfig = (key: string) => (config: any) => {
    const newConfig = selectedItem?.layoutConfig || {};
    onChangeData({ type: 'layoutConfig', data: { ...newConfig, key, [key]: config } });
  };

  return (
    <LeftDrawer
      className={classnames('layoutRoot', className)}
      title={intl.get('exploreGraph.layout.layout')}
      onCloseLeftDrawer={onCloseLeftDrawer}
    >
      {layouts.length === 1 ? (
        <div
          className="kw-border kw-pointer kw-mt-6"
          style={{ height: 64, padding: '8px 16px', borderRadius: 4 }}
          onClick={() => onChangeKey(GRAPH_LAYOUT.TREE)}
        >
          <div className="kw-align-center">
            <div className="layoutIconBox">{selectLayout.icon}</div>
            <div className="kw-pl-2">{selectLayout?.title}</div>
          </div>
        </div>
      ) : (
        <Dropdown className="kw-border kw-space-between" overlay={menus} trigger={['click']}>
          <div className="kw-pointer kw-mt-6" style={{ height: 64, padding: '8px 16px', borderRadius: 4 }}>
            <div className="kw-align-center">
              <div className="layoutIconBox">{selectLayout.icon}</div>
              <div className="kw-pl-2">{selectLayout?.title}</div>
            </div>
            <IconFont type="icon-xiala" style={{ fontSize: 12, color: 'rgba(0,0,0,.45)' }} />
          </div>
        </Dropdown>
      )}

      <div className="kw-pt-4">
        {layoutKey === GRAPH_LAYOUT.TREE && (
          <ConfigTree
            selectedItem={selectedItem}
            defaultData={layoutConfig[layoutKey]}
            onChangeConfig={onChangeConfig(GRAPH_LAYOUT.TREE)}
          />
        )}
        {layoutKey === GRAPH_LAYOUT.DAGRE && (
          <ConfigDagre defaultData={layoutConfig[layoutKey]} onChangeConfig={onChangeConfig(GRAPH_LAYOUT.DAGRE)} />
        )}
        {layoutKey === GRAPH_LAYOUT.FORCE && (
          <ConfigForce defaultData={layoutConfig[layoutKey]} onChangeConfig={onChangeConfig(GRAPH_LAYOUT.FORCE)} />
        )}
      </div>
      {preTreeModal && (
        <PreTreeModal
          config={selectedItem?.layoutConfig}
          selectedItem={selectedItem}
          onOk={onSelectTree}
          onCancel={onClosePreTreeModal}
        />
      )}
    </LeftDrawer>
  );
};

export default Layout;
