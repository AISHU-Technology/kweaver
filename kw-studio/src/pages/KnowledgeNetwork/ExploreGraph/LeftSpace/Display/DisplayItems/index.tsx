import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Input, Radio, Checkbox, Button } from 'antd';
import { SearchOutlined, SettingOutlined } from '@ant-design/icons';

import ContainerEmptyOrResult from './ContainerEmptyOrResult';

import './style.less';

const PLACEHOLDER: any = {
  node: 'exploreGraph.style.searchEntityPlaceholder',
  edge: 'exploreGraph.style.searchRelationshipPlaceholder'
};
const ADDED: any = { node: 'exploreGraph.style.inTheGraph', edge: 'exploreGraph.style.inTheGraph' };
const UN_ADDED: any = { node: 'exploreGraph.style.notInTheGraph', edge: 'exploreGraph.style.notInTheGraph' };

const DisplayItems = (props: any) => {
  const { classData, modalType, selectedItem, isLayoutTreeGroup, isVisibleDisplayModal } = props;
  const { onChangeData, onOpenDisplayModal, onOpenDisplayFromBatch } = props;

  const [items, setItems] = useState<any>([]);
  const [updateClass, setUpdateClass] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string[]>([]);
  const [filter, setFilter] = useState({ title: '', itemRange: 'existing' });

  useEffect(() => {
    getItems();
  }, [filter.title, filter.itemRange, JSON.stringify(classData), JSON.stringify(selectedItem?.graphData)]);
  useEffect(() => {
    if (!isVisibleDisplayModal) setUpdateClass('');
  }, [isVisibleDisplayModal]);

  const getCurrentGraphItems = () => {
    const itemsKV: any = [];
    let source = [];
    const targetData: any = classData?.[modalType] || {};
    const graphShapes = selectedItem?.apis?.getGraphShapes();
    if (modalType === 'node') source = graphShapes?.nodes || [];
    if (modalType === 'edge') source = graphShapes?.edges || [];
    if (modalType === 'edge' && isLayoutTreeGroup) source = graphShapes?.nodes || [];

    _.forEach(source, item => {
      const data = item.getModel()?._sourceData;
      if (data && targetData?.[data?.class]) {
        itemsKV[data?.class] = targetData?.[data?.class];
      }
    });

    return _.values(itemsKV) || [];
  };
  const getAllGraphItems = () => {
    const source = _.values(classData?.[modalType] || {}) || [];
    return source;
  };
  /** 获取 */
  const getItems = () => {
    const { title, itemRange } = filter;
    let newItems = [];
    if (itemRange === 'all') {
      newItems = getAllGraphItems();
    }
    if (itemRange === 'existing') {
      newItems = getCurrentGraphItems();
    }
    if (itemRange === 'nonexistent') {
      const currentItemsKey = _.map(getCurrentGraphItems(), item => item._class);
      const allItems = getAllGraphItems();
      newItems = _.filter(allItems, item => !_.includes(currentItemsKey, item._class));
    }
    if (title) {
      newItems = _.filter(newItems, item => {
        return _.includes(item._class.toLowerCase() + item.alias.toLowerCase(), title.toLowerCase());
      });
    }

    setItems(newItems);
  };

  const onChangeInput = (e: any) => {
    const value = e.target.value.trim();
    setSelectedClass([]);
    setFilter({ ...filter, title: value });
  };
  const onChangeRadio = (e: any) => {
    const value = e.target.value;
    setSelectedClass([]);
    setFilter({ title: '', itemRange: value });
  };

  /** 选中图谱中相同该类型节点 */
  const onClickLine = (_class: string) => () => {
    if (modalType === 'edge' && isLayoutTreeGroup) return;
    let targetSource = [];
    const graphShapes = selectedItem?.apis?.getGraphShapes();
    if (modalType === 'node') targetSource = graphShapes?.nodes || [];
    if (modalType === 'edge') targetSource = graphShapes?.edges || [];
    const checkedNodes = _.filter(targetSource, item => item?.getModel()?._sourceData?.class === _class);
    const updateData: { nodes: any[]; edges: any[] } = { nodes: [], edges: [] };
    if (modalType === 'node') updateData.nodes = checkedNodes;
    if (modalType === 'edge') updateData.edges = checkedNodes;
    onChangeData({ type: 'selected', data: updateData });
  };

  /** 多选框状态变更 */
  const onChangeCheck = (key: string) => (e: any) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedClass([...selectedClass, key]);
    } else {
      const newSelectedArr = _.filter(selectedClass, item => item !== key);
      setSelectedClass(newSelectedArr);
    }
  };
  /** 全选 */
  const onChangeAllCheck = (e: any) => {
    const checked = e.target.checked;
    if (checked) {
      const newSelectedArr = _.map(items, item => item._class);
      setSelectedClass(newSelectedArr);
    } else {
      setSelectedClass([]);
    }
  };

  const isAllChecked = items.length && selectedClass?.length === items?.length;
  const isIndeterminate = isAllChecked ? false : selectedClass?.length > 0;

  return (
    <div className="displayItemsRoot">
      <Input
        allowClear
        value={filter?.title}
        style={{ height: 32 }}
        placeholder={intl.get(PLACEHOLDER[modalType])}
        prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
        onChange={onChangeInput}
      />
      <Radio.Group className="kw-mt-4" size="small" value={filter?.itemRange} onChange={onChangeRadio}>
        <Radio value="all">{intl.get('exploreGraph.style.all')}</Radio>
        <Radio value="existing">{intl.get(ADDED[modalType])}</Radio>
        <Radio value="nonexistent">{intl.get(UN_ADDED[modalType])}</Radio>
      </Radio.Group>
      <div className="kw-mt-6 kw-border-t" style={{ height: 'calc(100% - 156px)', overflow: 'auto' }}>
        <ContainerEmptyOrResult hasResult={!_.isEmpty(items)} hasSearch={!!filter.title}>
          {_.map(items, item => {
            const { _class, alias, type, strokeColor = '#126ee3', fillColor = '#126ee3' } = item;
            if (!_class) return null;
            return (
              <div
                key={_class}
                className={classnames('itemLine kw-border-b', { itemLineSelected: _class === updateClass })}
              >
                <Checkbox
                  className="kw-mr-2"
                  checked={_.includes(selectedClass, _class)}
                  onChange={onChangeCheck(_class)}
                />
                <div className="lineText" onClick={onClickLine(_class)}>
                  <div className="signBox">
                    <div
                      className={classnames({
                        signEdge: modalType === 'edge',
                        signNode: modalType === 'node'
                      })}
                      style={{
                        backgroundColor: modalType === 'edge' ? strokeColor : fillColor
                      }}
                    />
                  </div>
                  <div className="kw-ellipsis">{alias}</div>
                </div>

                <SettingOutlined
                  className="lineIcon"
                  onClick={() => {
                    setUpdateClass(_class);
                    onOpenDisplayModal(item);
                  }}
                />
              </div>
            );
          })}
        </ContainerEmptyOrResult>
      </div>
      <div className="listFooter">
        <Checkbox
          checked={isAllChecked}
          disabled={!items?.length}
          indeterminate={isIndeterminate}
          onChange={onChangeAllCheck}
        >
          {intl.get('exploreGraph.style.allSelected')}
        </Checkbox>
        <Button
          disabled={!selectedClass?.length}
          onClick={() => {
            setUpdateClass('');
            onOpenDisplayFromBatch(selectedClass);
          }}
        >
          {intl.get('exploreGraph.style.bulkSetStyle')}
        </Button>
      </div>
    </div>
  );
};

export default DisplayItems;
