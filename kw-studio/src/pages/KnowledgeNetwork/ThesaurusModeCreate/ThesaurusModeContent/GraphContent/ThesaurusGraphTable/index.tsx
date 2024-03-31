import React, { useReducer, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

import { Table, Input, Select } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import _ from 'lodash';
import intl from 'react-intl-universal';

import classNames from 'classnames';
import { ONLY_KEYBOARD } from '@/enums';
import THESAURUS_TEXT from '@/enums/thesaurus_mode';
import { onDeleteTableData, onGetListTable } from './assistFunction';
import ADTable from '@/components/ADTable';

import HOOKS from '@/hooks';
import { getParam } from '@/utils/handleFunction';
import NoDataBox from '@/components/NoDataBox';
import createImg from '@/assets/images/create.svg';
import noResult from '@/assets/images/noResult.svg';

import ErrorTip from '../../ErrorTip';

import './style.less';

type TableProp = {
  loading: boolean;
  page: number;
  query: '';
  total: number;
  graph: string;
};

const init_state: TableProp = {
  loading: false,
  page: 1,
  query: '',
  total: 0,
  graph: '-1'
};

const SIZE = 10;
const reducer = (state: TableProp, action: Partial<TableProp>) => ({ ...state, ...action });
const ThesaurusGraphTable = (props: any, ref: any) => {
  const { tableData, mode, setVisible, setTableData, setIsChange, setGraphTableDataTime, tableLoading } = props;
  const [tableState, dispatchState] = useReducer(reducer, init_state);
  const [searchTableData, setSearchTableData] = useState<any>([]); // 用于搜索变化的表格数据
  const language = HOOKS.useLanguage();
  const { height } = HOOKS.useWindowSize();

  useImperativeHandle(ref, () => ({
    onHandleTableStateData
  }));

  useEffect(() => {
    if (!mode) return;
    onGetTableData();
  }, []);

  /**
   * 获取表格数据
   */
  const onGetTableData = (state = { page: 1, query: '', loading: false }, data?: any) => {
    dispatchState({ loading: true });

    if (data) {
      setTableData(data);
      setGraphTableDataTime(data);
    }
    const { res } = onGetListTable({ ...tableState, ...state }, data || tableData);

    if (res?.count) {
      setSearchTableData(res?.df);
      dispatchState({ total: res?.count, loading: false });
      return;
    }
    setSearchTableData([]);
    dispatchState({ loading: false, total: res?.count });
  };

  const onHandleTableStateData = (state: any, data?: any) => {
    dispatchState({ ...tableState, ...state, loading: true });
    onGetTableData(state, data);
  };

  const columns: any = [
    {
      title: intl.get('ThesaurusManage.graphName'),
      dataIndex: 'name',
      width: getParam(['mode'])?.mode === 'std' ? 312 : 374,
      className: 'rowSpan',
      ellipsis: true,
      onCell: (text: any, record: any) => ({
        rowSpan: text?.graphNameSpan
      }),
      render: (text: any, record: any) => (
        <div className="kw-ellipsis" title={text}>
          {text}
        </div>
      )
    },
    {
      title: intl.get('exploreGraph.entity'),
      dataIndex: 'entity_name',
      className: 'rowSpan',
      width: getParam(['mode'])?.mode === 'std' ? 312 : 374,
      onCell: (text: any, record: any) => ({
        rowSpan: text?.entitySpan
      }),
      ellipsis: true,
      render: (text: any, record: any) => (
        <div className="kw-ellipsis" title={text}>
          {text}
        </div>
      )
    },
    {
      title: intl.get('ThesaurusManage.standard'),
      dataIndex: 'columns',
      className: 'rowSpan',
      width: 312,
      onCell: (text: any, record: any) => ({
        rowSpan: text?.entitySpan
      }),
      render: (text: any, record: any) => {
        return (
          <div>
            <Select
              className="thesaurus-select"
              value={record?.disable?.lexicon}
              onChange={e => onSelectChange(e, record)}
              listHeight={32 * 6}
            >
              {_.map(record?.props, (item: any, index: number) => {
                return (
                  <Select.Option key={index} value={item}>
                    {item}
                  </Select.Option>
                );
              })}
            </Select>
          </div>
        );
      }
    },
    {
      title:
        mode !== 'std'
          ? intl.get('ThesaurusManage.createMode.text')
          : intl.get('ThesaurusManage.createMode.synonymText'),
      width: getParam(['mode'])?.mode === 'std' ? 312 : 374,
      ellipsis: true,
      dataIndex: 'prop',
      render: (text: any, record: any) => (
        <div className="kw-ellipsis" title={text}>
          {text}
        </div>
      )
    },
    {
      title: intl.get('ThesaurusManage.createMode.delimiter'),
      dataIndex: 'separator',
      width: getParam(['mode'])?.mode === 'std' ? 312 : 374,
      render: (text: any, record: any) => {
        return (
          <div className="separator-box">
            <ErrorTip errorText={record?.errorTip}>
              <Input
                className={classNames({ 'error-input': record?.errorTip })}
                value={text}
                disabled={
                  record?.name === record?.disable?.name &&
                  record?.entity_name === record?.disable?.entity_name &&
                  record?.prop === record?.disable?.lexicon
                }
                onChange={e => onInputChange(e, record)}
              />
            </ErrorTip>
          </div>
        );
      }
    },
    {
      title: intl.get('dpapiList.option'),
      width: getParam(['mode'])?.mode === 'std' ? 312 : 374,
      render: (_: any, record: any) => (
        <div className="kw-pointer kw-c-primary" onClick={() => onDelete(record)}>
          {intl.get('dpapiList.delete')}
        </div>
      )
    }
  ];

  /**
   * 报错提示
   */
  const onTypeError = (value: string) => {
    let error: any = '';
    if (!ONLY_KEYBOARD.test(value) && value) {
      error = intl.get('global.onlyKeyboard');
      return error;
    }
    if (value.length > 1 && !['\\n', '\\t'].includes(value)) {
      error = intl.get('ThesaurusManage.createMode.max');
      return error;
    }
    return error;
  };

  /**
   * 输入框值改变
   */
  const onInputChange = (e: any, record: any) => {
    const result = onHandleChange(tableData, record, e?.target?.value, 'input');
    setIsChange(true);
    onHandleTableStateData({}, result);
  };

  /**
   * 下拉框选择
   */
  const onSelectChange = (value: string, record: any) => {
    const result = onHandleChange(tableData, record, value, 'select');
    setIsChange(true);
    onHandleTableStateData({}, result);
  };

  /**
   * 输入框和下拉框变化时数据变动
   * @param data 表格数据
   * @param record 表格行数据
   * @param value 选择|输入的值
   * @param type // input || select
   */
  const onHandleChange = (data: any, record: any, value: string, type: string) => {
    const { name, entity_name, prop } = record;
    const cloneTableData = _.cloneDeep(data);
    const result = _.map(cloneTableData, (item: any) => {
      if (item.name === name && item.entity_name === entity_name) {
        if (type === 'select') {
          item.disable.lexicon = value;
          if (item?.prop === value) {
            item.separator = '';
          }
        }
        if (type === 'input' && prop === item.prop) {
          item.separator = value;
          const error = onTypeError(value);
          item.errorTip = error;
        }
        return item;
      }
      return item;
    });
    return result;
  };

  /**
   * 删除
   */
  const onDelete = (record: any) => {
    const cloneTableData = _.cloneDeep(tableData);
    const result = onDeleteTableData(record, cloneTableData);
    setIsChange(true);
    onHandleTableStateData({ page: 1 }, result);
  };

  return (
    <div className="thesaurus-mode-create-graph-table-root">
      <ADTable
        showHeader={false}
        className={classNames('thesaurus-table-root', { 'thesaurus-table-root-empty': _.isEmpty(searchTableData) })}
        columns={mode === 'std' ? columns : [...columns.slice(0, 2), ...columns.slice(3, 6)]}
        dataSource={searchTableData}
        rowKey={record => record?.id}
        scroll={{ y: height - 334 }}
        loading={
          (tableState.loading || tableLoading) && {
            indicator: <LoadingOutlined className="kw-c-primary" style={{ fontSize: 24 }} />
          }
        }
        pagination={false}
        emptyImage={
          tableState?.query || (tableState?.graph !== '-1' && _.isEmpty(searchTableData)) ? noResult : createImg
        }
        emptyText={
          tableState?.query || (tableState?.graph !== '-1' && _.isEmpty(searchTableData)) ? (
            <span className="kw-c-text-lower">{intl.get('adminManagement.noResult')}</span>
          ) : (
            <div className="noData-box kw-c-text-lower">
              <div className="kw-center">
                <div>{intl.get('ThesaurusManage.createMode.add').split('|')[0]}</div>
                <div
                  className={classNames('kw-pointer kw-c-primary', { 'kw-pl-1 kw-pr-1': language === 'en-US' })}
                  onClick={() => setVisible(true)}
                >
                  {intl.get('ThesaurusManage.createMode.add').split('|')[1]}
                </div>
                <div>
                  {
                    intl
                      .get('ThesaurusManage.createMode.add', { name: THESAURUS_TEXT.THESAURUS_MODE_ZH_CN[mode] })
                      .split('|')[2]
                  }
                </div>
              </div>
            </div>
          )
        }
      />
    </div>
  );
};

export default forwardRef(ThesaurusGraphTable);
