import React, { useState, useEffect } from 'react';

import _ from 'lodash';
import intl from 'react-intl-universal';
import { Select, Form, Empty, message } from 'antd';

import HOOKS from '@/hooks';
import kongImg from '@/assets/images/kong.svg';
import { getParam } from '@/utils/handleFunction';

import servicesDataSource from '@/services/dataSource';

import DataSourceTree from './DataSourceTree';
import { DATA_SOURCE, NODE_TYPE, CONTENT_TYPE } from './enums';
import { SOURCE_IMG_MAP } from '../../AddDataFileModal/assistant';
import { createRootNode, updateTreeData, addParentheses } from './assistant';

import './style.less';

const { SHEET, MODE, FIELD, BASE } = NODE_TYPE;
const LeftSourceTree = (props: any) => {
  const {
    dataSourceOptions,
    prefixLocale,
    form,
    onAdd,
    editData,
    setSqlChangeTips,
    lastFormValues,
    isAdd,
    setIsAdd,
    isAddDisable
  } = props;
  // const [form] = Form.useForm();
  const [treeData, setTreeData] = useState<any>([]); // 左侧树结构数据
  const [tableData, setTableData] = useState<any>([]); // 表格的数据
  const [tableTitle, setTableTitle] = useState<any>([]); // 表头字段
  const [visible, setVisible] = useState<boolean>(false); // 新建弹窗
  const [loading, setLoading] = useState<{ tree: boolean; table: boolean }>({ tree: false, table: false }); // 加载
  const [loadKey, setLoadKey] = useState<string>(''); // 展开节点key
  // const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<string[]>([]);
  const [contentKey, setContentKey] = useState<string>(''); // 内容区域展示
  const [selectedData, setSelectedData] = useState<any>({}); // 查询的数据表
  const [dataError, setError] = useState<string>(''); // 预览数据表报错
  const [activeCol, setActiveCol] = useState<string>(''); // 选中的列
  const useForceUpdate = HOOKS.useForceUpdate();

  useEffect(() => {
    // 非编辑模式下默认选中第一个
    if (_.isEmpty(editData)) {
      getDataSource(dataSourceOptions?.[0]);
    } else {
      const filterEditData = _.filter(_.cloneDeep(dataSourceOptions), (item: any) => item?.id === editData?.ds_id);
      getDataSource(filterEditData?.[0]);
    }
  }, [dataSourceOptions]);

  /**
   * 获取数据源列表
   */
  const getDataSource = async (selectedSource: any) => {
    try {
      const source = selectedSource;
      const { knId } = getParam(['knId']);
      const { res } = await servicesDataSource.dataSourceGet(-1, 10, 'descend', knId);
      const filterDf = _.filter(
        res?.df,
        item =>
          item?.data_source === source?.data_source &&
          item?.dsname === source?.dsname &&
          _.includes(DATA_SOURCE, item?.data_source)
      );

      const data: any = _.map(filterDf, item => createRootNode(item));
      data.push({ title: '', key: _.uniqueId() });
      setTreeData(data);
      // setDefaultExpandedKeys(data.map((item: any) => item.key));
    } catch (err) {
      //
    }
  };

  /**
   *
   * @param node 操作的节点
   * @param action 执行的操作类型 'expand' 展开 'preview' 预览 'sql' 查询 'refresh' 刷新
   * @returns
   */
  const onLoadData = async (node: any, action = 'expand') => {
    if (action === 'sql') {
      // sql查询
      setContentKey(CONTENT_TYPE.SHOW_SQL);
      setSelectedData(node);
      return;
    }
    if (node.type === BASE) {
      // 展开数据库
      getBaseChildren(node);
    }

    if (node.type === SHEET) {
      // 获取数据表的数据
      getTableData(node, action);
    }

    if (node.type === FIELD) {
      const sheetName = selectedData?.sheetName || selectedData?.title;
      // 选中字段
      if (node?.sheetName !== sheetName) {
        await getTableData(node, action, node?.sheetName);
      }
      // 延迟渲染选中列的样式
      setTimeout(() => {
        setActiveCol(node.title);
      }, 300);
    }
    setLoadKey('');
  };

  /**
   *
   * @param data 预览表数据
   * @param action 操作行为 expand 展开 preview预览 refresh 刷新
   * @param name 点击的字段名
   */
  const getTableData = async (data: any, action: string, name?: '') => {
    try {
      const { title, origin } = data;
      const table_name = name || title; // 点击字段用参数name
      const params: any = { ds_id: origin?.id, data_source: origin?.data_source, name: table_name };
      if (data?.model_name) params.model_name = data.model_name;

      if (action === 'preview' || action === 'refresh') {
        setContentKey(CONTENT_TYPE.SHOW_TABLE);
        setLoading(pre => ({ ...pre, table: true }));
      }
      setError('');
      const response = await servicesDataSource.previewdata(params);
      const resField = await servicesDataSource.getTableField({ ..._.omit(params, 'name'), table_name });
      if (response?.res && resField?.res) {
        const columns = response?.res?.content?.[0];
        const fields = resField?.res?.fields;
        const tableData = _.map(response?.res.content?.slice(1), (item, index: number) => {
          const obj: any = { rowId: index };
          _.forEach(item, (value, index) => {
            obj[columns[index]] = value;
          });
          return obj;
        });

        const children: any = _.map(columns, item => {
          return {
            title: item,
            key: _.uniqueId(),
            type: FIELD,
            fieldType: addParentheses(fields?.[item]),
            origin,
            sheetName: title,
            model_name: data?.model_name
          };
        });
        children.push({ title: '', key: _.uniqueId() });
        const tree = updateTreeData(_.cloneDeep(treeData), data, children);
        if (action === 'refresh') {
          message.success(intl.get('domainData.refreshSuccess'));
        }

        if (action === 'preview' || action === 'refresh') {
          setTableData(tableData);
          setTableTitle(columns);
          setSelectedData(data);
        }

        if (action === 'expand') setLoadKey(data?.key);
        if (!name) {
          setActiveCol('');
          setTreeData(tree);
        }
      }
      if (response?.Description || resField.Description) {
        const error = response?.Description || resField.Description;
        setError(error);
        setContentKey('');
      }
      setLoading(pre => ({ ...pre, table: false }));
    } catch (err) {
      //
    }
  };

  /**
   * 获取数据表或者模式
   * @param 点击的数据
   */
  const getBaseChildren = async (node: any) => {
    try {
      const { origin } = node;
      const params = {
        ds_id: origin.id,
        data_source: origin.data_source,
        postfix: 'all'
      };
      const { res, ...errors }: any = await servicesDataSource.getSheetData(params); // 调用接口获取更深层次数据
      if (errors?.ErrorCode) return message.error(errors?.Description);
      let newNodes: any[] = [];
      if (_.isObject(res?.output)) {
        // 模式
        const filterData = _.filter(Object.entries(res?.output), ([mode, data]: any) => !_.isEmpty(data));
        newNodes = _.map(filterData, ([mode, tables]: any) => {
          const children: any = _.map(tables, tableName => ({
            title: tableName,
            key: _.uniqueId(),
            type: SHEET,
            model_name: mode,
            isLeaf: false,
            origin
          }));
          children.push({ title: '', key: _.uniqueId() });
          return { title: mode, type: MODE, key: _.uniqueId(), isLeaf: false, children, origin };
        });
      }
      if (_.isArray(res?.output)) {
        // 表
        newNodes = _.map(res?.output, item => {
          return { title: item?.name || item, key: _.uniqueId(), type: SHEET, isLeaf: false, origin };
        });
      }
      newNodes.push({ title: '', key: _.uniqueId() });
      const updatedTreeData = updateTreeData(treeData, node, newNodes);
      setTreeData(() => [...updatedTreeData]);
      setLoadKey(node?.key);
      useForceUpdate();
    } catch (error) {
      console.error('Error loading:', error);
    }
  };

  /**
   * 刷新
   */
  const refresh = async (isFresh = true) => {
    try {
      const { knId } = getParam(['knId']);
      setLoading(pre => ({ ...pre, tree: true }));
      const kwId = Number(knId);

      const response = await servicesDataSource.dataSourceGet(-1, 10, 'descend', kwId);
      if (response?.res) {
        const treeDataKV = _.keyBy(treeData, 'id');
        const filterDf = _.filter(response?.res?.df, item => _.includes(DATA_SOURCE, item?.data_source));
        const newData: any = _.map(filterDf, item => {
          const { dsname, id } = item;
          const node = treeDataKV?.[id];
          if (node) {
            return { ...node, title: dsname };
          }
          return createRootNode(item);
        });
        newData.push({ title: '', key: _.uniqueId() });
        setTreeData(newData);
        setLoading(pre => ({ ...pre, tree: false }));
        const msg = isFresh ? intl.get('domainData.refreshSuccess') : intl.get('global.saveSuccess');
        message.success(msg);
      }
    } catch (err) {
      //
    }
  };

  /**
   * 控制新建弹窗
   */
  const onChangeModalVisible = (value: boolean) => setVisible(value);

  /**
   * 选择框变化
   */
  const onSelectChange = (e: any) => {
    const filterData = _.filter(_.cloneDeep(dataSourceOptions), (item: any) => item?.id === e);
    getDataSource(filterData?.[0]);
    onShouldUpdate();
  };

  const onShouldUpdate = () => {
    const formValues = form.getFieldsValue();
    if (
      lastFormValues.current &&
      (formValues.ds_id !== lastFormValues.current?.ds_id || formValues.sql !== lastFormValues.current?.sql)
    ) {
      setSqlChangeTips(true);
    } else {
      setSqlChangeTips(false);
    }
  };

  return (
    <div className="kw-w-100 left-source-tree-root">
      <Form form={form} layout="vertical">
        <Form.Item
          label={intl.get(`${prefixLocale}.sqlExtractFormItemDataSource`)}
          name="ds_id"
          rules={[
            {
              required: true,
              message: intl.get('global.noNull')
            }
          ]}
          validateTrigger={['onChange', 'onBlur']}
        >
          <Select
            getPopupContainer={triggerNode => triggerNode.parentElement}
            placeholder={intl.get('cognitiveSearch.intention.select')}
            notFoundContent={<Empty image={kongImg} description={intl.get('global.noData')} />}
            onChange={onSelectChange}
          >
            {dataSourceOptions.map((dsItem: any) => (
              <Select.Option key={dsItem.id} value={dsItem.id} label={dsItem.dsname}>
                <div className="kw-flex">
                  <span className="kw-mr-2 kw-align-center">
                    <img className="source-icon" src={SOURCE_IMG_MAP[dsItem.data_source]} alt="KWeaver" />
                  </span>
                  <div className="kw-flex-item-full-width">
                    <div className="kw-c-header kw-ellipsis" title={dsItem.dsname}>
                      {dsItem.dsname}
                    </div>
                    <div className="kw-c-subtext kw-ellipsis">{dsItem.ds_path}</div>
                  </div>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>

      <DataSourceTree
        treeData={treeData}
        loading={loading?.tree}
        loadKey={loadKey}
        refresh={refresh}
        onLoadData={onLoadData}
        onChangeModalVisible={onChangeModalVisible}
        onAdd={onAdd}
        isAdd={isAdd}
        setIsAdd={setIsAdd}
        isAddDisable={isAddDisable}
        // defaultExpandedKeys={defaultExpandedKeys}
      />
    </div>
  );
};

export default LeftSourceTree;
