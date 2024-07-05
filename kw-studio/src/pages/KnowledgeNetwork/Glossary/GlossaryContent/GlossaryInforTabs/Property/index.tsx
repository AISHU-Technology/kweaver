import React, { useEffect, useMemo, useState } from 'react';
import { Button, Table, Dropdown, Menu, Tooltip, message } from 'antd';
import { EllipsisOutlined, LoadingOutlined } from '@ant-design/icons';
import _ from 'lodash';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import AddProperty from './AddProperty';
import './style.less';
import { deleteTermAttribute, getTermAttributeList } from '@/services/glossaryServices';
import { useGlossaryStore } from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';
import { GlossaryDataType, TermType } from '@/pages/KnowledgeNetwork/Glossary/types';
import { getTermNameByLanguage } from '@/pages/KnowledgeNetwork/Glossary/assistant';
import NoDataBox from '@/components/NoDataBox';
import KwTable from '@/components/KwTable';
import Format from '@/components/Format';

export default function index({ setSelectedNodeByTerm }: any) {
  const {
    glossaryStore: { glossaryData, selectedTerm, selectedLanguage, mode },
    setGlossaryStore
  } = useGlossaryStore();
  const [addVisible, setAddVisible] = useState<boolean>(false);
  const [tableProps, setTableProps] = useState({
    dataSource: [] as TermType[],
    selectedRowKeys: [],
    searchValue: '',
    loading: false
  });

  useEffect(() => {
    if (selectedTerm && selectedTerm.length > 0 && selectedTerm[0]) {
      getTableData();
    }
  }, [tableProps.searchValue, selectedTerm, selectedLanguage]);

  const sortByName = (data: TermType[]) => {
    const result = [...(data || [])];
    const isCN = (text: string) => /[\u4e00-\u9fa5]/.test(text);
    result.sort((a, b) => {
      const labelA = getTermNameByLanguage(a, selectedLanguage)?.toLocaleLowerCase?.() || '';
      const labelB = getTermNameByLanguage(b, selectedLanguage)?.toLocaleLowerCase?.() || '';
      if (isCN(labelA[0]) && !isCN(labelB[0])) return -1;
      if (!isCN(labelA[0]) && isCN(labelB[0])) return 1;
      return labelA.localeCompare(labelB, 'zh-CN');
    });
    return result;
  };

  const getTableData = async () => {
    let tableData: TermType[] = [];
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
      const data = await getTermAttributeList(glossaryData!.id, param);
      tableData = sortByName(data.res);
      // 按照名称a-z排序
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

  const deleteAttribute = async (keys: string[]) => {
    const termId = selectedTerm[0].id;
    try {
      await deleteTermAttribute(glossaryData!.id, {
        start_word_id: termId,
        end_word_id_list: keys
      });
      message.success(intl.get('global.deleteSuccess'));
      setTableProps(prevState => ({
        ...prevState,
        selectedRowKeys: prevState.selectedRowKeys.filter(item => !keys.includes(item))
      }));
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
      title: intl.get('glossary.termName'),
      ellipsis: true,
      dataIndex: 'name',
      render: (value: any, record: TermType) => {
        return (
          <div className="kw-ellipsis">
            <span
              className="kw-pointer kw-c-text-link"
              onClick={e => {
                e.stopPropagation();
                jumpTermDetailsPage(record);
              }}
            >
              {getTermNameByLanguage(record, selectedLanguage)}
            </span>
          </div>
        );
      }
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'operation',
      width: 100,
      fixed: 'right',
      render: (value: any, record: TermType) => {
        return (
          <Button
            style={{ padding: 0, minWidth: 'unset' }}
            type="link"
            onClick={_.debounce(e => {
              e.stopPropagation();
              deleteAttribute([record.id]);
            }, 300)}
          >
            {intl.get('global.delete')}
          </Button>
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

  /** 点击行 */
  const onClickRow = (record: any) => {
    const { selectedRowKeys } = tableProps;
    const keys: any = _.includes(selectedRowKeys, record?.id)
      ? _.filter(selectedRowKeys, k => k !== record?.id)
      : [record?.id, ...selectedRowKeys];
    setTableProps(prevState => ({
      ...prevState,
      selectedRowKeys: keys
    }));
  };

  const createAttributeTips = useMemo(() => {
    return intl.get('glossary.addAttributeTips').split('|');
  }, []);

  const prefixCls = 'termProperty';
  return (
    <div className={prefixCls}>
      <div className="kw-space-between">
        {mode === 'edit' ? (
          <div>
            <Button type="primary" className="kw-mr-2" onClick={() => setAddVisible(true)}>
              <IconFont type="icon-Add" />
              {intl.get('global.add')}
            </Button>
            <Button
              disabled={_.isEmpty(tableProps.selectedRowKeys)}
              onClick={() => {
                deleteAttribute(tableProps.selectedRowKeys);
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

      <div className="kw-mt-4">
        <KwTable
          showHeader={false}
          rowKey="id"
          loading={
            tableProps.loading
              ? {
                  indicator: <LoadingOutlined className="icon" style={{ fontSize: 24, top: '200px' }} spin />
                }
              : false
          }
          columns={getColumns()}
          dataSource={tableProps.dataSource}
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
                      {createAttributeTips[0]}
                      <span
                        className="kw-c-primary kw-pointer"
                        onClick={() => {
                          setAddVisible(true);
                        }}
                      >
                        {createAttributeTips[1]}
                      </span>
                      {createAttributeTips[2]}
                    </span>
                  ) : (
                    <span>{!tableProps.searchValue ? intl.get('global.noContent') : intl.get('global.noResult')}</span>
                  )
                }
              />
            )
          }}
          scroll={{ x: '100%', y: 610 }}
        />
      </div>
      <AddProperty
        listData={tableProps.dataSource}
        refreshTableData={refreshTableData}
        visible={addVisible}
        onCancel={() => setAddVisible(false)}
      />
    </div>
  );
}
