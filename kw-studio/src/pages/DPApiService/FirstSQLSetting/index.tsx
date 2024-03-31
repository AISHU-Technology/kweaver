import React, { useState, useEffect, useContext } from 'react';
import { message, Button, Tooltip, Tree } from 'antd';
import { Prompt, useHistory, useLocation } from 'react-router-dom';
import { getParam } from '@/utils/handleFunction';
import intl from 'react-intl-universal';
import HOOKS from '@/hooks';
import _ from 'lodash';
import classNames from 'classnames';
import { tipModalFunc } from '@/components/TipModal';
import servicesDataSource from '@/services/dataSource';
import servicesDpapi from '@/services/dpapi';

import DataSourceTree from './SQLSourceTree';
// import DataSourceTree from '../../KnowledgeNetwork/DataSourceQuery/DataSourceTree';
import SQLContent from './SQLContent';

import { createRootNode, updateTreeData, addParentheses } from './assistant';
import { DATA_SOURCE, NODE_TYPE, CONTENT_TYPE } from './enums';
import {
  DpapiDataContext,
  CHANGE_DATASOURCEID,
  CHANGE_BASICDATA,
  CHANGE_KNDATA,
  CHANGE_EDITING_VALUE,
  CHANGE_KN_USER_LIST_VALUE,
  CHANGE_SELECTED_KN_USER_ID_VALUE,
  CHANGE_SELECTED_KN_USER_INFO_VALUE
} from '../dpapiData';

import './style.less';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

const { SHEET, MODE, FIELD, BASE } = NODE_TYPE;

const FirstSQLSetting = (props: any) => {
  const history = useHistory();
  // @ts-ignore
  const { data, dispatch } = useContext(DpapiDataContext);
  const { knData: knDataVal, basicData, editorData, knUserList, selectedKnUserId } = data.toJS();
  const { setStep, setIsPrevent, onNext, pageAction, id, kwId, onKnIdChange } = props;

  const location = useLocation();
  // const knData: any = location.state;
  const knData: any = knDataVal;

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
  const [testData, setTestData] = useState<any>(null);

  useEffect(() => {
    if (!_.isEmpty(location.state)) {
      dispatch({ type: CHANGE_KNDATA, data: location.state });
    }
  }, []);

  useEffect(() => {
    if (!kwId) return;
    getDataSource(); // 先获取当前知识网络用户的 数据库信息
  }, [kwId]);

  const getInfo = async () => {
    const services = servicesDpapi.DBApiInfo;
    const res = await services({ id });
    return res;
  };

  useEffect(() => {
    (async () => {
      if (pageAction !== 'create') {
        // 接口請求回來
        const result = await getInfo();
        const {
          data: {
            datasourceInfo: {
              dataSource,
              connectType,
              dsName,
              id,
              dataType,
              dsPath,
              dsAddress,
              dsPort,
              dsUser,
              dsPassword
            }
          }
        } = result;
        const datasourceInfo = {
          origin: {
            id: Number(id),
            dsname: dsName,
            ds_path: dsPath,
            data_source: dataSource,
            ds_address: dsAddress,
            ds_port: dsPort,
            ds_user: dsUser,
            ds_password: dsPassword
          }
        };
        const basicData = result.data;
        // 新结构 参数数组
        dispatch({ type: CHANGE_EDITING_VALUE, data: basicData.ext });
        dispatch({ type: CHANGE_DATASOURCEID, data: datasourceInfo });
        dispatch({ type: CHANGE_BASICDATA, data: basicData });
        //
        const select_data = {
          origin: {
            data_source: dataSource,
            connect_type: connectType,
            dataType,
            dsname: dsName,
            id: Number(id)
          }
        };
        setSelectedData(select_data);
        // 接口数据返回结果
        const tmp = {
          action: 'edit',
          config_info: {
            // 模板值 sql
            statements: basicData.ext.statements,
            params: basicData.ext.params
          }
        };
        // @ts-ignore
        setTestData((prev: any) => {
          return { ...prev, ...tmp };
        });
      } else {
        setTestData({
          config_info: {
            statements: '',
            params: []
          },
          action: 'create'
        });
      }
    })();

    getKnowledgeList();
  }, []);

  /**
   * 获取知识网络用户列表
   */
  const getKnowledgeList = async () => {
    const data = { page: 1, size: 10000, order: 'desc', rule: 'update' };
    try {
      const result = await servicesKnowledgeNetwork.knowledgeNetGet(data);
      if (result?.res?.df && result?.res?.df?.length > 0) {
        // @ts-ignore
        const items: any = result?.res?.df || [];
        dispatch({ type: CHANGE_KN_USER_LIST_VALUE, data: items });
        if (items && items.length > 0) {
          if (pageAction === 'create') {
            // create
            dispatch({ type: CHANGE_SELECTED_KN_USER_ID_VALUE, data: items[0].id });
            dispatch({ type: CHANGE_SELECTED_KN_USER_INFO_VALUE, data: items[0] });
            onKnIdChange(items[0].id);
          } else {
            // edit状态
            // 找到对应kwId的数据
            const findArr = items.filter((x: any) => x.id === Number(kwId));
            if (findArr && findArr.length > 0) {
              dispatch({ type: CHANGE_SELECTED_KN_USER_ID_VALUE, data: kwId });
              dispatch({ type: CHANGE_SELECTED_KN_USER_INFO_VALUE, data: findArr[0] });
            }
          }
        }
      }
    } catch (error) {}
  };
  /**
   * 获取数据源列表
   */
  const getDataSource = async () => {
    try {
      const kwId_val = Number(kwId);
      const { res } = await servicesDataSource.dataSourceGet(-1, 10, 'descend', kwId_val);
      const filterDf = _.filter(res?.df, item => _.includes(DATA_SOURCE, item?.data_source));

      const data: any = _.map(filterDf, item => createRootNode(item));
      data.push({ title: '', key: _.uniqueId() });
      setTreeData(data);
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
      setSelectedData(node);
      setContentKey('sql');
      dispatch({ type: CHANGE_DATASOURCEID, data: node });
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
      const { res }: any = await servicesDataSource.getSheetData(params); // 调用接口获取更深层次数据
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
  const refresh = async (isFresh = true, currentKwId = -1, isToastSuccess = true) => {
    try {
      setLoading(pre => ({ ...pre, tree: true }));
      let kwId_val: number;
      if (currentKwId !== -1) {
        kwId_val = Number(currentKwId);
      } else {
        kwId_val = Number(kwId);
      }

      const response = await servicesDataSource.dataSourceGet(-1, 10, 'descend', kwId_val);
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
        isToastSuccess && message.success(msg);
      }
    } catch (err) {
      //
    }
  };

  /**
   * 退出
   */
  const onExit = async (type?: any, data?: any) => {
    const isOk = await tipModalFunc({
      title: intl.get('cognitiveSearch.quit'),
      content: intl.get('cognitiveSearch.notRetrieved')
    });
    if (!isOk) {
      setIsPrevent(true);
      return;
    }
    setIsPrevent(false);
    Promise.resolve().then(() => {
      history.push(`/cognitive-application/domain-dbapi?id=${kwId}`);
    });
  };

  /**
   * 下一步
   */
  const onIsNext = async () => {
    let flag = false;
    flag = editorData && editorData.statement;
    if (flag) {
      onNext();
    } else {
      message.warning(intl.get('dpapiService.sqlWranning'));
    }
  };

  return (
    <div className="dpapi-first-step-contianer">
      <div className="dpapi-first-content kw-flex">
        <div className="first-step-left kw-h-100 kw-pl-5 kw-pr-5">
          <DataSourceTree
            treeData={treeData}
            loading={loading?.tree}
            loadKey={loadKey}
            refresh={refresh}
            pageAction={pageAction}
            onKnIdChange={onKnIdChange}
            onLoadData={onLoadData}
          />
        </div>
        <div className="first-step-right kw-border-l kw-h-100">
          <SQLContent
            selectedData={selectedData}
            basicData={basicData}
            testData={testData}
            contentKey={contentKey}
            pageAction={pageAction}
          />
        </div>
      </div>
      {/* 底部 */}
      <div className="footer-box kw-center">
        <Button type="default" onClick={onExit}>
          {intl.get('cognitiveSearch.cancel')}
        </Button>
        <Button type="primary" onClick={onIsNext}>
          {intl.get('cognitiveSearch.next')}
        </Button>
      </div>
    </div>
  );
};

export default FirstSQLSetting;
