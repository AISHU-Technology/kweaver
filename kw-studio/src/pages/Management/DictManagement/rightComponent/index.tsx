import _ from 'lodash';
import intl from 'react-intl-universal';
import React, { useEffect, useRef, useState } from 'react';

import Format from '@/components/Format';
import KwTable from '@/components/KwTable';
import HOOKS from '@/hooks';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import { tipModalFunc } from '@/components/TipModal';
import { ReloadOutlined } from '@ant-design/icons';
import servicesEventStats, { deleteDictItemDataType, getDictListItemDataType } from '@/services/eventStats';
import CreateOrEditDictModal, { CreateOrEditDictDataType, DICT_MODAL_TYPE } from '../CreateOrEditDictModal';
import AddContent from '@/assets/images/create.svg';
import NoDataBox from '@/components/NoDataBox';
import HELPER from '@/utils/helper';

import './style.less';

export interface DictManagerRightCompProps {
  leftInfo: Record<string, any> | undefined;
  setRightToLeftInfo: Function;
}

const DictManagerRightComp = (props: DictManagerRightCompProps) => {
  // 分页 Page
  const reqPageSize = 10;

  // component props
  const { leftInfo, setRightToLeftInfo } = props;

  // 当前的语言
  const language = HOOKS.useLanguage();

  // 是否显示新建、编辑弹窗
  const [dictModalVisible, setDictModalVisible] = useState<boolean>(false);

  // createOrEditModal dict init data
  const [dictInitData, setDictInitData] = useState<CreateOrEditDictDataType | undefined>();

  // table source data
  const [tableData, setTableData] = useState<any>([]);

  // compared record
  const [comparedData, setComparedData] = useState<any[]>([]);

  // 分页 total
  const [paginationTotal, setPaginationTotal] = useState<number>();

  // 分页 current
  const [paginationCurrent, setPaginationCurrent] = useState<number>(1);

  // 搜索框Ref
  const searchInputRef = useRef<any>(null);

  // 描述ref
  const textRef = useRef<HTMLDivElement>(null);

  // 是否显示更多按钮
  const [showMoreBtn, setShowMoreBtn] = useState<boolean>(false);

  // css描述,是否多行显示
  const [descOneLine, setDescOneLine] = useState<boolean>(true);

  useEffect(() => {
    if (leftInfo) {
      setShowMoreBtn(
        HELPER.getLengthFromString(
          leftInfo?.remark === '' ? intl.get('dictManagement.rightComponent.no_desc') : leftInfo?.remark,
          14
        ) > (textRef.current?.offsetWidth || 0)
      );
      searchInputRef.current && searchInputRef.current?.setValue('');
      fetchTableData(paginationCurrent);
    }
  }, [leftInfo]);

  useEffect(() => {
    if (leftInfo) {
      fetchTableData(paginationCurrent, searchInputRef.current?.input?.value);
    }
  }, [paginationCurrent]);

  const columns: any = [
    {
      title: intl.get('dictManagement.rightComponent.value_tb_valueName'),
      ellipsis: true,
      width: 300,
      render: (_: any, record: any) => {
        return (
          <div className="admin-dictManagement-rightComponent-table-vn">
            {language === 'en-US' ? record.eName : record.cName}
          </div>
        );
      }
    },
    {
      title: intl.get('dictManagement.rightComponent.value_tb_value'),
      dataIndex: 'itemValue',
      ellipsis: true,
      width: 300
    },
    {
      title: intl.get('dictManagement.rightComponent.value_tb_valueDesc'),
      dataIndex: 'remark',
      ellipsis: true,
      width: 300,
      render: (_: any, record: any) => {
        return (
          <div
            className={
              record.remark === ''
                ? 'admin-dictManagement-rightComponent-table-vd-empty'
                : 'admin-dictManagement-rightComponent-table-vd'
            }
          >
            {record.remark === '' ? intl.get('dictManagement.rightComponent.no_desc') : record.remark}
          </div>
        );
      }
    },
    {
      title: intl.get('dictManagement.rightComponent.value_tb_op'),
      dataIndex: 'operation',
      fixed: 'right',
      ellipsis: true,
      width: 300,
      render: (_: any, record: any) => {
        return (
          <div style={{ display: 'flex' }}>
            <Format.Button
              className="admin-dictManagement-rightComponent-edit-btn admin-dictManagement-rightComponent-btn"
              type="icon"
              onClick={() => onEditRecord(record)}
            >
              {intl.get('dictManagement.rightComponent.value_tb_op_edit')}
            </Format.Button>
            <Format.Button
              type="icon"
              className="admin-dictManagement-rightComponent-btn"
              onClick={() => onDeleteRecord(record)}
            >
              {intl.get('dictManagement.rightComponent.value_tb_op_delete')}
            </Format.Button>
          </div>
        );
      }
    }
  ];

  const fetchTableData = async (currentPage: number, searchName?: string) => {
    const fetchDataParam: getDictListItemDataType = {
      page: currentPage,
      size: reqPageSize,
      fieldType: 1,
      fieldValue: leftInfo?.id,
      key: searchName
    };
    const result = (await servicesEventStats.getDictListItem(fetchDataParam)) || {};
    if (result.res) {
      setPaginationTotal(result.res.total);
      setTableData(result.res.data);
    }
  };

  // searchInput变化(防抖1s)
  const searchInputValueChanged = _.debounce(e => {
    if (paginationCurrent === 1) {
      fetchTableData(paginationCurrent, e.target.value);
    } else {
      searchInputRef.current && searchInputRef.current?.setValue(e.target.value);
      setPaginationCurrent(1);
    }
  }, 1000);

  const refreshSearch = () => {
    if (paginationCurrent === 1) {
      searchInputRef.current && searchInputRef.current?.setValue('');
      fetchTableData(paginationCurrent);
    } else {
      searchInputRef.current && searchInputRef.current?.setValue('');
      setPaginationCurrent(1);
    }
  };

  const onChangePagination = (current: number) => {
    setPaginationCurrent(current);
  };

  const onEditRecord = (record: any) => {
    const dictData: CreateOrEditDictDataType = {
      dictId: leftInfo?.id,
      id: record.id,
      cName: record.cName,
      eName: record.eName,
      dictType: record.dictType,
      remark: record.remark,
      itemValue: record.itemValue
    };
    setComparedData(tableData.filter((item: any) => item.id !== record.id));
    setDictInitData(dictData);
    setDictModalVisible(true);
  };

  const onDeleteRecord = async (record: any) => {
    const title = intl.get('dictManagement.waringMsg.deleteValueTitle');
    const content = intl.get('dictManagement.waringMsg.deleteValueContent');
    const chooseOk = await tipModalFunc({ title, content, closable: true });

    if (!chooseOk) return;

    const deleteData: deleteDictItemDataType = {
      ids: [record.id]
    };
    const result = (await servicesEventStats.deleteDictItem(deleteData)) || {};
    if (result.res) {
      if (paginationCurrent === 1) {
        fetchTableData(paginationCurrent, searchInputRef.current?.input?.value);
      } else {
        setPaginationCurrent(1);
      }
    }
  };

  const addBtnClick = () => {
    const dictData: CreateOrEditDictDataType = {
      dictId: leftInfo?.id,
      cName: '',
      eName: '',
      remark: ''
    };
    setComparedData(tableData);
    setDictInitData(dictData);
    setDictModalVisible(true);
  };

  const closeDictModal = (type: DICT_MODAL_TYPE | undefined) => {
    if (type === DICT_MODAL_TYPE.DICT_VALUE) {
      fetchTableData(paginationCurrent);
    }
    setDictModalVisible(false);
  };

  const onClickedMoreBtn = () => {
    setDescOneLine(!descOneLine);
  };

  return leftInfo?.id ? (
    <div className="admin-dictManagement-rightComponent-content">
      <div className="admin-dictManagement-rightComponent-title-bar">
        <div
          className="admin-dictManagement-rightComponent-title"
          title={language === 'en-US' ? leftInfo?.eName : leftInfo?.cName}
        >
          {language === 'en-US' ? leftInfo?.eName : leftInfo?.cName}
        </div>
        <div className="admin-dictManagement-rightComponent-title-op" style={{ display: 'flex' }}>
          <Format.Button
            className={'admin-dictManagement-rightComponent-title-op-edit'}
            type="icon"
            onClick={() => setRightToLeftInfo({ ...leftInfo, op_type: 'edit' })}
          >
            <IconFont type="icon-edit" />
            <div className="admin-dictManagement-rightComponent-title-op-edit-title">
              {intl.get('dictManagement.rightComponent.header_op_edit')}
            </div>
          </Format.Button>
          <Format.Button
            className={'admin-dictManagement-rightComponent-title-op-delete'}
            type="icon"
            onClick={() => setRightToLeftInfo({ ...leftInfo, op_type: 'delete' })}
          >
            <IconFont type="icon-lajitong" />
            <div className="admin-dictManagement-rightComponent-title-op-delete-title">
              {intl.get('dictManagement.rightComponent.header_op_delete')}
            </div>
          </Format.Button>
        </div>
      </div>

      <div className="admin-dictManagement-rightComponent-operation-area">
        <div className="admin-dictManagement-rightComponent-basicInfo">
          {intl.get('dictManagement.rightComponent.basicInfo_title')}
        </div>

        <div className="admin-dictManagement-rightComponent-type">
          <div
            className={
              language === 'en-US'
                ? 'admin-dictManagement-rightComponent-type-title-e'
                : 'admin-dictManagement-rightComponent-type-title'
            }
          >
            {intl.get('dictManagement.rightComponent.basicInfo_dictType')}
          </div>
          <div className="admin-dictManagement-rightComponent-type-info" title={leftInfo?.dictType}>
            {leftInfo?.dictType}
          </div>
        </div>

        <div
          className={
            descOneLine ? 'admin-dictManagement-rightComponent-desc' : 'admin-dictManagement-rightComponent-desc-more'
          }
        >
          <span
            className={
              language === 'en-US'
                ? 'admin-dictManagement-rightComponent-desc-title-e'
                : 'admin-dictManagement-rightComponent-desc-title'
            }
          >
            {intl.get('dictManagement.rightComponent.basicInfo_desc')}
          </span>
          <span
            ref={textRef}
            className={
              leftInfo.remark === ''
                ? 'admin-dictManagement-rightComponent-desc-info-empty'
                : descOneLine
                ? 'admin-dictManagement-rightComponent-desc-info'
                : 'admin-dictManagement-rightComponent-desc-info-more'
            }
          >
            {leftInfo?.remark === '' ? intl.get('dictManagement.rightComponent.no_desc') : leftInfo?.remark}
          </span>
          {showMoreBtn ? (
            <Format.Button
              className={
                descOneLine
                  ? 'admin-dictManagement-rightComponent-moreBtn'
                  : 'admin-dictManagement-rightComponent-moreBtn-collapse'
              }
              type="icon"
              onClick={() => onClickedMoreBtn()}
            >
              {descOneLine
                ? intl.get('dictManagement.rightComponent.basicInfo_more')
                : intl.get('dictManagement.rightComponent.basicInfo_less')}
            </Format.Button>
          ) : undefined}
        </div>

        <div className="admin-dictManagement-rightComponent-value">
          {intl.get('dictManagement.rightComponent.value_title')}
        </div>

        <div className="admin-dictManagement-rightComponent-operation-btn">
          <Format.Button
            type="primary"
            className="admin-dictManagement-rightComponent-operation-add-btn"
            onClick={addBtnClick}
          >
            <IconFont type="icon-Add" style={{ color: '#fff' }} />
            {intl.get('dictManagement.rightComponent.value_op_add')}
          </Format.Button>

          <div className="admin-dictManagement-rightComponent-operation-right-area">
            <SearchInput
              ref={searchInputRef}
              className="admin-dictManagement-rightComponent-operation-right-searchInput"
              placeholder={intl.get('dictManagement.rightComponent.value_searchPlaceHold')}
              onChange={(e: any) => {
                e.persist();
                searchInputValueChanged(e);
              }}
            ></SearchInput>
            <Format.Button type="icon" onClick={refreshSearch}>
              <ReloadOutlined />
            </Format.Button>
          </div>
        </div>
      </div>

      <KwTable
        className="admin-dictManagement-rightComponent-table"
        showHeader={false}
        columns={columns}
        dataSource={tableData}
        rowKey={record => record.id}
        showFilter={false}
        pagination={{
          current: paginationCurrent,
          total: paginationTotal,
          pageSize: reqPageSize,
          onChange: onChangePagination,
          position: ['bottomRight'],
          showSizeChanger: false,
          hideOnSinglePage: true
        }}
        locale={{
          emptyText: searchInputRef.current?.input?.value ? (
            <NoDataBox imgSrc={require('@/assets/images/empty.svg').default} desc={intl.get('global.noData')} />
          ) : (
            <div className="admin-dictManagement-rightComponent-table-noResult">
              <img src={AddContent} alt="nodata" />
              <div>
                {intl.get('dictManagement.addTitle')}
                <span
                  className="create-span"
                  onClick={() => {
                    addBtnClick();
                  }}
                >
                  {intl.get('dictManagement.btnValueDescTitle')}
                </span>
                {intl.get('dictManagement.addValueDesc')}
              </div>
            </div>
          )
        }}
      />
      {dictModalVisible && (
        <CreateOrEditDictModal
          dictModalType={DICT_MODAL_TYPE.DICT_VALUE}
          comparedData={comparedData}
          createOrEditDictInitData={dictInitData}
          resModalVisible={dictModalVisible}
          closeResModal={closeDictModal}
        />
      )}
    </div>
  ) : (
    <div>
      <NoDataBox
        style={{ marginTop: 280 }}
        imgSrc={require('@/assets/images/clickView.svg').default}
        desc={intl.get('dictManagement.rightComponent.clickToView')}
      />
    </div>
  );
};

export default DictManagerRightComp;
