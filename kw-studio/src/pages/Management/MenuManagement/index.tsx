import _ from 'lodash';
import intl from 'react-intl-universal';
import React, { useEffect, useRef, useState } from 'react';

import HOOKS from '@/hooks';
import Format from '@/components/Format';
import KwTable from '@/components/KwTable';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import { tipModalFunc } from '@/components/TipModal';
import { DownOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';
import servicesEventStats, { listMenuDataType, delMenuDataType } from '@/services/eventStats';

import './style.less';
import MenuOrButtonCreateOrEditModal, { MENU_TYPE, INT_BOOLEAN, CreateOrEditDataType } from './CreateOrEditModal';

// MENU BUTTON API
export enum RESOURCE_TYPE {
  MENU = 1,
  BUTTON_API = 2,
  ALL = 3,
  MENU_BUTTON = 4,
  API = 5
}

// 后端接口数据（isMenu 1：菜单 2：非菜单，assign：1：菜单和按钮，2：接口）
export const convertSourceDataToTableData = (convertField: CONVERT_FIELD, value: number) => {
  switch (convertField) {
    case CONVERT_FIELD.CONVERT_BOOL:
      switch (value) {
        case 0:
          return intl.get('adminManagement.newManagement.createOrEditModal.yes');
        case 1:
          return intl.get('adminManagement.newManagement.createOrEditModal.no');
        default:
          break;
      }
      break;
    case CONVERT_FIELD.CONVERT_TYPE:
      switch (value) {
        case 1:
          return intl.get('adminManagement.newManagement.createOrEditModal.menu');
        case 2:
          return intl.get('adminManagement.newManagement.createOrEditModal.button');
        default:
          break;
      }
      break;
    case CONVERT_FIELD.CONVERT_DOMAIN_TYPE:
      switch (value) {
        case 0:
          return intl.get('adminManagement.newManagement.createOrEditModal.domainTypeAll');
        case 1:
          return intl.get('adminManagement.newManagement.createOrEditModal.domainTypeSys');
        case 2:
          return intl.get('adminManagement.newManagement.createOrEditModal.domainTypeBus');
        default:
          break;
      }
      break;
    default:
      break;
  }
};

// convert source data int to table data string
export enum CONVERT_FIELD {
  CONVERT_TYPE = 'type',
  CONVERT_BOOL = 'bool',
  CONVERT_DOMAIN_TYPE = 'domainType'
}

const MenuManagement = () => {
  const reqPage = 1;
  const reqSize = -1;
  const reqIsTree = 1;
  const rootPID = '0';
  const defaultSort = 0;

  // 当前的语言
  const language = HOOKS.useLanguage();

  // 是否显示创建资源弹窗
  const [createResourceModalVisible, setCreateResourceModalVisible] = useState<boolean>(false);

  // createOrEditModal menu or button init data
  const [menuOrButtonInitData, setMenuOrButtonInitData] = useState<CreateOrEditDataType | undefined>();

  // table source data
  const [tableData, setTableData] = useState<any>([]);

  // compared record
  const [comparedData, setComparedData] = useState<any[]>([]);

  // 展开项
  const [tableExpandKeys, setTableExpandKeys] = useState<string[]>([]);

  // 编辑菜单时，被编辑菜单所属的根目录id
  const [optionalRootId, setOptionalRootId] = useState<string | undefined>(undefined);

  // 搜索框Ref
  const searchInputRef = useRef<any>(null);

  const unDeleteCode = [
    'adf-kn',
    'adf-model-factory',
    'adf-app',
    'adf-management',
    'adf-management-menu',
    'adf-menu-view',
    'adf-menu-add',
    'adf-menu-update',
    'adf-menu-delete',
    'adf-management-resource',
    'adf-interface-view',
    'adf-interface-add',
    'adf-interface-update',
    'adf-interface-delete'
  ];

  useEffect(() => {
    // 请求table显示的数据列表
    fetchTableData();
  }, []);

  useEffect(() => {
    if (searchInputRef.current?.input?.value) {
      setTableExpandKeys(getValuesFromTree(tableData, 'code'));
    } else {
      setTableExpandKeys([]);
    }
  }, [tableData]);

  // 处理空的children数组
  const handlingEmptyChildren = (fetchedData: any) => {
    if (!fetchedData.children.length) {
      // 空children数组，会导致没有子项也会有展开标志
      fetchedData.children = null;
      return;
    }
    fetchedData.children.forEach((item: any) => {
      handlingEmptyChildren(item);
    });
  };

  const getValuesFromTree = (sourceData: any[], targetField: string): any[] => {
    const result: any[] = [];
    const traverse = (node: any) => {
      result.push(node[targetField]);

      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };
    for (const node of sourceData) {
      traverse(node);
    }
    return result;
  };

  const generateComparedData = (comparedData: any, resultArr: any[], permission_id?: number) => {
    if (permission_id !== comparedData.id) {
      resultArr.push({
        code: comparedData.code,
        name: comparedData.name,
        desc: comparedData.desc,
        content: comparedData.content
      });
    }
    if (!comparedData.children) return;

    comparedData.children.forEach((item: any) => {
      generateComparedData(item, resultArr, permission_id);
    });
  };

  // 计算编辑菜单时，被编辑的菜单所属的根目录的id
  const calculateOptionalRootId = (record: any) => {
    // 前置条件：编辑、菜单
    if (record.isMenu !== INT_BOOLEAN.TRUE) return;
    // 正常条件：业务类查找所属模块的根目录id
    const findRootNodeId = (tree: any[], targetId: string): string | undefined => {
      for (const node of tree) {
        const resultId = node.id;
        if (node.id === targetId) {
          return resultId;
        }
        if (node.children) {
          const result = findRootNodeId(node.children, targetId);
          if (result) {
            return resultId;
          }
        }
      }
      return undefined;
    };
    setOptionalRootId(findRootNodeId(tableData, record.id));
  };

  const fetchTableData = async (searchName?: string) => {
    const fetchDataParam: listMenuDataType = {
      pid: '0',
      isTree: reqIsTree,
      menuType: MENU_TYPE.ALL,
      key: searchName,
      page: reqPage,
      size: reqSize
    };
    const result = (await servicesEventStats.newMenuList(fetchDataParam)) || {};
    if (result.res) {
      result.res.data.forEach((item: any) => {
        handlingEmptyChildren(item);
      });
      setTableData(result.res.data);
    }
  };

  const staticColumns: any = [
    {
      title: intl.get('adminManagement.newManagement.code'),
      dataIndex: 'code',
      ellipsis: true,
      width: 253
    },
    {
      title: intl.get('adminManagement.newManagement.type'),
      dataIndex: 'menuType',
      ellipsis: true,
      width: 150,
      render: (_: any, record: any) => {
        return <div>{convertSourceDataToTableData(CONVERT_FIELD.CONVERT_DOMAIN_TYPE, record.menuType)}</div>;
      }
    },
    {
      title: intl.get('adminManagement.newManagement.interfaceElements'),
      dataIndex: 'isMenu',
      ellipsis: true,
      width: 150,
      render: (_: any, record: any) => {
        return (
          <div>{convertSourceDataToTableData(CONVERT_FIELD.CONVERT_TYPE, record.isMenu === undefined ? 1 : 2)}</div>
        );
      }
    },
    {
      title: intl.get('adminManagement.newManagement.route'),
      dataIndex: 'path',
      ellipsis: true,
      width: 197,
      render: (_: any, record: any) => {
        return (
          <div className="admin-menuManagement-table-column-route">{record.path === '' ? '- -' : record.path}</div>
        );
      }
    },
    {
      title: intl.get('adminManagement.newManagement.component'),
      dataIndex: 'component',
      ellipsis: true,
      width: 197,
      render: (_: any, record: any) => {
        return (
          <div className="admin-menuManagement-table-column-route">
            {record.component === '' ? '- -' : record.component}
          </div>
        );
      }
    },
    {
      title: intl.get('adminManagement.newManagement.sort'),
      dataIndex: 'sortOrder',
      ellipsis: true,
      width: 150,
      render: (_: any, record: any) => {
        return <div>{record.isMenu === INT_BOOLEAN.FALSE ? '- -' : record.sortOrder}</div>;
      }
    },
    {
      title: intl.get('adminManagement.newManagement.visible'),
      dataIndex: 'visible',
      ellipsis: true,
      width: 150,
      render: (_: any, record: any) => {
        return <div>{convertSourceDataToTableData(CONVERT_FIELD.CONVERT_BOOL, record.visible)}</div>;
      }
    },
    {
      title: intl.get('adminManagement.newManagement.operation'),
      dataIndex: 'operation',
      fixed: 'right',
      ellipsis: true,
      width: 296,
      render: (_: any, record: any) => {
        return (
          <div style={{ display: 'flex' }}>
            <Format.Button
              className={
                unDeleteCode.includes(record.code)
                  ? 'admin-operation-btn-edit-disable admin-operation-btn'
                  : 'admin-operation-edit-btn admin-operation-btn'
              }
              type="icon"
              onClick={() => onEditRecord(record)}
              // disabled={unDeleteCode.includes(record.code)}
            >
              {intl.get('adminManagement.newManagement.edit')}
            </Format.Button>
            <Format.Button
              className={
                unDeleteCode.includes(record.code)
                  ? 'admin-operation-btn-delete-disable admin-operation-btn'
                  : 'admin-operation-btn'
              }
              type="icon"
              onClick={() => onDeleteRecord(record)}
              disabled={unDeleteCode.includes(record.code)}
            >
              {intl.get('adminManagement.newManagement.delete')}
            </Format.Button>
          </div>
        );
      }
    }
  ];

  const dynamicColumns: any = (language: string) => {
    return language === 'en-US'
      ? [
          {
            title: intl.get('adminManagement.newManagement.eName'),
            dataIndex: 'eName',
            ellipsis: true,
            width: 248
          },
          {
            title: intl.get('adminManagement.newManagement.cName'),
            dataIndex: 'cName',
            ellipsis: true,
            width: 216
          }
        ]
      : [
          {
            title: intl.get('adminManagement.newManagement.cName'),
            dataIndex: 'cName',
            ellipsis: true,
            width: 216
          },
          {
            title: intl.get('adminManagement.newManagement.eName'),
            dataIndex: 'eName',
            ellipsis: true,
            width: 248
          }
        ];
  };

  const showCreateResourceModal = () => {
    setOptionalRootId(undefined);

    const comparedArr: any[] = [];
    tableData.forEach((item: any) => {
      generateComparedData(item, comparedArr);
    });
    setComparedData(comparedArr);

    const menuOrButtonInitData: CreateOrEditDataType = {
      menuType: MENU_TYPE.MENU, // 界面元素
      pid: rootPID, // 父资源
      icon: '', // 常规图标
      selectedIcon: '', // 选中图标
      cName: '', // 中文资源名
      eName: '', // 英文资源名
      code: '', // 资源编码
      sortOrder: defaultSort, // 排序
      path: '', // 路由
      visible: INT_BOOLEAN.TRUE // 是否显示
    };
    setMenuOrButtonInitData(menuOrButtonInitData);
    setCreateResourceModalVisible(true);
  };

  const closeCreateResourceModal = (needRefresh?: boolean) => {
    if (needRefresh) {
      fetchTableData(searchInputRef.current?.input?.value);
    }
    setCreateResourceModalVisible(false);
  };

  // searchInput变化(防抖1s)
  const searchInputValueChanged = _.debounce(e => {
    fetchTableData(e.target.value);
  }, 1000);

  const refreshSearch = () => {
    searchInputRef.current && searchInputRef.current?.setValue('');
    fetchTableData();
  };

  const onEditRecord = (record: any) => {
    calculateOptionalRootId(record);

    const comparedArr: any[] = [];
    tableData.forEach((item: any) => {
      generateComparedData(item, comparedArr, record.id);
    });
    setComparedData(comparedArr);

    const menuOrButtonInitData: CreateOrEditDataType = {
      id: record.id,
      menuType: record.isMenu === undefined ? 1 : 2, // 界面元素
      pid: record.pid ? record.pid : rootPID, // 父资源
      icon: record.icon, // 常规图标
      selectedIcon: record.selectedIcon, // 选中图标
      cName: record.cName, // 中文资源名
      eName: record.eName, // 英文资源名
      code: record.code, // 资源编码
      sortOrder: record.sortOrder, // 排序
      path: record.path, // 路由
      component: record.component, // 组件路径
      visible: record.visible // 是否显示
    };
    setMenuOrButtonInitData(menuOrButtonInitData);
    setCreateResourceModalVisible(true);
  };

  const onDeleteRecord = async (record: any) => {
    const menuOrBtn =
      record.isMenu === INT_BOOLEAN.TRUE
        ? intl.get('adminManagement.newManagement.createOrEditModal.menu')
        : intl.get('adminManagement.newManagement.createOrEditModal.button');

    const title = intl.get('adminManagement.newManagement.deleteTipTitle', {
      content: menuOrBtn
    });
    const content =
      record.isMenu === INT_BOOLEAN.TRUE
        ? intl.get('adminManagement.newManagement.deleteMenuTipDesc')
        : intl.get('adminManagement.newManagement.deleteBtnTipDesc');
    const chooseOk = await tipModalFunc({ title, content, closable: true });

    if (!chooseOk) return;

    const deleteData: delMenuDataType = {
      ids: [record.id]
    };
    const result = (await servicesEventStats.newMenuDelete(deleteData)) || {};
    if (result.res) {
      fetchTableData(searchInputRef.current?.input?.value);
    }
  };

  return (
    <div className="admin-menuManagement">
      <div className="admin-menuManagement-title">{intl.get('adminManagement.menuManagement')}</div>
      <div className="admin-menuManagement-operation-area">
        <Format.Button
          type="primary"
          className="admin-menuManagement-operation-add-btn"
          onClick={showCreateResourceModal}
        >
          <IconFont type="icon-Add" style={{ color: '#fff' }} />
          {intl.get('adminManagement.newManagement.new')}
        </Format.Button>
        <div className="admin-menuManagement-operation-right-area">
          <SearchInput
            ref={searchInputRef}
            className="admin-menuManagement-operation-right-searchInput"
            placeholder={intl.get('adminManagement.newManagement.search')}
            onChange={(e: any) => {
              e.persist();
              searchInputValueChanged(e);
            }}
          />
          <Format.Button type="icon" onClick={refreshSearch}>
            <ReloadOutlined />
          </Format.Button>
        </div>
      </div>
      <KwTable
        className="admin-menuManagement-table"
        showHeader={false}
        columns={[...dynamicColumns(language), ...staticColumns]}
        dataSource={tableData}
        rowKey={record => record.code} // 增加rowKey解决点击展开按钮会展开所有展开项的问题
        showFilter={false}
        pagination={false}
        expandable={{
          expandIcon: ({ expanded, onExpand, record }) =>
            expanded ? (
              record.children === null ? (
                <span style={{ marginRight: 19 }}></span>
              ) : (
                <DownOutlined style={{ fontSize: 11, marginRight: 8 }} onClick={e => onExpand(record, e)} />
              )
            ) : record.children === null ? (
              <span style={{ marginRight: 19 }}></span>
            ) : (
              <RightOutlined style={{ fontSize: 11, marginRight: 8 }} onClick={e => onExpand(record, e)} />
            ),
          expandedRowKeys: tableExpandKeys,
          onExpand: (expanded, record) => {
            if (expanded) {
              // 增加
              tableExpandKeys
                ? setTableExpandKeys([...tableExpandKeys, record.code])
                : setTableExpandKeys([record.code]);
            } else {
              // 删除
              setTableExpandKeys(tableExpandKeys?.filter(item => item !== record.code));
            }
          }
        }}
      />
      {createResourceModalVisible && (
        <MenuOrButtonCreateOrEditModal
          initData={menuOrButtonInitData}
          resModalVisible={createResourceModalVisible}
          closeResModal={closeCreateResourceModal}
          comparedData={comparedData}
          optionalRootId={optionalRootId}
        ></MenuOrButtonCreateOrEditModal>
      )}
    </div>
  );
};

export default MenuManagement;
