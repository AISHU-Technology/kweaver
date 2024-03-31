import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Menu, Tooltip, Modal, Button, Dropdown } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

import { GRAPH_LAYOUT, GRAPH_LAYOUT_TREE_DIR, GRAPH_LAYOUT_DAGRE_DIR, GRAPH_LAYOUT_PATTERN } from '@/enums';
import IconFont from '@/components/IconFont';
import PreTreeModal from '../../components/PreTreeModal';

import './style.less';

// 紧凑树布局的选项
const labelTree: any = GRAPH_LAYOUT_TREE_DIR.getLabel();
const ICON_AND_LABEL_TREE = [
  {
    key: GRAPH_LAYOUT_TREE_DIR.LR,
    label: intl.get(labelTree[GRAPH_LAYOUT_TREE_DIR.LR]),
    icon: <IconFont type="icon-shuzhuangbuju" style={{ fontSize: 16, transform: 'rotate(270deg)' }} />
  },
  {
    key: GRAPH_LAYOUT_TREE_DIR.RL,
    label: intl.get(labelTree[GRAPH_LAYOUT_TREE_DIR.RL]),
    icon: <IconFont type="icon-shuzhuangbuju" style={{ fontSize: 16, transform: 'rotate(90deg)' }} />
  },
  {
    key: GRAPH_LAYOUT_TREE_DIR.TB,
    label: intl.get(labelTree[GRAPH_LAYOUT_TREE_DIR.TB]),
    icon: <IconFont type="icon-shuzhuangbuju" style={{ fontSize: 16 }} />
  },
  {
    key: GRAPH_LAYOUT_TREE_DIR.BT,
    label: intl.get(labelTree[GRAPH_LAYOUT_TREE_DIR.BT]),
    icon: <IconFont type="icon-shuzhuangbuju" style={{ fontSize: 16, transform: 'rotate(180deg)' }} />
  },
  {
    key: GRAPH_LAYOUT_TREE_DIR.H,
    label: intl.get(labelTree[GRAPH_LAYOUT_TREE_DIR.H]),
    icon: <IconFont type="icon-shuipingduicheng" style={{ fontSize: 16 }} />
  },
  {
    key: GRAPH_LAYOUT_TREE_DIR.V,
    label: intl.get(labelTree[GRAPH_LAYOUT_TREE_DIR.V]),
    icon: <IconFont type="icon-chuizhiduicheng" style={{ fontSize: 16 }} />
  }
];

// 层次布局选项
const labelDagre: any = GRAPH_LAYOUT_DAGRE_DIR.getLabelDir();
const ICON_AND_LABEL_DAGRE = [
  {
    key: GRAPH_LAYOUT_DAGRE_DIR.TB,
    label: intl.get(labelDagre[GRAPH_LAYOUT_DAGRE_DIR.TB]),
    icon: <IconFont type="icon-cengcibuju" style={{ fontSize: 16 }} />
  },
  {
    key: GRAPH_LAYOUT_DAGRE_DIR.BT,
    label: intl.get(labelDagre[GRAPH_LAYOUT_DAGRE_DIR.BT]),
    icon: <IconFont type="icon-cengcibuju" style={{ fontSize: 16, transform: 'rotate(180deg)' }} />
  },
  {
    key: GRAPH_LAYOUT_DAGRE_DIR.LR,
    label: intl.get(labelDagre[GRAPH_LAYOUT_DAGRE_DIR.LR]),
    icon: <IconFont type="icon-cengcibuju" style={{ fontSize: 16, transform: 'rotate(270deg)' }} />
  },
  {
    key: GRAPH_LAYOUT_DAGRE_DIR.RL,
    label: intl.get(labelDagre[GRAPH_LAYOUT_DAGRE_DIR.RL]),
    icon: <IconFont type="icon-cengcibuju" style={{ fontSize: 16, transform: 'rotate(90deg)' }} />
  }
];

// 快捷布局按钮
const LAYOUT_LIST = [
  {
    key: GRAPH_LAYOUT.FREE,
    title: intl.get('exploreGraph.layout.freeLayout'),
    icon: <IconFont type="icon-ziyoubuju" style={{ fontSize: 14, padding: '2px 3px 0 0' }} />
  },
  {
    key: GRAPH_LAYOUT.FORCE,
    title: intl.get('exploreGraph.layout.forceLayout'),
    icon: <IconFont type="icon-lidaobuju" style={{ fontSize: 14, padding: '2px 3px 0 0' }} />
  },
  {
    key: GRAPH_LAYOUT.DAGRE,
    title: intl.get('exploreGraph.layout.dagreLayout'),
    icon: <IconFont type="icon-cengcibuju" style={{ fontSize: 14 }} />,
    menus: ICON_AND_LABEL_DAGRE,
    defaultConfig: GRAPH_LAYOUT_DAGRE_DIR.DEFAULT_CONFIG
  },
  {
    key: GRAPH_LAYOUT.TREE,
    border: { position: 'Top' },
    title: intl.get('exploreGraph.layout.compactBoxLayout'),
    icon: <IconFont type="icon-shuzhuangbuju" style={{ fontSize: 14 }} />,
    menus: ICON_AND_LABEL_TREE,
    defaultConfig: GRAPH_LAYOUT_TREE_DIR.DEFAULT_CONFIG
  }
];

const LAYOUT_PATTERN = {
  [GRAPH_LAYOUT_PATTERN.COMMON]: [GRAPH_LAYOUT.FREE, GRAPH_LAYOUT.DAGRE, GRAPH_LAYOUT.FORCE],
  [GRAPH_LAYOUT_PATTERN.TREE]: [GRAPH_LAYOUT.TREE]
};

type SimpleLayoutType = {
  selectedItem: any;
  onChangeData: (data: any) => void;
  onCloseLeftDrawer: () => void;
};

const SimpleLayout = (props: SimpleLayoutType) => {
  const isFaker = props.selectedItem?.faker;
  const { selectedItem, onChangeData, onCloseLeftDrawer } = props;
  const graphLayoutPattern = selectedItem.graphLayoutPattern;

  const [selectedLayout, setSelectedLayout] = useState<any>(null);
  const [layouts, setLayouts] = useState(LAYOUT_LIST);
  useEffect(() => {
    if (!graphLayoutPattern) return;
    const filterDeps = LAYOUT_PATTERN[graphLayoutPattern];
    const newLayouts = _.filter(LAYOUT_LIST, item => _.includes(filterDeps, item.key));
    setLayouts(newLayouts);
  }, [graphLayoutPattern]);

  /** 清除选中 */
  const onCleanSelected = () => setSelectedLayout(null);
  /** 切换选中 */
  const onSelectDropdown = (data: any) => () => {
    if (!data) onCloseLeftDrawer();
    setSelectedLayout(data);
  };

  // 下拉菜单关闭时取消选中
  const onVisibleChange = (visible: boolean) => {
    if (!visible) onCleanSelected();
  };

  const toLayout = ({ layoutKey, newConfig }: any) => {
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
          onChangeData({ type: 'layoutConfig', data: { ...newConfig, key: layoutKey, isHaveChanged: true } });
        }
      });
    } else {
      onChangeData({ type: 'layoutConfig', data: { ...newConfig, key: layoutKey, isHaveChanged: true } });
    }
  };

  const onSelectFree = (key: string) => {
    const newConfig = selectedItem?.layoutConfig || {};
    if (selectedItem?.layoutConfig?.key === key) return;
    toLayout({ newConfig, layoutKey: key });
  };

  const [newConfig, setNewConfig] = useState({});
  const [preTreeModal, setPreTreeModal] = useState(false);
  const onOpenPreTreeModal = () => setPreTreeModal(true);
  const onClosePreTreeModal = () => setPreTreeModal(false);
  const onSelectTree = (source: any) => {
    onChangeData({ type: 'graphData', data: source });
    onChangeData({ type: 'layoutConfig', data: { ...newConfig, key: GRAPH_LAYOUT.TREE, isHaveChanged: true } });
    onClosePreTreeModal();
  };

  const onClickMenu = (item: any) => {
    if (isFaker) return;
    const value = item.key;
    onCleanSelected();
    onCloseLeftDrawer();

    const layoutKey = selectedLayout.key;
    const itemConfig = selectedItem?.layoutConfig?.[layoutKey] || selectedLayout.defaultConfig;
    const newConfig = selectedItem?.layoutConfig || {};
    newConfig[layoutKey] = { ...itemConfig, direction: value };
    setNewConfig(newConfig);

    const mustSelectTreeRoot =
      selectedItem.graph.current?.getNodes()?.length > 0 &&
      layoutKey === GRAPH_LAYOUT.TREE &&
      selectedItem?.layoutConfig?.key !== GRAPH_LAYOUT.TREE;
    if (mustSelectTreeRoot) {
      onOpenPreTreeModal();
    } else {
      if (selectedItem?.layoutConfig?.key !== layoutKey) {
        toLayout({ layoutKey, newConfig });
      }
      onChangeData({ type: 'layoutConfig', data: { ...newConfig, key: layoutKey, isHaveChanged: true } });
    }
  };

  // 渲染下拉菜单
  const renderMenus = (item: any) => {
    const { key, title, menus } = item;
    const selectedKeys =
      key === selectedItem?.layoutConfig?.key ? [selectedItem?.layoutConfig?.default?.direction] : [];
    return (
      <Menu className="simpleLayoutDropdownMenus" selectedKeys={selectedKeys} onClick={onClickMenu}>
        <Menu.Item key="" className="menusTitle">
          {title}
        </Menu.Item>
        {_.map(_.values(menus), item => {
          const { key, label, icon } = item;
          return (
            <Menu.Item key={key} style={{ height: 40, padding: '0px 12px' }}>
              <span className="kw-mr-2">{icon}</span>
              <span className="menuLabel">{label}</span>
            </Menu.Item>
          );
        })}
      </Menu>
    );
  };

  return (
    <div className="simpleLayoutChangeRoot">
      {_.map(layouts, (item, index: number) => {
        const { key, icon, title, menus, border } = item;
        const iconBoxSelected = key === selectedItem?.layoutConfig?.key;
        const borderStyle =
          border && index !== 0 ? { [`border${[border?.position]}`]: '2px dashed var(--kw-line-color)' } : {};
        if (menus) {
          return (
            <Dropdown
              key={key}
              className="kw-border kw-space-between"
              trigger={['click']}
              placement="bottomLeft"
              overlay={renderMenus(item)}
              onVisibleChange={onVisibleChange}
            >
              <div
                key={key}
                className={classnames('layoutIcon triangularSubscript', { selected: selectedLayout === key })}
                style={borderStyle}
                onClick={onSelectDropdown(item)}
              >
                <Tooltip title={title} placement="left" trigger={['hover', 'click']}>
                  <Button
                    className={classnames('iconBox', { iconBoxSelected })}
                    disabled={selectedItem.graph?.current?.__isLoading}
                  >
                    {icon}
                  </Button>
                </Tooltip>
              </div>
            </Dropdown>
          );
        }
        return (
          <div
            key={key}
            className="layoutIcon"
            style={borderStyle}
            onClick={() => {
              if (isFaker) return;
              onSelectFree(key);
              onSelectDropdown(null)();
            }}
          >
            <Tooltip title={title} placement="left" trigger={['hover', 'click']}>
              <Button
                className={classnames('iconBox', { iconBoxSelected })}
                disabled={selectedItem.graph?.current?.__isLoading}
              >
                {icon}
              </Button>
            </Tooltip>
          </div>
        );
      })}
      {preTreeModal && (
        <PreTreeModal
          config={newConfig}
          selectedItem={selectedItem}
          onOk={onSelectTree}
          onCancel={onClosePreTreeModal}
        />
      )}
    </div>
  );
};

export default SimpleLayout;
