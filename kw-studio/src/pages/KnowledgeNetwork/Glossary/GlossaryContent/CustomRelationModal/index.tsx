import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, message, Table, Popconfirm, Tooltip } from 'antd';
import { ExclamationCircleFilled, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import _ from 'lodash';
import IconFont from '@/components/IconFont';
import DropdownInput, { DropdownInputRefProps } from '../DropdownInput';
import './style.less';
import intl from 'react-intl-universal';
import { editCustomRelation, getCustomRelationList } from '@/services/glossaryServices';
import { useGlossaryStore } from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';
import NoDataBox from '@/components/NoDataBox';
import UniversalModal from '@/components/UniversalModal';
import Format from '@/components/Format';

const CustomRelationModal = (props: any) => {
  const {
    glossaryStore: { glossaryData, customRelationList, mode },
    setGlossaryStore
  } = useGlossaryStore();
  const { closeCustomRelationModal } = props;
  const prefixLocale = 'glossary';
  const errorRef = useRef<string>('');
  const dropdownInputRef = useRef<DropdownInputRefProps | null>(null);
  const loading = useRef(false);
  useEffect(() => {
    if (customRelationList.length === 0 && mode === 'edit') {
      onAdd();
    }
    return () => {
      clearTempData();
    };
  }, []);

  const clearTempData = () => {
    setGlossaryStore(preStore => ({
      ...preStore,
      customRelationList: preStore.customRelationList.filter((item: any) => item.id !== 'temp')
    }));
  };

  /**
   * 添加一条新纪录
   */
  const handleAddNewRecord = () => {
    setGlossaryStore(preStore => ({
      ...preStore,
      customRelationList: [
        ...preStore.customRelationList,
        {
          id: 'temp',
          name: '',
          editing: true
        }
      ]
    }));
  };

  /** 添加 */
  const onAdd = () => {
    if (isEditing()) {
      const inputValue = dropdownInputRef.current!.getValue().trim();
      if (!inputValue) {
        dropdownInputRef.current?.setError(intl.get('glossary.notNull'));
        errorRef.current = intl.get('glossary.notNull');
        return;
      }
      const record = customRelationList.find(item => item.editing);
      onSave(dropdownInputRef.current!.getValue(), record, dropdownInputRef.current!.getError(), true);
      return;
    }
    if (!errorRef.current) {
      handleAddNewRecord();
    }
  };

  /** 保存 */
  const onSave = async (value: any, record: any, error: string, addNewRecord = false) => {
    const inputValue = value.trim();
    if (!inputValue) {
      dropdownInputRef.current?.setError(intl.get('glossary.notNull'));
      errorRef.current = intl.get('glossary.notNull');
      return;
    }
    if (!error) {
      errorRef.current = '';
      try {
        if (loading.current) return;
        loading.current = true;
        const data = await editCustomRelation(glossaryData!.id, {
          change_list: [
            {
              action: 'add',
              name: inputValue
            }
          ]
        });
        // eslint-disable-next-line require-atomic-updates
        loading.current = false;
        const addObj = data.res.new_ids;
        const newData = _.map(_.cloneDeep(customRelationList), item => {
          if (item.id === record.id) return { id: addObj[inputValue], name: inputValue, editing: false };
          return item;
        });
        setGlossaryStore(preStore => ({
          ...preStore,
          customRelationList: newData
        }));
        if (addNewRecord) {
          setTimeout(() => {
            handleAddNewRecord();
          }, 0);
        }
      } catch (error) {
        // eslint-disable-next-line require-atomic-updates
        loading.current = false;
        const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
        message.error(errorTip);
      }
    } else {
      errorRef.current = error;
    }
  };

  /** 删除 */
  const onDelete = async (key: any) => {
    try {
      if (key !== 'temp') {
        await editCustomRelation(glossaryData!.id, {
          change_list: [
            {
              action: 'remove',
              id: key
            }
          ]
        });
      }
      const data = _.filter(customRelationList, item => {
        if (item.id !== key) {
          return true;
        }
        if (item.editing) {
          errorRef.current = ''; // 删除掉正在编辑的行，将错误去除
        }
        return false;
      });
      setGlossaryStore(preStore => ({
        ...preStore,
        customRelationList: data
      }));
    } catch (error) {
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
    }
  };

  const isEditing = () => {
    const target = customRelationList.find(item => item.editing);
    if (target) {
      return true;
    }
    return false;
  };

  const columns: any = [
    {
      title: intl.get('glossary.customRelationName'),
      ellipsis: true,
      dataIndex: 'name',
      width: 420,
      render: (value: string, record: any) => {
        if (record.editing) {
          return (
            <DropdownInput
              ref={dropdownInputRef}
              existData={customRelationList.filter(item => !item.editing).map(item => item.name)}
              // onBlur={(value: any, error: any) => {
              //   const inputValue = value.trim();
              //   if (!inputValue) {
              //     dropdownInputRef.current?.setError(intl.get('glossary.notNull'));
              //     errorRef.current = intl.get('glossary.notNull');
              //   }
              // }}
            />
          );
        }
        return value;
      }
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'operation',
      render: (value: any, record: any) => {
        return record.id === 'temp' ? (
          <>
            <Format.Button
              title={intl.get('global.save')}
              type="icon"
              onClick={_.debounce(() => {
                onSave(dropdownInputRef.current!.getValue(), record, dropdownInputRef.current!.getError());
              }, 300)}
            >
              <CheckOutlined className="kw-c-primary" />
            </Format.Button>
            <Format.Button title={intl.get('global.cancel')} type="icon" onClick={() => onDelete(record.id)}>
              <CloseOutlined />
            </Format.Button>
          </>
        ) : (
          <Popconfirm
            title={intl.get('global.deletePopConfirmTitle')}
            okText={intl.get('global.ok')}
            cancelText={intl.get('global.cancel')}
            onConfirm={() => onDelete(record.id)}
            okButtonProps={{ size: 'small', style: { minWidth: 'unset' } }}
            cancelButtonProps={{ size: 'small', style: { minWidth: 'unset' } }}
            placement="bottomRight"
            overlayClassName="customRelationModal-popconfirm"
          >
            <Button style={{ padding: 0, minWidth: 30 }} type="link">
              {intl.get('global.delete')}
            </Button>
          </Popconfirm>
        );
      }
    }
  ];

  const getColumns = () => {
    if (mode === 'view') {
      return columns.filter((item: any) => item.dataIndex !== 'operation');
    }
    return columns;
  };

  const createRelationsTips = useMemo(() => {
    return intl.get('glossary.addCustomRelationModalTips').split('|');
  }, []);

  const prefixCls = 'customRelationModal';
  return (
    <UniversalModal
      title={intl.get(`${prefixLocale}.customRelationManageBtn`)}
      className={prefixCls}
      width={640}
      visible
      onCancel={closeCustomRelationModal}
    >
      <div className={`${prefixCls}-modalContent`} style={{ height: 464 }}>
        {mode === 'edit' && (
          <div className={`${prefixCls}-topTip kw-align-center`}>
            <ExclamationCircleFilled style={{ color: '#FAAD14', fontSize: 14 }} />
            <span className="kw-ml-1">{intl.get('glossary.deleteCustomRelationTipsContent')}</span>
          </div>
        )}
        <Table
          size="small"
          rowKey="id"
          className={`${prefixCls}-table`}
          scroll={{ y: 280 }}
          dataSource={customRelationList}
          columns={getColumns()}
          rowClassName="editable-row"
          pagination={false}
          locale={{
            emptyText: (
              <NoDataBox
                imgSrc={require('@/assets/images/empty.svg').default}
                desc={
                  mode === 'edit' ? (
                    <span>
                      {createRelationsTips[0]}
                      <span className="kw-c-primary kw-pointer" onClick={() => onAdd()}>
                        {createRelationsTips[1]}
                      </span>
                      {createRelationsTips[2]}
                    </span>
                  ) : (
                    <span>{intl.get('global.noContent')}</span>
                  )
                }
              />
            )
          }}
        />
        {mode === 'edit' && customRelationList.length > 0 && (
          <Button type="link" className="kw-mt-3 kw-mb-3" onClick={() => onAdd()}>
            <IconFont type="icon-Add" />
            {intl.get('global.add')}
          </Button>
        )}
      </div>
    </UniversalModal>
  );
};
export default (props: any) => (props?.visible ? <CustomRelationModal {...props} /> : null);
