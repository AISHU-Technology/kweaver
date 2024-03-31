import React, { useState, useEffect, useReducer } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Select, Dropdown, Menu, message } from 'antd';
import { ArrowDownOutlined } from '@ant-design/icons';

import HOOKS from '@/hooks';
import HELPER from '@/utils/helper';
import { PERMISSION_CODES } from '@/enums';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import { Header } from '@/components/ADTable';

import { INIT_STATE, SELECT_STATUS, SORTER_MENU } from './enum';
import { TableState } from './types';
import { getParam } from '@/utils/handleFunction';
import intentionService from '@/services/intention';
import IntentionTable from './IntentionTable';
import './style.less';

const DESC = 'descend';
const { Option } = Select;
const reducer = (state: TableState, action: Partial<TableState>) => ({ ...state, ...action });
const IntentionPool = (props: any) => {
  const history = useHistory();
  const [tableData, setTableData] = useState<any[]>([]); // 表格数据
  const [tableState, dispatchTableState] = useReducer(reducer, INIT_STATE);
  const [rotateRefresh, setRotateRefresh] = useState(false);

  useEffect(() => {
    getIntentList({});
  }, []);

  /**
   * 获取表格数据
   */
  const getIntentList = async (state: Partial<TableState>, needLoading = true) => {
    try {
      const { search_name, page, count, loading, filter_status, order, rule } = { ...tableState, ...state };
      dispatchTableState({ ...state, loading: !!needLoading });
      const data: any = {
        page,
        size: 10,
        order,
        rule
      };
      if (filter_status !== '-1') {
        data.filter_status = filter_status;
      }
      if (search_name) {
        data.search_name = search_name;
      }
      const { res } = await intentionService.getIntentPoolList(data);
      if (res) {
        const { count, res_list } = res;
        setTableData(res_list);
        dispatchTableState({ count, loading: false });
      }
    } catch (err) {
      dispatchTableState({ loading: false });
      err?.ErrorDetails && message.error(err?.ErrorDetails[0].detail);
    }
  };

  /**
   * 排序
   */
  const onSortMenuClick = (key: any) => {
    const { rule, order } = tableState;
    const newDesc = 'descend'.slice(0, 4);
    const newAsc = 'ascend'.slice(0, 3);
    onChangeTable({
      page: 1,
      rule: key,
      order: rule === key ? (order === newDesc ? newAsc : newDesc) : order
    });
  };

  /**
   * 刷新
   */
  const onRefresh = () => {
    setRotateRefresh(true);
    message.success(intl.get('userManagement.refreshSuccess'));
    getIntentList({});
    setTimeout(() => {
      setRotateRefresh(false);
    }, 500);
  };

  /**
   * 每30s刷新
   */
  HOOKS.useInterval(() => {
    getIntentList({ ...tableState }, false);
  }, 1000 * 30);

  /**
   * 更新参数状态，重新获取表格数据
   */
  const onChangeTable = (data = {}) => {
    dispatchTableState({ ...tableState, ...data });
    getIntentList(data);
  };

  /**
   * 新建 | 编辑
   * @param type // create | edit
   */
  const onCreateEdit = (type: string, record?: any) => {
    const { id } = getParam(['id']);
    if (record) {
      history.push(`/intention-create?action=${type}&knw_id=${id}&intentpool_id=${record?.intentpool_id}`);
      return;
    }
    history.push(`/intention-create?action=${type}&knw_id=${id}`);
  };

  /**
   * 意图池状态 英文时
   */
  const onIntentionStatus = (status: any) => {
    if (status === -1) {
      getIntentList({ filter_status: '-1', page: 1 });
      return;
    }
    let handleStatus: any = '';
    switch (status) {
      case 'untrained':
        handleStatus = '未训练';
        break;
      case 'training':
        handleStatus = '训练中';
        break;
      case 'train failed':
        handleStatus = '训练失败';
        break;
      case 'train succeeded':
        handleStatus = '训练成功';
        break;
      default:
        handleStatus = status;
    }

    getIntentList({ filter_status: handleStatus, page: 1 });
  };

  return (
    <div style={{ padding: '15px 24px 24px' }}>
      <Header
        title={intl.get('cognitiveSearch.recognition')}
        searchPlaceholder={intl.get('intention.searchName')}
        onSearchChange={(query: any) => getIntentList({ page: 1, search_name: query })}
        renderButtonConfig={[
          {
            key: 'button-one',
            position: 'left',
            itemDom: (
              <Format.Button
                type="primary"
                disabled={
                  !HELPER.getAuthorByUserInfo({
                    roleType: PERMISSION_CODES.ADF_INTENT_POOL_CREATE
                  })
                }
                onClick={() => onCreateEdit('create')}
              >
                <IconFont type="icon-Add" style={{ color: '#fff' }} />
                {intl.get('intention.create')}
              </Format.Button>
            )
          },
          {
            key: 'button-two',
            position: 'right',
            itemDom: (
              <Dropdown
                placement="bottomRight"
                trigger={['click']}
                overlay={
                  <Menu selectedKeys={[tableState.rule]} onClick={({ key }) => onSortMenuClick(key)}>
                    {SORTER_MENU.map(({ key, text }) => (
                      <Menu.Item key={key}>
                        <ArrowDownOutlined
                          className="kw-mr-2"
                          rotate={tableState.order === DESC.slice(0, 4) ? 0 : 180}
                          style={{ opacity: tableState.rule === key ? 0.8 : 0, fontSize: 15 }}
                        />
                        {text}
                      </Menu.Item>
                    ))}
                  </Menu>
                }
              >
                <Format.Button type="icon" className="tool-btn" tip={intl.get('global.sort')} tipPosition="top">
                  <IconFont type="icon-paixu11" className="sort-icon" />
                </Format.Button>
              </Dropdown>
            )
          },
          {
            key: 'button-3',
            position: 'right',
            itemDom: (
              <Format.Button
                type="icon"
                className={`tool-btn div-icon-box ${rotateRefresh ? 'icon-refresh' : null}`}
                tip={intl.get('global.refresh')}
                tipPosition="top"
                onClick={onRefresh}
              >
                <IconFont type="icon-tongyishuaxin" style={{ fontSize: 16 }} />
              </Format.Button>
            )
          }
        ]}
        filterToolsOptions={[
          {
            id: 'select-one',
            label: intl.get('intention.state'),
            itemDom: (
              <Select className="intention-select" defaultValue={-1} onChange={onIntentionStatus}>
                {_.map(SELECT_STATUS, (item: any) => (
                  <Option key={item.key} value={item.key}>
                    {item.name}
                  </Option>
                ))}
              </Select>
            )
          }
        ]}
      />
      {/* <div className="kw-mb-3">
        <Format.Title className="kw-mr-2">{intl.get('cognitiveSearch.intentPool')}</Format.Title>
      </div> */}
      {/* <div className="intention-table-list"> */}
      {/* <div className="intention-head">
          <Format.Button
            type="primary"
            disabled={
              !HELPER.getAuthorByUserInfo({
                roleType: PERMISSION_CODES.ADF_INTENT_POOL_CREATE
              })
            }
            onClick={() => onCreateEdit('create')}
          >
            <IconFont type="icon-Add" style={{ color: '#fff' }} />
            {intl.get('intention.create')}
          </Format.Button>
          <div className="intention-head-right">
            {intl.get('intention.state')}
            <Select className="kw-mr-3 kw-ml-3 intention-select" defaultValue={-1} onChange={onIntentionStatus}>
              {_.map(SELECT_STATUS, (item: any) => (
                <Option key={item.key} value={item.key}>
                  {item.name}
                </Option>
              ))}
            </Select>
            <SearchInput
              className="search-input"
              onChange={e => onSearch(e)}
              placeholder={intl.get('intention.searchName')}
            />
            <Dropdown
              placement="bottomRight"
              overlay={
                <Menu selectedKeys={[tableState.rule]} onClick={({ key }) => onSortMenuClick(key)}>
                  {SORTER_MENU.map(({ key, text }) => (
                    <Menu.Item key={key}>
                      <ArrowDownOutlined
                        className="kw-mr-2"
                        rotate={tableState.order === DESC.slice(0, 4) ? 0 : 180}
                        style={{ opacity: tableState.rule === key ? 0.8 : 0, fontSize: 15 }}
                      />
                      {text}
                    </Menu.Item>
                  ))}
                </Menu>
              }
            >
              <Format.Button type="icon" className="kw-ml-3 tool-btn">
                <IconFont type="icon-paixu11" className="sort-icon" />
              </Format.Button>
            </Dropdown>
            <Format.Button
              type="icon"
              className={`tool-btn div-icon-box ${rotateRefresh ? 'icon-refresh' : null}`}
              title={intl.get('global.refresh')}
              onClick={onRefresh}
            >
              <IconFont type="icon-tongyishuaxin" style={{ fontSize: 16 }} />
            </Format.Button>
          </div>
        </div> */}
      {/* <IntentionTable
          tableState={tableState}
          tableData={tableData}
          onChangeTable={onChangeTable}
          onCreateEdit={onCreateEdit}
        /> */}
      {/* </div> */}
      <IntentionTable
        tableState={tableState}
        tableData={tableData}
        onChangeTable={onChangeTable}
        onCreateEdit={onCreateEdit}
      />
    </div>
  );
};

export default IntentionPool;
