import _ from 'lodash';
import { Dropdown, Menu, Table } from 'antd';
import intl from 'react-intl-universal';
import React, { useEffect, useRef, useState } from 'react';
import SearchInput from '@/components/SearchInput';
import Format from '@/components/Format';
import HOOKS from '@/hooks';
import { EllipsisOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { tipModalFunc } from '@/components/TipModal';
import CreateOrEditDictModal, { CreateOrEditDictDataType, DICT_MODAL_TYPE } from '../CreateOrEditDictModal';
import servicesEventStats, { deleteDictDataType } from '@/services/eventStats';
import NoDataBox from '@/components/NoDataBox';

import './style.less';

export interface DictManagerLeftCompProps {
  leftTableData: any;
  rightToLeftInfo: any;
  fetchDictListData: Function;
  setLeftToRightInfo: Function;
}

const DictManagerLeftComp = (props: DictManagerLeftCompProps) => {
  // component props
  const { leftTableData, fetchDictListData, setLeftToRightInfo, rightToLeftInfo } = props;

  // 搜索框Ref
  const searchInputRef = useRef<any>(null);

  // 当前的语言
  const language = HOOKS.useLanguage();

  // 是否显示新建、编辑弹窗
  const [dictModalVisible, setDictModalVisible] = useState<boolean>(false);

  // createOrEditModal dict init data
  const [dictInitData, setDictInitData] = useState<CreateOrEditDictDataType | undefined>();

  // compared record
  const [comparedData, setComparedData] = useState<any[]>([]);

  // 选中行
  const [rowSelect, setRowSelect] = useState<Record<string, any>>();

  // 移入行
  const [rowMouseEnter, setRowMouseEnter] = useState<Record<string, any>>();

  useEffect(() => {
    setRowSelect({});
  }, [leftTableData]);

  useEffect(() => {
    if (rightToLeftInfo?.op_type === 'edit') {
      onClickEdit(rightToLeftInfo);
    } else if (rightToLeftInfo?.op_type === 'delete') {
      onClickDelete(rightToLeftInfo);
    }
  }, [rightToLeftInfo]);

  // searchInput 防抖
  const searchInputValueChanged = _.debounce(e => {
    fetchDictListData(e.target.value);
  }, 1000);

  const refreshBtnClick = () => {
    searchInputRef.current && searchInputRef.current?.setValue('');
    fetchDictListData();
  };

  const addBtnClick = () => {
    const dictData: CreateOrEditDictDataType = {
      cName: '',
      eName: '',
      remark: ''
    };
    setComparedData(leftTableData);
    setDictInitData(dictData);
    setDictModalVisible(true);
  };

  const closeDictModal = (type: DICT_MODAL_TYPE | undefined) => {
    if (type === DICT_MODAL_TYPE.DICT_TYPE) {
      fetchDictListData();
    }
    setDictModalVisible(false);
  };

  const onClickEdit = (record: any) => {
    const dictData: CreateOrEditDictDataType = {
      id: record.id,
      cName: record.cName,
      eName: record.eName,
      dictType: record.dictType,
      remark: record.remark
    };
    setComparedData(leftTableData.filter((item: any) => item.id !== record.id));
    setDictInitData(dictData);
    setDictModalVisible(true);
  };

  const onClickDelete = async (record: any) => {
    const title = intl.get('dictManagement.waringMsg.deleteTypeTitle');
    const content = intl.get('dictManagement.waringMsg.deleteTypeContent');
    const chooseOk = await tipModalFunc({ title, content, closable: true });

    if (!chooseOk) return;

    const requestData: deleteDictDataType = {
      ids: [record.id]
    };
    const resData = await servicesEventStats.deleteDict(requestData);
    if (resData.res) {
      fetchDictListData();
    }
  };

  const columns: any = [
    {
      render: (_: string, record: any) => {
        return (
          <div className="left-name">
            <div className={'name ad-ellipsis'} title={language === 'en-US' ? record.eName : record.cName}>
              {language === 'en-US' ? record.eName : record.cName}
            </div>
            <div className="type ad-ellipsis" title={record.dictType}>
              {record.dictType}
            </div>
          </div>
        );
      },
      ellipsis: true,
      width: 184
    },
    {
      ellipsis: true,
      width: 56,
      render: (_: any, record: any) => {
        return rowSelect?.id === record.id || rowMouseEnter?.id === record.id ? (
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            overlay={
              <Menu>
                <Menu.Item key={`${record.id}-edit`} onClick={() => onClickEdit(record)}>
                  {intl.get('dictManagement.leftComponent.op_edit')}
                </Menu.Item>
                <Menu.Item key={`${record.id}-delete`} onClick={() => onClickDelete(record)}>
                  {intl.get('dictManagement.leftComponent.op_delete')}
                </Menu.Item>
              </Menu>
            }
          >
            <Format.Button onClick={event => event.stopPropagation()} className="operate" type="icon">
              <EllipsisOutlined style={{ fontSize: 16 }} />
            </Format.Button>
          </Dropdown>
        ) : undefined;
      }
    }
  ];

  return (
    <div className="admin-dictManagement-leftComponent-content">
      <SearchInput
        className="admin-dictManagement-leftComponent-content-searchInput"
        ref={searchInputRef}
        placeholder={intl.get('dictManagement.leftComponent.searchPlaceHold')}
        onChange={(e: any) => {
          e.persist();
          searchInputValueChanged(e);
        }}
      ></SearchInput>
      <div className="admin-dictManagement-leftComponent-content-titleRefresh">
        <div className="admin-dictManagement-leftComponent-content-title">
          {intl.get('dictManagement.leftComponent.title')}
        </div>
        <Format.Button
          className="admin-dictManagement-leftComponent-content-refresh"
          type="icon"
          onClick={refreshBtnClick}
        >
          <ReloadOutlined />
        </Format.Button>
        <Format.Button className="admin-dictManagement-leftComponent-content-add" type="icon" onClick={addBtnClick}>
          <PlusOutlined />
        </Format.Button>
      </div>
      <div
        className="admin-dictManagement-leftComponent-content-table-content"
        style={{ height: 'calc(100% - 120px)', overflow: 'auto' }}
        // style={{ height: 'calc(100% - 120px)', overflow: 'auto', marginLeft: '24px', marginRight: '24px' }}
      >
        <Table
          className="admin-dictManagement-table"
          showHeader={false}
          columns={columns}
          dataSource={leftTableData}
          rowKey={record => record.id}
          rowClassName={record => {
            if (record.id === rowSelect?.id) {
              return 'admin-dictManagement-table-row';
            }
            return '';
          }}
          pagination={false}
          onRow={record => {
            return {
              onClick: () => {
                setRowSelect(record);
                setLeftToRightInfo(record);
              },
              onMouseEnter: () => {
                setRowMouseEnter(record);
              },
              onMouseLeave: () => {
                setRowMouseEnter({});
              }
            };
          }}
          locale={{
            emptyText: (
              <NoDataBox imgSrc={require('@/assets/images/empty.svg').default} desc={intl.get('global.noData')} />
            )
          }}
        />
      </div>
      {dictModalVisible && (
        <CreateOrEditDictModal
          dictModalType={DICT_MODAL_TYPE.DICT_TYPE}
          createOrEditDictInitData={dictInitData}
          comparedData={comparedData}
          resModalVisible={dictModalVisible}
          closeResModal={closeDictModal}
        />
      )}
    </div>
  );
};

export default DictManagerLeftComp;
