/**
 * antd组件中 Tree 可调整顺序
 */
import React, { useState, useEffect } from 'react';
import { Tree, Popover, Button, Popconfirm } from 'antd';
import { ExclamationCircleOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import _ from 'lodash';
import type { DataNode, TreeProps } from 'antd/es/tree';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import fileGraph from '@/assets/images/fileGraph.svg';

import './style.less';
import ExplainTip from '../ExplainTip';

type TreeAdjustType = {
  onClassifySelect: (name: string) => void; // 分类选择
  onDelete: (state: any) => void; // 删除
  treeData: any; // Tree数据
  selectMes: any; // 选择的分类名
  onChangePosition: (state: any) => void; // 位置变化后更新数据
  onAddEdit: (type: string, state?: string, id?: any) => void;
};

const TreeAdjust = (props: TreeAdjustType) => {
  const { onClassifySelect, onDelete, treeData, selectMes, onChangePosition, onAddEdit } = props;
  const [selectName, setSelectName] = useState('');

  useEffect(() => {
    onSelect('', { node: { key: selectMes } });
  }, [treeData, selectMes]);

  /**
   * 渲染标题
   */
  const titleRender = (node: any) => {
    const { name, id, isAuthError } = node;
    return (
      <div
        className={classNames('kw-flex title-tree', { 'color-title': name === selectName })}
        style={{ alignItems: 'center' }}
      >
        <IconFont type="icon-caozuoxinxi" className="kw-mr-3" style={{ opacity: '0.65' }} />
        <img src={fileGraph} alt="" className="file-icon" />
        <span className="title-name kw-ellipsis kw-mr-2" title={name}>
          {name}
        </span>
        {isAuthError && (
          <ExplainTip title={intl.get('global.graphNoPeromission')}>
            <ExclamationCircleOutlined className="kw-c-error kw-mr-2" />
          </ExplainTip>
        )}
        <IconFont
          type="icon-edit"
          className="delete-icon kw-mr-3"
          title={intl.get('cognitiveSearch.edit')}
          onClick={() => onAddEdit('edit', name, id)}
        />
        <Popconfirm
          placement="topRight"
          trigger="click"
          title={intl.get('cognitiveSearch.classify.deleteCategory')}
          okText={intl.get('cognitiveSearch.ok')}
          cancelText={intl.get('cognitiveSearch.cancel')}
          onCancel={(e: any) => {
            e.preventDefault();
          }}
          onConfirm={(e: any) => {
            // 点击会触发两次行点击事件，因此要阻止冒泡
            e.stopPropagation();
            onHandleOk(node);
          }}
        >
          <IconFont type="icon-lajitong" className="delete-icon" title={intl.get('cognitiveSearch.delete')} />
        </Popconfirm>
      </div>
    );
  };

  /**
   * 确认
   */
  const onHandleOk = (node: any) => {
    onDelete(node);
  };

  /**
   * 选择
   */
  const onSelect = (selectKeys: any, info: any) => {
    setSelectName(info?.node?.key);
    onClassifySelect(info?.node?.key);
  };

  /**
   * 位置变化
   */
  const onDrop: TreeProps['onDrop'] = (info: any) => {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const loop = (data: DataNode[], key: React.Key, callback: (node: DataNode, i: number, data: any) => void) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
          return callback(data[i], i, data);
        }
        if (data[i].children) {
          loop(data[i].children!, key, callback);
        }
      }
    };
    const data = [...treeData];

    // Find dragObject
    let dragObj: DataNode;
    loop(data, dragKey, (item, index, arr) => {
      arr.splice(index, 1);
      dragObj = item;
    });

    let ar: DataNode[] = [];
    let i: number;
    loop(data, dropKey, (_item, index, arr) => {
      ar = arr;
      i = index;
    });
    if (dropPosition === -1) {
      ar.splice(i!, 0, dragObj!);
    } else {
      ar.splice(i! + 1, 0, dragObj!);
    }
    onChangePosition(data);
    onSelect('', { node: { key: data[0].key } });
  };
  return (
    <div className="component-tree">
      <Tree
        draggable
        blockNode
        treeData={treeData}
        titleRender={titleRender}
        onDrop={onDrop}
        onSelect={onSelect}
        className="tree-file"
      />
    </div>
  );
};

export default TreeAdjust;
