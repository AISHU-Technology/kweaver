import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { Button, Select, Table, Tooltip, Dropdown, Menu, message } from 'antd';
import intl from 'react-intl-universal';
import HOOKS from '@/hooks';
import HELPER from '@/utils/helper';
import { PERMISSION_KEYS, PERMISSION_CODES } from '@/enums';
import serviceFunction from '@/services/functionManage';
import servicesPermission from '@/services/rbacPermission';
import { useHistory } from 'react-router-dom';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import SearchInput from '@/components/SearchInput';
import TipModal from '@/components/TipModal';
import ContainerIsVisible from '@/components/ContainerIsVisible';

import noResImg from '@/assets/images/noResult.svg';
import emptyImg from '@/assets/images/create.svg';
import './style.less';
import ADTable from '@/components/ADTable';
import { EllipsisOutlined } from '@ant-design/icons';
import { sessionStore } from '@/utils/handleFunction';
import useLatestState from '@/hooks/useLatestState';
import useRouteCache from '@/hooks/useRouteCache';
import useAdHistory from '@/hooks/useAdHistory';

const ORDER_MENU = [
  { id: 'create_time', intlText: 'knowledge.byCreate' },
  { id: 'update_time', intlText: 'knowledge.byUpdate' },
  { id: 'name', intlText: 'knowledge.byName' }
];
const FunctionTable = (props: any) => {
  const { routeCache, setRouteCache, tableState, dataSource, kgData, refreshTable } = props;
  const { onChangeState, onChangeDrawer, setAuthFunction, onSetFunctionInfo, onDelete } = props;
  const language = HOOKS.useLanguage();
  const [selectedRowKeys, setSelectedRowKeys, getSelectedRowKeys] = useLatestState<any>(
    routeCache.tableSelectedKey ?? []
  );
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteId, setDeleteId] = useState<any>(); // 删除单个的函数ID
  const [tableData, setTableData] = useState<any>([]); // 表格数据
  const history = useAdHistory();

  useEffect(() => {
    // 获取列表权限, 判断权限
    if (_.isEmpty(dataSource)) {
      setTableData([]);
      return;
    }

    const dataIds = _.map(dataSource, item => String(item.id));
    const postData = { dataType: PERMISSION_KEYS.TYPE_FUNCTION, dataIds };
    // servicesPermission.dataPermission(postData).then(result => {
    //   const codesData = _.keyBy(result?.res, 'dataId');
    //   const newTableData = _.map(dataSource, item => {
    //     item.__codes = codesData?.[item.id]?.codes;
    //     return item;
    //   });
    //   setTableData(newTableData);
    // });
    setTableData(dataSource);
  }, [JSON.stringify(dataSource)]);

  const selectMenu = (e: any) => {
    const { rule, order } = tableState;
    if (e.key === rule) {
      const or = order === 'desc' ? 'asc' : 'desc';
      onChangeState({ page: 1, order: or });
      return;
    }
    onChangeState({ page: 1, rule: e.key });
  };

  // 删除回调函数
  const deleteFunction = async () => {
    let ids: any = selectedRowKeys;
    if (deleteId) {
      ids = [deleteId];
    }
    onDelete(ids);
    setDeleteId('');
    if (!deleteId) {
      setSelectedRowKeys([]);
    }
    setDeleteVisible(false);
  };

  // 打开删除弹窗
  const openDeleteModel = (id?: number) => {
    if (id) {
      setDeleteId(id);
    }
    setDeleteVisible(true);
  };

  // 编辑函数
  const onEditFunction = async (record: any) => {
    if (!record?.id) return;

    try {
      const data = { function_id: record?.id };
      const response = await serviceFunction.functionInfo(data);
      if (response?.res) {
        const disabled = !HELPER.getAuthorByUserInfo({
          roleType: PERMISSION_CODES.ADF_KN_FUNCTION_EDIT,
          userType: PERMISSION_KEYS.FUNCTION_EDIT,
          userTypeDepend: record?.__codes
        });
        onSetFunctionInfo(response?.res, disabled);
      }
      if (response?.ErrorCode) {
        message.error(response?.ErrorDetails);
      }
    } catch (err) {
      //
    }
  };

  /**
   * 下拉筛选菜单
   */
  const menuRule = (
    <Menu className="function-menu-select" onClick={selectMenu}>
      {_.map(ORDER_MENU, item => {
        const { id, intlText } = item;
        const isSelectClass = tableState?.rule === id ? 'menu-selected' : '';
        const iconDirection = tableState?.order === 'asc' ? '' : 'direction';

        return (
          <Menu.Item key={id} className={isSelectClass}>
            <div className="kw-align-center">
              <div className="icon">
                {tableState?.rule === id ? <IconFont type="icon-fanhuishangji" className={iconDirection} /> : null}
              </div>
              <div>{intl.get(intlText)}</div>
            </div>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  /**
   * 定义复选框
   */
  const rowSelection: any = {
    fixed: true,
    type: 'checkbox',
    selectedRowKeys,
    onChange: (rowKeys: any) => setSelectedRowKeys(rowKeys),
    preserveSelectedRowKeys: true,
    getCheckboxProps: (record: any) => {
      if (
        !HELPER.getAuthorByUserInfo({
          roleType: PERMISSION_CODES.ADF_KN_FUNCTION_DELETE,
          userType: PERMISSION_KEYS.FUNCTION_DELETE,
          userTypeDepend: record?.__codes
        })
      ) {
        return { disabled: true };
      }

      return {};
    }
  };

  /**
   * @description 搜索函数
   */
  const searchFunction = (e: any) => {
    onChangeState({ page: 1, search: e?.target?.value });
  };

  // 点击表头排序
  const sortOrderChange = (_: any, __: any, sorter: any, extra: any) => {
    if (extra.action !== 'sort') return;
    const order = sorter.order === 'ascend' ? 'asc' : 'desc';
    const rule = sorter.field;
    onChangeState({ page: 1, rule, order });
  };

  // 取消删除
  const oncancelDelete = () => {
    setDeleteVisible(false);
    setDeleteId('');
  };

  const getSortOrder = (rule: string) => {
    if (tableState?.rule !== rule) return null;
    return tableState?.order === 'asc' ? 'ascend' : 'descend';
  };

  const columns: any = [
    {
      title: intl.get('function.functionName'),
      dataIndex: 'name',
      ellipsis: true,
      fixed: true,
      width: 296,
      sorter: true,
      sortOrder: getSortOrder('name'),
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (text: any, record: any) => {
        return (
          <div
            className="kw-pointer"
            onClick={() => {
              onEditFunction(record);
            }}
          >
            <div className="kw-ellipsis" title={text}>
              {text}
            </div>

            {record?.description ? (
              <div className="function-desc kw-ellipsis kw-c-subtext" title={record?.description}>
                {record?.description}
              </div>
            ) : (
              <div className="function-desc kw-c-watermark">{intl.get('graphList.notDes')}</div>
            )}
          </div>
        );
      }
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'operate',
      fixed: true,
      width: 76,
      render: (_: unknown, record: any) => {
        return (
          <Dropdown
            trigger={['click']}
            overlay={
              <Menu>
                <ContainerIsVisible
                  isVisible={HELPER.getAuthorByUserInfo({
                    roleType: PERMISSION_CODES.ADF_KN_FUNCTION_EDIT,
                    userType: PERMISSION_KEYS.FUNCTION_EDIT,
                    userTypeDepend: record?.__codes
                  })}
                >
                  <Menu.Item
                    onClick={({ domEvent }) => {
                      domEvent.stopPropagation();
                      onEditFunction(record);
                    }}
                  >
                    {intl.get('exploreAnalysis.edit')}
                  </Menu.Item>
                </ContainerIsVisible>
                <ContainerIsVisible
                  isVisible={HELPER.getAuthorByUserInfo({
                    roleType: PERMISSION_CODES.ADF_KN_FUNCTION_DELETE,
                    userType: PERMISSION_KEYS.FUNCTION_DELETE,
                    userTypeDepend: record?.__codes
                  })}
                >
                  <Menu.Item
                    onClick={({ domEvent }) => {
                      domEvent.stopPropagation();
                      openDeleteModel(record?.id);
                    }}
                  >
                    {intl.get('exploreAnalysis.delete')}
                  </Menu.Item>
                </ContainerIsVisible>
                <ContainerIsVisible
                  isVisible={HELPER.getAuthorByUserInfo({
                    roleType: PERMISSION_CODES.ADF_KN_FUNCTION_MEMBER,
                    userType: PERMISSION_KEYS.FUNCTION_EDIT_PERMISSION,
                    userTypeDepend: record?.__codes
                  })}
                >
                  <Menu.Item
                    onClick={({ domEvent }) => {
                      domEvent.stopPropagation();
                      setRouteCache({
                        tableSelectedKey: getSelectedRowKeys(),
                        page: tableState.page,
                        filterRule: tableState.rule,
                        filterOrder: tableState.order
                      });
                      history.push(`/knowledge/function-auth?functionId=${record.id}&functionName=${record.name}`);
                    }}
                  >
                    {intl.get('exploreAnalysis.authorityManagement')}
                  </Menu.Item>
                </ContainerIsVisible>
              </Menu>
            }
          >
            <Format.Button onClick={event => event.stopPropagation()} className="kw-table-operate" type="icon">
              <EllipsisOutlined style={{ fontSize: 20 }} />
            </Format.Button>
          </Dropdown>
        );
      }
    },
    {
      title: intl.get('function.language'),
      dataIndex: 'language',
      ellipsis: true,
      width: 180
    },
    {
      title: intl.get('global.creator'),
      dataIndex: 'create_user',
      ellipsis: true,
      width: 220,
      render: (text: any, record: any) => {
        return (
          <div>
            <div>{text}</div>
            <div className="kw-c-subtext">{record?.create_email}</div>
          </div>
        );
      }
    },
    {
      title: intl.get('global.creationTime'),
      dataIndex: 'create_time',
      ellipsis: true,
      width: 220,
      sorter: true,
      sortOrder: getSortOrder('create_time'),
      sortDirections: ['ascend', 'descend', 'ascend']
    },
    {
      title: intl.get('global.finalOperator'),
      dataIndex: 'update_user',
      ellipsis: true,
      width: 220,
      render: (text: any, record: any) => {
        return (
          <div>
            <div>{text}</div>
            <div className="kw-c-subtext">{record?.update_email}</div>
          </div>
        );
      }
    },
    {
      title: intl.get('global.finalOperatorTime'),
      dataIndex: 'update_time',
      ellipsis: true,
      width: 220,
      sorter: true,
      sortOrder: getSortOrder('update_time'),
      sortDirections: ['ascend', 'descend', 'ascend']
    }
  ];

  return (
    <div className="functionTableRoot">
      <div className="kw-mb-4 kw-space-between">
        <div>
          <ContainerIsVisible
            placeholder={<span style={{ height: 32, display: 'inline-block' }} />}
            isVisible={HELPER.getAuthorByUserInfo({
              roleType: PERMISSION_CODES.ADF_KN_FUNCTION_CREATE,
              userType: PERMISSION_KEYS.KN_ADD_FUNCTION,
              userTypeDepend: kgData?.__codes
            })}
          >
            <Button type="primary" className="kw-mr-3" onClick={() => onChangeDrawer(true)}>
              <IconFont type="icon-Add" style={{ color: '#fff' }} />
              {intl.get('exploreAnalysis.create')}
            </Button>
          </ContainerIsVisible>
          <ContainerIsVisible
            isVisible={HELPER.getAuthorByUserInfo({
              roleType: PERMISSION_CODES.ADF_KN_FUNCTION_DELETE
            })}
          >
            <Button disabled={_.isEmpty(selectedRowKeys)} onClick={() => openDeleteModel()}>
              <IconFont type="icon-lajitong" />
              {intl.get('global.delete')}
            </Button>
          </ContainerIsVisible>
        </div>
        <div className="kw-align-center">
          <Format.Text className="kw-mr-2">{intl.get('function.language')}</Format.Text>
          <Select
            value={tableState?.name}
            className="functionName kw-mr-3"
            onChange={e => onChangeState({ page: 1, name: e })}
          >
            <Select.Option value="nGQL" key="nGQL">
              nGQL
            </Select.Option>
          </Select>
          <SearchInput
            placeholder={intl.get('function.searchFunction')}
            debounce
            onChange={searchFunction}
          ></SearchInput>
          <Dropdown
            className="dropdown kw-pointer"
            overlay={menuRule}
            trigger={['click']}
            placement="bottomRight"
            getPopupContainer={triggerNode => triggerNode.parentElement!}
          >
            <Format.Button className="kw-ml-3 functionTableRoot-sort-btn" type="icon">
              <IconFont type="icon-paixu11" />
            </Format.Button>
          </Dropdown>
          <Format.Button type="icon" tip={intl.get('global.refresh')} onClick={refreshTable}>
            <IconFont type="icon-tongyishuaxin" />
          </Format.Button>
        </div>
      </div>
      <ADTable
        lastColWidth={170}
        showHeader={false}
        dataSource={tableData}
        columns={columns}
        rowSelection={rowSelection}
        rowKey={record => record?.id}
        onChange={sortOrderChange}
        scroll={{ x: '100%' }}
        pagination={{
          total: tableState?.total,
          current: tableState?.page,
          pageSize: 10,
          showTitle: false,
          showSizeChanger: false,
          onChange: page => onChangeState({ page })
        }}
        emptyImage={!tableState?.search ? emptyImg : noResImg}
        emptyText={
          !tableState?.search ? (
            <ContainerIsVisible
              placeholder={<div className="kw-c-text">{intl.get('graphList.noContent')}</div>}
              isVisible={HELPER.getAuthorByUserInfo({
                roleType: PERMISSION_CODES.ADF_KN_FUNCTION_CREATE,
                userType: PERMISSION_KEYS.KN_ADD_FUNCTION,
                userTypeDepend: kgData?.__codes
              })}
            >
              <div>
                {intl.get('function.emptyTip').split('|')[0]}
                <span className="kw-c-primary kw-pointer" onClick={() => onChangeDrawer(true)}>
                  {intl.get('function.emptyTip').split('|')[1]}
                </span>
                {intl.get('function.emptyTip').split('|')[2]}
              </div>
            </ContainerIsVisible>
          ) : (
            intl.get('global.noResult')
          )
        }
      />

      {/* 删除二次确认弹窗 */}
      <TipModal
        visible={deleteVisible}
        closable={false}
        title={intl.get('function.deleteFunTitle')}
        content={intl.get('function.deleteFunTip')}
        onCancel={() => oncancelDelete()}
        onOk={() => deleteFunction()}
      />
    </div>
  );
};

export default FunctionTable;
