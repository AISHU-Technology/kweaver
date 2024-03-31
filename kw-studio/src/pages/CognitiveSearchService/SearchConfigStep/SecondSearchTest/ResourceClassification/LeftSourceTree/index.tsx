import React, { useState, forwardRef, useEffect, useImperativeHandle } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import { Tooltip } from 'antd';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import TreeAdjust from '@/components/TreeAdjust';

import CreateClassifyModal from './CreateClassifyModal';
import { onDeleteClassify, onHandleTree } from '../assistFunction';
import './style.less';

const LeftSourceTree = (props: any, ref: any) => {
  const { testData, setTestData, onChangeTable, selectMes, setSelectMes, authData, onNotUpdate } = props;
  const [isModal, setIsModal] = useState(false);
  const [operateType, setOperateType] = useState(''); // 编辑 | 新建
  const [editMes, setEditMes] = useState<any>({}); // 编辑时传入的信息
  const [treeData, setTreeData] = useState<any>([]); // 左侧树-数据

  useImperativeHandle(ref, () => ({ onAddEdit }));

  useEffect(() => {
    const fullText = _.cloneDeep(testData?.props?.full_text?.search_config);
    const filterAll = _.filter(fullText, (item: any) => item?.class_name !== '全部资源');

    const updateTreeData = _.map(filterAll, (item: any) => onHandleTree(item, authData));
    setTreeData(updateTreeData);
  }, [testData?.props?.full_text?.search_config, authData]);

  /**
   * 全部资源
   */
  const onAllSource = () => {
    setSelectMes('');
  };

  /**
   * 树 位置调换伴随保存的各分类位置改变
   */
  const onChangePosition = (data: any) => {
    const newTestFull: any = [];
    const cloneData = _.cloneDeep(testData.props.full_text.search_config);
    const allSource = _.filter(cloneData, (item: any) => item?.class_name === '全部资源');
    _.map(data, (item: any) => {
      _.map(cloneData, (i: any) => {
        if (item.key === i.class_name) {
          newTestFull.push({ class_name: i.class_name, kgs: i.kgs, class_id: i?.class_id });
        }
      });
    });
    testData.props.full_text.search_config = [...allSource, ...newTestFull];
    setTestData(testData);
    setTreeData(data);
  };

  /**
   * 删除
   */
  const onDelete = (node: any) => {
    const handleDelete = onDeleteClassify(testData, node);
    const searchConfig = _.cloneDeep(handleDelete?.props?.full_text?.search_config);
    // 更新选中的分类(默认指向下一个)
    const selectName = _.isEmpty(searchConfig) ? '' : searchConfig?.[0]?.class_name;
    setTestData(handleDelete);

    onChangeTable({ page: 1 }, handleDelete, selectName);
    const filterAll = _.filter(searchConfig, (item: any) => item?.class_name !== '全部资源');
    const sortData = _.map(filterAll, (item: any) => onHandleTree(item, authData?.data));
    setTreeData(sortData);
    setSelectMes(selectName);
  };

  /**
   * 编辑分类
   */
  const onAddEdit = (type: string, name?: string, id?: any) => {
    if (type === 'edit') {
      // 分类下的名称、资源信息
      const allResources: any = [];
      _.map(testData?.props?.full_text?.search_config, (item: any) => {
        if (name === item.class_name) {
          _.map(item?.kgs, (i: any) => {
            allResources.push(i.kg_name);
          });
        }
      });
      const handleEdit = { classify: name, resource: allResources, id };
      setEditMes(handleEdit);
    }
    onNotUpdate();
    setIsModal(true);
    setOperateType(type);
  };

  /**
   * 取消弹窗
   */
  const onHandleCancel = () => {
    setIsModal(false);
    setOperateType('');
  };

  /**
   * 分类选择
   */
  const onClassifySelect = (name: string) => {
    setSelectMes(name);
  };

  return (
    <div className="file-right-source-tree-wrap">
      <div className="file-tree">
        <Format.Title className="kw-pl-5 kw-pr-5">
          {intl.get('cognitiveSearch.full.categoryList')}
          <Tooltip
            title={intl.get('cognitiveSearch.full.fullTextTip')}
            placement="leftTop"
            className="kw-ml-2 icon-why"
          >
            <IconFont type="icon-wenhao" />
          </Tooltip>
        </Format.Title>
        {/* 添加分类 */}
        <div className="kw-pl-5 kw-pr-5">
          <div className="add-classification kw-center kw-mt-5 kw-pointer" onClick={() => onAddEdit('create')}>
            <IconFont type="icon-Add" className="kw-mr-2" />
            {intl.get('cognitiveSearch.classify.addCategory')}
          </div>
        </div>
        {/* 资源 */}
        <div className="kw-mt-8 source-left">
          <div className="source-height">
            <div
              className={classNames('kw-flex source-file kw-pointer', { 'color-title': !selectMes })}
              onClick={onAllSource}
            >
              <IconFont className="kw-mr-2" type="icon-putongwenjianjia" style={{ fontSize: '16px' }} />
              {intl.get('cognitiveSearch.classify.allResource')}
            </div>
            <TreeAdjust
              treeData={treeData}
              selectMes={selectMes}
              onDelete={onDelete}
              onChangePosition={onChangePosition}
              onAddEdit={onAddEdit}
              onClassifySelect={onClassifySelect}
            />
          </div>
        </div>
      </div>
      <CreateClassifyModal
        visible={isModal}
        authData={authData}
        editMes={editMes}
        testData={testData}
        setTestData={setTestData}
        onHandleCancel={onHandleCancel}
        operateType={operateType}
        setTreeData={setTreeData}
        setSelectMes={setSelectMes}
        onChangeTable={onChangeTable}
        onNotUpdate={onNotUpdate}
      />
    </div>
  );
};

export default forwardRef(LeftSourceTree);
