import React, { useState, useEffect } from 'react';

import { message, Form, Select, Tree } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import { DownOutlined } from '@ant-design/icons';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';

import UniversalModal from '@/components/UniversalModal';
import { getParam } from '@/utils/handleFunction';
import NoDataBox from '@/components/NoDataBox';

import serverKnowledgeNetwork from '@/services/knowledgeNetwork';
import cognitiveSearchService from '@/services/cognitiveSearch';
import serviceGraphDetail from '@/services/graphDetail';

import { onHandleTableFormat, onSelectAndTableFormat, onDefaultData } from './assistFunction';

import './style.less';

const CreateModal = (props: any) => {
  const { visible, setVisible, onChangeTableData, setTableData, tableData, mode, setIsChange } = props;
  const [sourceName, setSourceName] = useState(''); // 资源名称
  const [graphList, setGraphList] = useState<any>([]); // 历史任务成功的图谱
  const [configEntity, setConfigEntity] = useState<any>({}); // 配置实体类信息
  const [treeData, setTreeData] = useState<any>([]);
  const [checkedTreeKeys, setCheckedTreeKeys] = useState<any>([]);
  const [graphName, setGraphName] = useState(''); // 选择的图谱名
  const [checkedKeys, setCheckedKeys] = useState<any>([]);
  const [checkedKeysEdit, setCheckedKeysEdit] = useState<any>([]); // 编辑进入后默认选中的值

  useEffect(() => {
    getConfigGraph();
  }, []);

  useEffect(() => {
    if (visible) {
      getConfigGraph();
    }
  }, [visible]);

  /**
   * 获取有效图谱
   */
  const getConfigGraph = async () => {
    const { knw_id } = getParam(['knw_id']);
    const data = { page: 1, name: '', order: 'desc', size: 10000, rule: 'create', knw_id, filter: 'running_success' };
    const { res } = (await serverKnowledgeNetwork.graphGetByKnw(data)) || {};
    // 历史任务成功、图谱可使用
    setGraphList(res?.df);
  };

  /**
   * 下拉框：历史任务成功、图谱可使用
   */
  const OPTION = _.map(graphList, (item: any) => ({ value: item?.name, label: item?.name, key: item?.id }));

  /**
   * 资源
   */
  const onSelectionchange = (value: string, e: any) => {
    setCheckedTreeKeys([]);
    setSourceName(e?.key);
    getGraphBasicData(e?.key);
    const cloneData = _.cloneDeep(graphList);
    const selectGraph = _.filter(cloneData, (item: any) => item?.id === e?.key);
    const graphName = selectGraph?.[0]?.name;
    setGraphName(graphName);
  };

  /**
   * 获取图谱信息
   */
  const getGraphBasicData = async (graphId: string) => {
    try {
      const { res } = await serviceGraphDetail.graphGetInfoOnto({ graph_id: graphId });
      const data = res?.entity || {};
      if (data) {
        setConfigEntity(data);
        onUsedPropDisabled(data, graphId);
      }
    } catch (error) {
      const { type, response } = error;
      if (type === 'message') {
        message.error(response?.Description || '');
      }
    }
  };

  /**
   * 复选框禁止使用过的实体类的属性
   */
  const onUsedPropDisabled = (data: any, graphId: any) => {
    const result = onCurrentGraphProp(graphId);
    if (_.isEmpty(result)) {
      onDataToTree(data);
    } else {
      const cloneData = _.cloneDeep(data);
      const graphChecked = _.map(cloneData, (item: any) => {
        // 被使用的实体类属性名
        const allPropName = result[item.name];
        if (allPropName) {
          if (item.properties?.length === allPropName?.length) {
            item.checked = true;
          } else {
            item.checked = false;
          }
          item.properties = _.map(item?.properties, (i: any) => {
            if (allPropName.includes(i?.name)) {
              i.checked = true;
              return i;
            }
            i.checked = false;
            return i;
          });
          return item;
        }
        return item;
      });
      onDataToTree(graphChecked);
    }
  };

  /**
   * 当前知识图谱下已被使用的实体类属性
   */
  const onCurrentGraphProp = (graphId: any) => {
    const cloneData = _.cloneDeep(tableData);
    const filterData = _.filter(cloneData, (item: any) => item.graph_id === graphId);
    if (_.isEmpty(filterData)) return {};
    const result = _.reduce(
      filterData,
      (pre: any, key: any) => {
        pre[key.entity_name] = key.props;
        return pre;
      },
      {}
    );
    return result;
  };

  /**
   * 更新并显示树形控件的数据
   */
  const onDataToTree = (data: any) => {
    const treeData = _.map(data, (item: any, index: number) => onTreeFormat(item, index));
    let handleCheckedData: any = [];
    _.map(_.cloneDeep(treeData), (item: any) => {
      if (item?.disabled) {
        handleCheckedData = [...handleCheckedData, item.key];
      }
      _.map(item?.children, (i: any) => {
        if (i?.disabled) {
          handleCheckedData = [...handleCheckedData, i.key];
        }
      });
    });
    setCheckedKeys(handleCheckedData);
    setCheckedKeysEdit(handleCheckedData);
    setTreeData(treeData);
  };

  /**
   * 变成树形控件需要的数据格式
   */
  const onTreeFormat = (value: any, index: number) => {
    const { name, alias, properties, color, checked = false } = value;
    return {
      title: name,
      key: name,
      name: alias,
      color,
      disabled: checked,
      children: _.map(properties, (item: any, i: number) => ({
        title: item?.name,
        name: item?.alias,
        key: `${item?.name}|${name}`,
        disabled: item?.checked
      }))
    };
  };

  /**
   * 渲染标题
   */
  const titleRender = (node: any) => {
    const { color, name, title, disabled } = node;
    return (
      <div className="kw-flex tree-title-box" title={`${title}  ${name}`}>
        {color ? <div className="entity-circle kw-mr-2" style={{ background: color }}></div> : null}
        <div className="kw-ellipsis tree-title-text" title={title}>
          {title}
        </div>
        <div
          title={name}
          className={classNames('kw-ml-2 kw-ellipsis tree-title-text', disabled ? 'kw-c-watermark' : 'kw-c-subtext')}
        >
          {name}
        </div>
      </div>
    );
  };

  /**
   * 多选框选择
   */
  const onCheck = (checkedKey: any, e: any) => {
    const checkedAllKeys: any = [];
    _.map(_.cloneDeep(e?.checkedNodes), (item: any) => {
      if (!item?.disabled) {
        checkedAllKeys.push(item?.key);
      }
    });
    setCheckedTreeKeys(checkedAllKeys);
    setCheckedKeys([...checkedKeysEdit, ...checkedAllKeys]);
  };

  /**
   * 确定
   */
  const onHandleOk = () => {
    if (_.isEmpty(checkedTreeKeys)) {
      message.error(intl.get('ThesaurusManage.checked'));
      return;
    }
    const data = onHandleFormat();
    const setIdToTableData = _.map(data, (item: any, index: any) => {
      item.id = index;
      return item;
    });
    // 图谱名 实体类名还要做去除;
    setIsChange(true);
    onChangeTableData({ page: 1 }, setIdToTableData);
    onCancel();
  };

  /**
   * 处理选中数据的格式(整理成table使用的数据格式)
   */
  const onHandleFormat = () => {
    const reduceData = onDefaultData(configEntity, graphName, sourceName, mode, checkedTreeKeys);
    const { reduceValues, values } = onSelectAndTableFormat(
      _.cloneDeep(reduceData),
      checkedTreeKeys,
      tableData,
      mode,
      sourceName
    );
    const result = onHandleTableFormat(reduceValues, values);
    return result;
  };

  /**
   * 关闭弹窗
   */
  const onCancel = () => {
    setVisible(false);
    setSourceName('');
    setCheckedKeys([]);
    setCheckedKeysEdit([]);
    setCheckedTreeKeys([]);
  };

  return (
    <UniversalModal
      className="thesaurus-graph-mode-create-UniversalModal-root"
      title={intl.get('ThesaurusManage.add')}
      width={'640px'}
      visible={visible}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: onHandleOk }
      ]}
    >
      <div className="kw-mb-6">
        <div className="kw-mb-2 kw-c-header title">{intl.get('ThesaurusManage.createMode.resource')}</div>
        <Select
          className="select"
          listHeight={32 * 5}
          showSearch
          placeholder={intl.get('exploreAnalysis.inputOrSelect')}
          options={OPTION}
          onChange={onSelectionchange}
        />
      </div>

      <div className="kw-mb-2 kw-c-header title">{intl.get('ThesaurusManage.createMode.configurationEntity')}</div>
      <div className="disposition-box kw-p-4">
        {!sourceName ? (
          <NoDataBox
            style={{ marginTop: 35 }}
            imgSrc={require('@/assets/images/clickView.svg').default}
            desc={intl.get('ThesaurusManage.createMode.select')}
          />
        ) : (
          <Tree
            className="entity-tree"
            selectable={false}
            showLine
            switcherIcon={<DownOutlined />}
            checkable
            treeData={treeData}
            titleRender={titleRender}
            onCheck={onCheck}
            checkedKeys={checkedKeys}
          />
        )}
      </div>
    </UniversalModal>
  );
};

export default CreateModal;
