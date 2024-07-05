import React, { useReducer, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

import { Table, Input } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import _ from 'lodash';
import intl from 'react-intl-universal';

import HOOKS from '@/hooks';
import THESAURUS_TEXT from '@/enums/thesaurus_mode';
import { ONLY_KEYBOARD } from '@/enums';
import NoDataBox from '@/components/NoDataBox';
import createImg from '@/assets/images/create.svg';
import noResult from '@/assets/images/noResult.svg';
import KwTable from '@/components/KwTable';

import { onDeleteTableData, onGetListTable } from './assistFunction';
import ErrorTip from '../../ErrorTip';

import './style.less';
import classNames from 'classnames';

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

const reducer = (state: TableProp, action: Partial<TableProp>) => ({ ...state, ...action });
const ThesaurusTable = (props: any, ref: any) => {
  const {
    thesaurusTableData,
    setVisibleThesaurus,
    setThesaurusTableData,
    setIsChange,
    setThesaurusTableDataTime,
    tableLoading,
    mode
  } = props;
  const [tableState, dispatchState] = useReducer(reducer, init_state);
  const [searchTableData, setSearchTableData] = useState<any>([]); // 用于搜索变化的表格数据
  const { height } = HOOKS.useWindowSize();

  useImperativeHandle(ref, () => ({
    onHandleTableStateData
  }));

  useEffect(() => {
    onGetTableData();
  }, []);

  /**
   * 获取表格数据
   */
  const onGetTableData = (state = { page: 1, query: '', loading: false }, data?: any) => {
    if (data) {
      setThesaurusTableData(data);
      setThesaurusTableDataTime(data);
    }
    const { res } = onGetListTable({ ...tableState, ...state }, data || thesaurusTableData);

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

  const columns = [
    {
      title: intl.get('ThesaurusManage.createMode.lexiconName'),
      dataIndex: 'name',
      className: 'rowSpan',
      width: 467,
      ellipsis: true,
      onCell: (text: any, record: any) => ({
        rowSpan: text?.thesaurusSpan
      }),
      render: (text: any, record: any) => (
        <div className="kw-ellipsis" title={text}>
          {text}
        </div>
      )
    },
    {
      title: intl.get('ThesaurusManage.createMode.column'),
      width: 467,
      dataIndex: 'prop',
      ellipsis: true,
      render: (text: any, record: any) => (
        <div className="kw-ellipsis" title={text}>
          {text}
        </div>
      )
    },
    {
      title: intl.get('ThesaurusManage.createMode.delimiter'),
      dataIndex: 'separator',
      width: 467,
      render: (text: any, record: any) => {
        return (
          <div className="separator-box">
            <ErrorTip errorText={record?.errorTip}>
              <Input
                className={classNames({ 'error-input': record?.errorTip })}
                disabled={
                  record?.name === record?.disable?.name &&
                  record?.entity_name === record?.disable?.entity_name &&
                  record?.prop === record?.disable?.lexicon
                }
                value={text}
                onChange={e => onInputChange(e, record)}
              />
            </ErrorTip>
          </div>
        );
      }
    },
    {
      title: intl.get('dpapiList.option'),
      width: 467,
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
    const result = onHandleChange(thesaurusTableData, record, e?.target?.value, 'input');
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
    const { name, prop } = record;
    const cloneTableData = _.cloneDeep(data);
    const result = _.map(cloneTableData, (item: any) => {
      if (item.name === name && item.prop === prop) {
        item.separator = value;
        const error = onTypeError(value);
        item.errorTip = error;
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
    const cloneTableData = _.cloneDeep(thesaurusTableData);
    const result = onDeleteTableData(record, cloneTableData);
    setIsChange(true);
    onHandleTableStateData({ page: 1 }, result);
  };

  return (
    <div className="thesaurus-mode-create-table-root">
      <KwTable
        showHeader={false}
        columns={columns}
        className={classNames('thesaurus-table-root', { 'thesaurus-table-root-empty': _.isEmpty(searchTableData) })}
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
            <div className="noData-box">
              <div className="kw-center kw-c-text-lower">
                <div>{intl.get('ThesaurusManage.createMode.add').split('|')[0]}</div>
                <div className="kw-pointer kw-c-primary" onClick={() => setVisibleThesaurus(true)}>
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

export default forwardRef(ThesaurusTable);
