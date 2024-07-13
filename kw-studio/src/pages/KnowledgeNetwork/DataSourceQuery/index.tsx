import React, { useEffect, useState, useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { message } from 'antd';

import HOOKS from '@/hooks';
import servicesDataSource from '@/services/dataSource';
import Format from '@/components/Format';
import DataSourceTree from './DataSourceTree';
import Content from './Content';
import CreateModal from './DataSourceTree/CreateModal';
import { createRootNode, updateTreeData, addParentheses } from './assistant';
import { DATA_SOURCE, NODE_TYPE, CONTENT_TYPE } from './enums';
import LoadingMask from '@/components/LoadingMask';
import addContentImg from '@/assets/images/create.svg';
import './style.less';

const { SHEET, MODE, FIELD, BASE } = NODE_TYPE;

const DataSourceQuery = (props: any) => {
  const { knData } = props;
  const sqlRef = useRef<any>();
  const [treeData, setTreeData] = useState<any>([]); // 左侧树结构数据
  const [tableData, setTableData] = useState<any>([]); // 表格的数据
  const [tableTitle, setTableTitle] = useState<any>([]); // 表头字段
  const [activeCol, setActiveCol] = useState<string>(''); // 选中的列
  const [loading, setLoading] = useState<{ tree: boolean; table: boolean }>({ tree: false, table: false }); // 加载
  const [contentKey, setContentKey] = useState<string>(''); // 内容区域展示
  const [visible, setVisible] = useState<boolean>(false); // 新建弹窗
  const [loadKey, setLoadKey] = useState<string>(''); // 展开节点key
  const [selectedData, setSelectedData] = useState<any>({}); // 查询的数据表
  const [dataError, setError] = useState<string>(''); // 预览数据表报错
  const useForceUpdate = HOOKS.useForceUpdate();
  const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<string[]>([]);
  const [pageLoading, setPageLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!knData?.id) return;
    getDataSource();
  }, [knData]);

  /**
   * 控制新建弹窗
   */
  const onChangeModalVisible = (value: boolean) => setVisible(value);

  /**
   * 获取数据源列表
   */
  const getDataSource = async () => {
    try {
      setPageLoading(true);
      const kwId = Number(knData?.id);
      const { res } = (await servicesDataSource.dataSourceGet(-1, 10, 'descend', kwId)) || {};
      if (res) {
        const filterDf = _.filter(res?.df, item => _.includes(DATA_SOURCE, item?.data_source));

        const data: any = _.map(filterDf, item => createRootNode(item));
        data.push({ title: '', key: _.uniqueId() });
        setTreeData(data);
        setDefaultExpandedKeys(data.map((item: any) => item.key));
      }

      setTimeout(() => {
        setPageLoading(false);
      }, 300);
    } catch (err) {
      //
      setTimeout(() => {
        setPageLoading(false);
      }, 300);
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
      if (node?.sheetName !== sheetName || contentKey === CONTENT_TYPE.SHOW_SQL) {
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
          setLoading(pre => ({ ...pre, table: false }));
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
        setLoading(pre => ({ ...pre, table: false }));
      }
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
        const filterData = _.filter(Object.entries(res?.output), ([data]: any) => !_.isEmpty(data));
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
      setLoading(pre => ({ ...pre, tree: true }));
      const kwId = Number(knData?.id);

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
   * 类名添加至光标后
   */
  const onAdd = (value: any) => {
    sqlRef?.current?.onInsert(value);
  };

  return (
    <div className="dataSourceQueryRoot">
      <LoadingMask loading={pageLoading} />
      <div className="kw-h-100" style={{ display: pageLoading ? 'none' : 'block' }}>
        <Format.Title className="kw-c-header">{intl.get('domainData.dataSearch')}</Format.Title>
        {_.isEmpty(treeData) ? (
          <div className="kw-center kw-border kw-w-100" style={{ height: 'calc(100% - 24px)' }}>
            <div style={{ textAlign: 'center' }}>
              <img src={addContentImg} />
              <div>
                {intl.get('domainData.createEmpty').split('|')[0]}
                <span className="kw-c-primary kw-pointer" onClick={() => onChangeModalVisible(true)}>
                  {intl.get('domainData.createEmpty').split('|')[1]}
                </span>
                {intl.get('domainData.createEmpty').split('|')[2]}
              </div>
            </div>
          </div>
        ) : (
          <div className="kw-flex kw-mt-4" style={{ height: 'calc(100% - 32px)' }}>
            <DataSourceTree
              treeData={treeData}
              loading={loading?.tree}
              loadKey={loadKey}
              refresh={refresh}
              onLoadData={onLoadData}
              onChangeModalVisible={onChangeModalVisible}
              defaultExpandedKeys={defaultExpandedKeys}
              onAdd={onAdd}
              contentKey={contentKey}
            />
            <Content
              ref={sqlRef}
              treeData={treeData}
              loading={loading?.table}
              dataError={dataError}
              contentKey={contentKey}
              tableData={tableData}
              tableTitle={tableTitle}
              activeCol={activeCol}
              selectedData={selectedData}
              onLoadData={onLoadData}
              onChangeModalVisible={onChangeModalVisible}
            />
          </div>
        )}
      </div>
      <CreateModal
        visible={visible}
        onCancel={() => onChangeModalVisible(false)}
        onOK={() => {
          refresh(false);
          onChangeModalVisible(false);
        }}
      />
    </div>
  );
};
export default DataSourceQuery;
