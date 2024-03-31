import React, { useState } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Tabs } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

import HELPER from '@/utils/helper';
import { GRAPH_LAYOUT } from '@/enums';
import { LeftDrawer } from '../components';
import DisplayModal, { getDefaultConfig } from '../../components/DisplayModal';

import DisplayStyle from './DisplayStyle';
import DisplayItems from './DisplayItems';
import DisplayMore from './DisplayMore';

import './style.less';

export type DisplayType = {
  selectedItem: any;
  isLayoutTree: string;
  onChangeData: (data: { type: string; data: any }) => void;
  onCloseLeftDrawer: () => void;
  style?: any;
  className?: string;
};

const getLabelValues = (labels?: any[], limit?: number) => {
  if (!labels) return '';
  const checkedLabel = _.filter(labels, l => l?.isChecked);
  return _.map(checkedLabel, l => HELPER.stringEllipsis(l.value, limit || 15))?.join('\n');
};

const Display = (props: DisplayType) => {
  const { className, selectedItem, style = {} } = props;
  const { onChangeData, onCloseLeftDrawer } = props;
  const operations = <CloseOutlined onClick={onCloseLeftDrawer} />;
  const isLayoutTreeGroup = selectedItem?.layoutConfig?.default?.isGroup;

  const [modalType, setModalType] = useState('node');
  const [updateData, setUpdateData] = useState<any>({});
  const [batchClass, setBatchClass] = useState<any>([]);
  const onOpenDisplayModal = (_type: string) => (data: any) => {
    setModalType(_type);
    setUpdateData(data);
  };
  const onOpenDisplayFromBatch = (_type: string) => (keys: any) => {
    setModalType(_type);
    setUpdateData(selectedItem?.graphStyle?.[_type]?.[keys[0]]);
    setBatchClass(keys);
  };
  const onCloseDisplayModal = () => {
    setUpdateData({});
    setBatchClass([]);
  };

  // 是否显示弹窗
  const isVisibleDisplayModal = !_.isEmpty(updateData) || !_.isEmpty(batchClass);
  const onUpdateStyle = (data: any, changeData?: any) => {
    const newStyle = selectedItem.graphStyle || {};
    if (!newStyle?.[modalType]?.[data._class]) return;
    if (_.isEmpty(batchClass)) {
      newStyle[modalType][data._class] = data;
    } else {
      _.forEach(batchClass, key => {
        newStyle[modalType][key] = {
          ...newStyle[modalType][key],
          ...changeData
        };
      });
    }

    onChangeData({ type: 'graphStyle', data: { ...newStyle, notUpdate: true } });

    // 在树图情况下修改边类
    if (modalType === 'edge' && isLayoutTreeGroup) {
      const graphData = _.cloneDeep(selectedItem?.graphData);
      const { showLabels, strokeColor } = changeData;

      const tempUpdate: any = {};
      const showLabelsVK: any = {};
      if (showLabels) {
        _.forEach(showLabels, item => {
          showLabelsVK[item?.key] = item;
        });
      }

      _.forEach(graphData?.edges, (item: any) => {
        if (_.isEmpty(batchClass) && item.class !== data._class) return;
        if (!_.isEmpty(batchClass) && !_.includes(batchClass, item.class)) return;

        if (strokeColor) {
          item.color = strokeColor;
          item.strokeColor = strokeColor;
          tempUpdate.strokeColor = strokeColor;
        }
        if (showLabels) {
          item.showLabels = _.map(item?.showLabels || [], item => {
            if (showLabelsVK?.[item?.key]) item.isChecked = showLabelsVK[item?.key]?.isChecked;
            return item;
          });
          tempUpdate.label = getLabelValues(item.showLabels, 15);
        }
      });

      onChangeData({ type: 'graphData', data: graphData });
    }
  };

  return (
    <LeftDrawer
      className={classnames('displayRoot', className)}
      style={style}
      title={''}
      onCloseLeftDrawer={onCloseLeftDrawer}
    >
      <Tabs tabBarExtraContent={operations}>
        <Tabs.TabPane tab={intl.get('exploreGraph.style.style')} key="style">
          <DisplayStyle selectedItem={selectedItem} onChangeData={onChangeData} />
        </Tabs.TabPane>
        <Tabs.TabPane tab={intl.get('exploreGraph.style.entityClass')} key="node">
          <DisplayItems
            modalType="node"
            selectedItem={selectedItem}
            classData={selectedItem?.graphStyle || {}}
            isVisibleDisplayModal={isVisibleDisplayModal}
            onOpenDisplayModal={onOpenDisplayModal('node')}
            onOpenDisplayFromBatch={onOpenDisplayFromBatch('node')}
            onChangeData={onChangeData}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab={intl.get('exploreGraph.style.relationshipClass')} key="edge">
          <DisplayItems
            modalType="edge"
            selectedItem={selectedItem}
            isLayoutTreeGroup={isLayoutTreeGroup}
            classData={selectedItem?.graphStyle || {}}
            isVisibleDisplayModal={isVisibleDisplayModal}
            onOpenDisplayModal={onOpenDisplayModal('edge')}
            onOpenDisplayFromBatch={onOpenDisplayFromBatch('edge')}
            onChangeData={onChangeData}
          />
        </Tabs.TabPane>
        {selectedItem?.layoutConfig?.key === GRAPH_LAYOUT.TREE && (
          <Tabs.TabPane tab={intl.get('exploreGraph.style.more')} key="more">
            <DisplayMore
              selectedItem={selectedItem}
              onChangeData={onChangeData}
              onOpenDisplayModal={onOpenDisplayModal('more')}
            />
          </Tabs.TabPane>
        )}
      </Tabs>
      {isVisibleDisplayModal && (
        <DisplayModal
          config={getDefaultConfig({ scope: { visible: false } })}
          modalType={modalType}
          batchClass={batchClass}
          graphStyle={selectedItem.graphStyle}
          updateData={selectedItem.graphStyle?.[modalType]?.[updateData?._class] || updateData}
          layoutType={selectedItem?.layoutConfig?.key}
          onCancel={onCloseDisplayModal}
          onChangeData={onChangeData}
          onUpdateStyle={onUpdateStyle}
        />
      )}
    </LeftDrawer>
  );
};

export default (props: any) => {
  const { isVisible, ...other } = props;
  if (!isVisible) return null;
  return <Display {...other} />;
};
