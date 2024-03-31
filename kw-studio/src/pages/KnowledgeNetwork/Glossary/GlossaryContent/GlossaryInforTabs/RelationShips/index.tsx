import { Button, Dropdown, Table, Menu, message, Tooltip, Modal } from 'antd';
import { EllipsisOutlined, LoadingOutlined } from '@ant-design/icons';
import React, { useEffect, useMemo, useState } from 'react';
import _, { debounce } from 'lodash';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import intl from 'react-intl-universal';
import AddRelationShipModal from './addRelationShipModal';
import { TermCustomRelationType, TermType } from '@/pages/KnowledgeNetwork/Glossary/types';
import { useGlossaryStore } from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';
import { deleteCustomRelationByTerm, getCustomRelationListByTerm } from '@/services/glossaryServices';
import { getTermNameByLanguage } from '@/pages/KnowledgeNetwork/Glossary/assistant';
import NoDataBox from '@/components/NoDataBox';
import ADTable from '@/components/ADTable';
import Format from '@/components/Format';

const RelationShips = ({ openCustomRelationModal, setSelectedNodeByTerm }: any) => {
  const {
    glossaryStore: { glossaryData, selectedTerm, selectedLanguage, customRelationList, mode },
    setGlossaryStore
  } = useGlossaryStore();
  const [tableProps, setTableProps] = useState({
    dataSource: [] as TermCustomRelationType[],
    selectedRowKeys: [] as number[],
    searchValue: '',
    loading: false
  });
  const [modalProps, setModalProps] = useState({
    visible: false,
    editData: null as TermCustomRelationType | null
  });

  useEffect(() => {
    if (selectedTerm && selectedTerm.length > 0 && selectedTerm[0]) {
      getTableData();
    }
  }, [tableProps.searchValue, selectedTerm, selectedLanguage, customRelationList]);

  const getTableData = async () => {
    let tableData: TermCustomRelationType[] = [];
    const termId = selectedTerm[0].id;
    const param: any = {
      word_id: termId
    };
    if (tableProps.searchValue) {
      param.query = tableProps.searchValue;
      param.language = selectedLanguage;
    }
    try {
      setTableProps(prevState => ({
        ...prevState,
        loading: true
      }));
      const data = await getCustomRelationListByTerm(glossaryData!.id, param);
      tableData = data.res;
    } catch (error) {
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
    }
    setTableProps(prevState => ({
      ...prevState,
      dataSource: tableData,
      loading: false
    }));
  };

  const onSearchName = _.debounce(e => {
    const searchValue = e?.target?.value;
    setTableProps(prevState => ({
      ...prevState,
      searchValue
    }));
  }, 300);

  const refreshTableData = () => {
    getTableData();
  };

  const deleteCustomRelation = async (keys: number[]) => {
    const termId = selectedTerm[0].id;
    try {
      const data = await deleteCustomRelationByTerm(glossaryData!.id, {
        relation_ids: keys,
        word_id: termId
      });
      if (data.res.error.length === 0) {
        message.success(intl.get('global.deleteSuccess'));
        setTableProps(prevState => ({
          ...prevState,
          selectedRowKeys: prevState.selectedRowKeys.filter(item => !keys.includes(item))
        }));
      } else {
        Modal.confirm({
          title: intl.get('global.failed'),
          content: (
            <div>
              {data.res.error.map((item: any, index: number) => (
                <div key={index}>{item.Description}</div>
              ))}
            </div>
          ),
          okText: intl.get('global.ok'),
          cancelText: intl.get('global.cancel')
        });
      }
      refreshTableData();
    } catch (error) {
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
    }
  };

  const jumpTermDetailsPage = (data: TermType) => {
    setGlossaryStore(preStore => ({
      ...preStore,
      selectedTerm: [data]
    }));
    setSelectedNodeByTerm?.([data.id]);
  };

  const columns: any = [
    {
      title: intl.get('glossary.customRelationName'),
      dataIndex: 'relation_name',
      ellipsis: true
      // width: 620
    },
    {
      title: intl.get('glossary.termName'),
      dataIndex: 'gName',
      ellipsis: true,
      // width: 620,
      render: (text: any, record: any) => {
        const names = record.words.map((item: TermType) => getTermNameByLanguage(item, selectedLanguage));
        return (
          <Dropdown
            overlay={
              <Menu style={{ maxHeight: 300, overflow: 'auto' }}>
                {_.map(record.words, (item: TermType) => (
                  <Menu.Item key={item.id}>
                    <div className="kw-align-center" onClick={() => jumpTermDetailsPage(item)}>
                      <IconFont type="icon-shuyu" />
                      <div className="kw-ellipsis kw-ml-1 kw-flex-item-full-width kw-c-text-link kw-pointer">
                        {getTermNameByLanguage(item, selectedLanguage)}
                      </div>
                    </div>
                  </Menu.Item>
                ))}
              </Menu>
            }
            trigger={['hover']}
          >
            <div className="kw-pointer kw-align-center" style={{ display: 'inline-flex', maxWidth: '100%' }}>
              <div className="kw-ml-1 kw-flex-item-full-width kw-flex">
                <span className="kw-ellipsis">
                  {names.map((item: string, index: number) => (
                    <span key={item}>
                      <IconFont type="icon-shuyu" />
                      <span className="kw-ml-1">{item}</span>
                      {index !== names.length - 1 && <span>、</span>}
                    </span>
                  ))}
                </span>
                <span>{`（${names.length}）`}</span>
              </div>
            </div>
          </Dropdown>
        );
      }
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'operation',
      fixed: 'right',
      width: 150,
      render: (_: string, record: TermCustomRelationType) => {
        return (
          <div className="kw-align-center">
            <Button
              style={{ padding: 0, minWidth: 'unset' }}
              type="link"
              onClick={e => {
                e.stopPropagation();
                setModalProps(prevState => ({
                  ...prevState,
                  visible: true,
                  editData: record
                }));
              }}
            >
              {intl.get('global.edit')}
            </Button>
            <Button
              className="kw-ml-8"
              style={{ padding: 0, minWidth: 'unset' }}
              type="link"
              onClick={debounce(e => {
                e.stopPropagation();
                deleteCustomRelation([record.relation_id]);
              }, 300)}
            >
              {intl.get('global.delete')}
            </Button>
          </div>
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

  const getAddBtnDisabled = () => {
    const listCustomRelationIds = tableProps.dataSource.map(item => item.relation_id);
    const allCustomRelationIds = customRelationList.map(item => item.id);
    const res = _.difference(allCustomRelationIds, listCustomRelationIds);
    return res.length === 0;
  };

  const createRelationsTips = useMemo(() => {
    return intl.get('glossary.addCustomRelationTips').split('|');
  }, []);

  const createTermRelationsTips = useMemo(() => {
    return intl.get('glossary.addTermCustomRelationTips').split('|');
  }, []);

  const newCustomRelationList = () => {
    return customRelationList.filter((item: any) => item.id !== 'temp');
  };

  /** 点击行 */
  const onClickRow = (record: any) => {
    const { selectedRowKeys } = tableProps;
    const keys: any = _.includes(selectedRowKeys, record?.relation_id)
      ? _.filter(selectedRowKeys, k => k !== record?.relation_id)
      : [record?.relation_id, ...selectedRowKeys];
    setTableProps(prevState => ({
      ...prevState,
      selectedRowKeys: keys
    }));
  };

  return (
    <div className="kw-w-100 kw-h-100">
      {newCustomRelationList().length > 0 ? (
        <>
          <div className="kw-space-between kw-mb-4">
            {mode === 'edit' ? (
              <div>
                <Button
                  type="primary"
                  className="kw-mr-2"
                  onClick={() => {
                    setModalProps(prevState => ({
                      ...prevState,
                      visible: true,
                      editData: null
                    }));
                  }}
                  disabled={getAddBtnDisabled()}
                >
                  <IconFont type="icon-Add" />
                  {intl.get('global.add')}
                </Button>
                <Button
                  disabled={_.isEmpty(tableProps.selectedRowKeys)}
                  onClick={() => {
                    deleteCustomRelation(tableProps.selectedRowKeys);
                  }}
                >
                  <IconFont type="icon-lajitong" />
                  {intl.get('global.delete')}
                </Button>
              </div>
            ) : (
              <div></div>
            )}
            <div className="kw-align-center">
              <SearchInput
                placeholder={intl.get('glossary.searchTermPlaceholder')}
                onChange={e => {
                  e.persist();
                  onSearchName(e);
                }}
              />
              <Format.Button
                className="kw-ml-2"
                type="icon"
                tip={intl.get('global.refresh')}
                onClick={() => {
                  refreshTableData();
                }}
              >
                <IconFont type="icon-tongyishuaxin" />
              </Format.Button>
            </div>
          </div>
          <ADTable
            showHeader={false}
            rowKey="relation_id"
            loading={
              tableProps.loading
                ? {
                    indicator: <LoadingOutlined className="icon" style={{ fontSize: 24, top: '200px' }} spin />
                  }
                : false
            }
            columns={getColumns()}
            dataSource={tableProps.dataSource}
            scroll={{ x: '100%', y: 580 }}
            rowSelection={
              mode === 'view'
                ? undefined
                : {
                    fixed: true,
                    type: 'checkbox',
                    selectedRowKeys: tableProps.selectedRowKeys,
                    onChange: (keys: any) => {
                      setTableProps(prevState => ({
                        ...prevState,
                        selectedRowKeys: keys
                      }));
                    }
                  }
            }
            pagination={false}
            onRow={(record: any) => {
              return {
                onClick: () => onClickRow(record)
              };
            }}
            locale={{
              emptyText: (
                <NoDataBox
                  imgSrc={require('@/assets/images/empty.svg').default}
                  desc={
                    mode === 'edit' && !tableProps.searchValue ? (
                      <span>
                        {createTermRelationsTips[0]}
                        <span
                          className="kw-c-primary kw-pointer"
                          onClick={() => {
                            setModalProps(prevState => ({
                              ...prevState,
                              visible: true,
                              editData: null
                            }));
                          }}
                        >
                          {createTermRelationsTips[1]}
                        </span>
                        {createTermRelationsTips[2]}
                      </span>
                    ) : (
                      <span>
                        {!tableProps.searchValue ? intl.get('global.noContent') : intl.get('global.noResult')}
                      </span>
                    )
                  }
                />
              )
            }}
          />
        </>
      ) : (
        <div className="kw-w-100 kw-h-100">
          <NoDataBox
            style={{ marginTop: 120 }}
            imgSrc={require('@/assets/images/empty.svg').default}
            desc={
              mode === 'edit' ? (
                <span>
                  {createRelationsTips[0]}
                  <span
                    className="kw-c-primary kw-pointer"
                    onClick={() => {
                      openCustomRelationModal();
                    }}
                  >
                    {createRelationsTips[1]}
                  </span>
                  {createRelationsTips[2]}
                </span>
              ) : (
                <span>{intl.get('global.noContent')}</span>
              )
            }
          />
        </div>
      )}
      <AddRelationShipModal
        refreshTableData={refreshTableData}
        visible={modalProps.visible}
        editData={modalProps.editData}
        listData={tableProps.dataSource}
        onCancel={() => {
          setModalProps(prevState => ({
            ...prevState,
            visible: false,
            editData: null
          }));
        }}
      />
    </div>
  );
};
export default RelationShips;
