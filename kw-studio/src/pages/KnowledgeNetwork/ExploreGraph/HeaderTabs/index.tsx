import React, { useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Tabs, Modal, Tooltip, message } from 'antd';
import { ExclamationCircleFilled, PlusOutlined } from '@ant-design/icons';

import { PERMISSION_KEYS, GRAPH_CONFIG, GRAPH_LAYOUT, GRAPH_LAYOUT_DAGRE_DIR } from '@/enums';
import { getParam } from '@/utils/handleFunction';
import servicesPermission from '@/services/rbacPermission';
import TabsPane from './TabsPane';
import CreateModal from './CreateModal';

import './style.less';
import IconFont from '@/components/IconFont';

type HeaderTabsType = {
  selectedItem: any;
  activeKey: string;
  graphItems: any;
  leftDrawerKey: string;
  onChangeData: (item: { type: string; data: any }) => void;
  onOpenLeftDrawer: (key: string) => void;
  onCloseLeftDrawer: () => void;
  onOpenRightDrawer: (key: string) => void;
  onCloseRightDrawer: () => void;
  onOpenSaveModal: (data: { targetKey?: string; callBack?: any; isSkipPopup?: boolean }) => void;
  onChangeActive: (key: string) => void;
  onChangeHasUnsaved: (hasUnsaved: boolean) => void;
  onChangeGraphItems: (data: any) => void;
  clearHistory: () => void;
};
const HeaderTabs = (props: HeaderTabsType) => {
  const history = useHistory();
  const { selectedItem, activeKey, graphItems, leftDrawerKey } = props;
  const {
    onChangeData,
    onOpenLeftDrawer,
    onCloseLeftDrawer,
    onOpenRightDrawer,
    onCloseRightDrawer,
    onOpenSaveModal,
    onChangeActive,
    onChangeHasUnsaved,
    onChangeGraphItems,
    clearHistory
  } = props;
  const newTabIndex = useRef(1);

  const [modalPosition, setModalPosition] = useState<any>(null);

  const onChange = (key: string) => {
    onChangeActive(key);
    onCloseLeftDrawer();
  };

  const onOpenCreateModal = (position: any) => setModalPosition(position);
  const onCloseCreateModal = () => setModalPosition(null);

  // 其他地方触发打开新t画布
  useEffect(() => {
    if (!selectedItem?.newCanvas) return;
    if (graphItems?.length === 10) {
      return message.warning(intl.get('exploreGraph.canvasNumberTip'));
    }
    const { leftDrawerKey, kgInfo, ...other } = selectedItem.newCanvas;
    selectedItem.newCanvas = null; // 直接置空, 不触发更新
    const index = String(newTabIndex.current++);
    const title = `${intl.get('exploreGraph.unnamed')}${index}`;
    const newPanes = [...graphItems];
    newPanes.push({
      key: index,
      title,
      graph: null,
      source: null,
      isHaveChanged: true,
      newTabData: { type: 'add', ...kgInfo },
      legend: { hasLegend: true },
      graphConfig: GRAPH_CONFIG.DEFAULT,
      layoutConfig: {
        key: GRAPH_LAYOUT.DAGRE,
        default: GRAPH_LAYOUT_DAGRE_DIR.DEFAULT_CONFIG,
        [GRAPH_LAYOUT.DAGRE]: GRAPH_LAYOUT_DAGRE_DIR.DEFAULT_CONFIG
      },
      ...other
    });
    onChangeActive(index);
    onChangeGraphItems(newPanes);
    setTimeout(() => {
      leftDrawerKey && onOpenLeftDrawer(leftDrawerKey);
    }, 0);
  }, [selectedItem?.newCanvas]);

  const add = (e: any) => {
    const addButton = document.querySelector('.tabsAddIcon');
    const clientRect: any = addButton?.getBoundingClientRect() || {};
    const x = clientRect?.x || 0;
    const y = clientRect?.y || 0;
    onOpenCreateModal({ top: y + 38, left: x });
  };
  const onOk = async (openInfo: any) => {
    onCloseCreateModal();
    if (graphItems?.length === 10) {
      return message.warning(intl.get('exploreGraph.canvasNumberTip'));
    }

    const index = String(newTabIndex.current++);
    const title = `${intl.get('exploreGraph.unnamed')}${index}`;
    const newPanes = [...graphItems];
    if (openInfo?.type === 'open') {
      newPanes.push({
        key: index,
        title,
        graph: null,
        source: null,
        newTabData: { type: 'open', c_id: openInfo?.c_id }
      });
    }
    if (openInfo?.type === 'add') {
      newPanes.push({
        key: index,
        title,
        graph: null,
        source: null,
        isHaveChanged: true,
        newTabData: { type: 'add', kg_id: openInfo?.kg_id, kg_name: openInfo?.kg_name },
        legend: { hasLegend: true },
        graphConfig: GRAPH_CONFIG.DEFAULT,
        layoutConfig: {
          key: GRAPH_LAYOUT.DAGRE,
          default: GRAPH_LAYOUT_DAGRE_DIR.DEFAULT_CONFIG,
          [GRAPH_LAYOUT.DAGRE]: GRAPH_LAYOUT_DAGRE_DIR.DEFAULT_CONFIG
        }
      });
    }
    onChangeActive(index);
    onChangeGraphItems(newPanes);
  };

  const onBackPageAnalysis = () => {
    onChangeHasUnsaved(false); // 退出前，把拦截逻辑去除
    clearHistory(); // 退出清掉redux
    history.goBack();

    // const knId = getParam('knId');
    // history.replace(`/knowledge/studio-network?id=${knId}&tab=canvas`);
  };

  const remove = (targetKey: any) => {
    const operationalTab = _.filter(graphItems, item => item.key === targetKey)?.[0] || {};
    if (operationalTab?.isHaveChanged) {
      const modalConfirm = Modal.confirm({
        closable: true,
        zIndex: 1052,
        title: intl.get('exploreGraph.exit'),
        icon: <ExclamationCircleFilled style={{ color: 'red' }} />,
        content: intl.get('exploreGraph.exitContent'),
        okText: intl.get('exploreGraph.saveClose'),
        cancelText: intl.get('exploreGraph.abandon'),
        onOk: () =>
          onOpenSaveModal({
            targetKey,
            callBack: graphItems?.length === 1 ? onBackPageAnalysis : () => removeTab(targetKey)
          }),
        onCancel: (e: any) => {
          if (!e.triggerCancel) {
            onChangeHasUnsaved(false);
            graphItems?.length === 1 ? onBackPageAnalysis() : removeTab(targetKey);
            modalConfirm.destroy();
          }
        }
      });
    } else {
      if (graphItems?.length === 1) {
        onBackPageAnalysis();
      } else {
        removeTab(targetKey);
      }
    }
  };
  const removeTab = (targetKey: any) => {
    let lastIndex = -1;
    let newActiveKey = activeKey;
    _.forEach(graphItems, (item: any, i: number) => {
      if (item.key === targetKey) lastIndex = i - 1;
    });
    const newPanes = _.filter(graphItems, (item: any) => item.key !== targetKey);
    if (newPanes.length && newActiveKey === targetKey) {
      if (lastIndex >= 0) {
        newActiveKey = newPanes[lastIndex].key;
      } else {
        newActiveKey = newPanes[0].key;
      }
    }
    onChangeActive(newActiveKey);
    onChangeGraphItems(newPanes);
  };

  const onEdit = async (targetKey: any, action: 'add' | 'remove') => {
    if (action === 'add') {
      // DATA-354277 dataPermission 入参dataIds kg_conf_id -> id
      const postData = { dataType: PERMISSION_KEYS.TYPE_KG, dataIds: [String(getParam('graphConfId'))] };
      // const result = await servicesPermission.dataPermission(postData);
      // const codes = result?.res?.[0]?.codes || [];
      // if (!_.includes(codes, PERMISSION_KEYS.KG_VIEW)) {
      //   Modal.warning({
      //     title: intl.get('exploreAnalysis.notHaveKGAuthor'),
      //     onOk: () => history.goBack()
      //   });
      //   return;
      // }
      add(targetKey);
    }
    if (action === 'remove') remove(targetKey);
  };

  return (
    <div className="headerTabsRoot">
      <TabsPane
        selectedItem={graphItems[0]}
        newTabData={graphItems[0].newTabData}
        leftDrawerKey={leftDrawerKey}
        onChangeData={onChangeData}
        onOpenLeftDrawer={onOpenLeftDrawer}
        onCloseLeftDrawer={onCloseLeftDrawer}
        onOpenRightDrawer={onOpenRightDrawer}
        onCloseRightDrawer={onCloseRightDrawer}
        onOpenSaveModal={onOpenSaveModal}
        onChangeGraphItems={onChangeGraphItems}
      />
      {/* <Tabs*/}
      {/*  type="editable-card"*/}
      {/*  activeKey={activeKey}*/}
      {/*  onEdit={onEdit}*/}
      {/*  onChange={onChange}*/}
      {/*  addIcon={*/}
      {/*    <Tooltip title={intl.get('exploreGraph.add')} placement="bottom">*/}
      {/*      <span className="tabsAddIcon">*/}
      {/*        <PlusOutlined />*/}
      {/*      </span>*/}
      {/*    </Tooltip>*/}
      {/*  }*/}
      {/* >*/}
      {/*  {_.map(graphItems, (item, index: number) => {*/}
      {/*    const { key, title, newTabData } = item;*/}
      {/*    return (*/}
      {/*      <Tabs.TabPane*/}
      {/*        key={key}*/}
      {/*        tab={*/}
      {/*          <div title={title}>*/}
      {/*            <IconFont type="icon-shujutansuo" className="kw-c-primary kw-mr-3" />*/}
      {/*            {title}*/}
      {/*          </div>*/}
      {/*        }*/}
      {/*      >*/}
      {/*        <TabsPane*/}
      {/*          selectedItem={item}*/}
      {/*          newTabData={newTabData}*/}
      {/*          leftDrawerKey={leftDrawerKey}*/}
      {/*          onChangeData={onChangeData}*/}
      {/*          onOpenLeftDrawer={onOpenLeftDrawer}*/}
      {/*          onCloseLeftDrawer={onCloseLeftDrawer}*/}
      {/*          onOpenRightDrawer={onOpenRightDrawer}*/}
      {/*          onCloseRightDrawer={onCloseRightDrawer}*/}
      {/*          onOpenSaveModal={onOpenSaveModal}*/}
      {/*          onChangeGraphItems={onChangeGraphItems}*/}
      {/*        />*/}
      {/*      </Tabs.TabPane>*/}
      {/*    );*/}
      {/*  })}*/}
      {/* </Tabs>*/}
      {modalPosition?.top && (
        <CreateModal graphItems={graphItems} modalPosition={modalPosition} onOk={onOk} onCancel={onCloseCreateModal} />
      )}
    </div>
  );
};

export default HeaderTabs;
