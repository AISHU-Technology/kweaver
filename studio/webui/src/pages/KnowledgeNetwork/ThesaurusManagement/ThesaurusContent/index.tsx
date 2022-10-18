import React, { useEffect, useState, memo, useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Table, message, Tooltip, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import AdSpin from '@/components/AdSpin';
import { numToThousand } from '@/utils/handleFunction';
import SearchInput from '@/components/SearchInput';
import serverThesaurus from '@/services/thesaurus';

import AddWordsModal from './AddWordsModal';
import DeleteWordsModal from './DeleteWords';
import ThesaurusHeader from './Header';
import ModalImport from './ModelImport';
import ThesaurusInfo from './ThesaurusInfo';

import kongImage from '@/assets/images/kong.svg';
import noResultImg from '@/assets/images/noResult.svg';
import ErrorImage from '@/assets/images/ImportError.svg';

import './style.less';

export interface ThesaurusContentProps {
  selectedThesaurus: any;
  getThesaurusById: (thesaurus: any) => void;
  knowledge: any;
}
const SIZE = 50;
const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.SearchLexiconWord.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId'
};
const ThesaurusContent = (props: any) => {
  const { selectedThesaurus, getThesaurusById, knowledge, getThesaurusList } = props;
  const searchInput = useRef<any>(); // 绑定搜索框
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [page, setpage] = useState(1); // 页码
  const [total, setTotal] = useState(0);
  const [showData, setShowData] = useState([{ id: '1' }]); // 表格数据
  const [columns, setColumns] = useState<any[] | undefined>([]);
  const [addWordsVisible, setAddWordsVisible] = useState<boolean>(false); // 编辑新加词汇弹窗
  const [delWordsVisible, setDelWordsVisible] = useState<boolean>(false); // 删除词汇弹窗
  const [opWordsType, setOpWordsType] = useState<string>('add');
  const [searchWordsValue, setSearchWordsValue] = useState<string>(''); // 控制搜索的值
  const [deleteType, setDeleteType] = useState<string>('one'); // 删除单个或多个
  const [deleteValue, setDeleteValue] = useState<Array<any>>([]); // 删除内容
  const [importModalVisible, setimportModalVisible] = useState<boolean>(false); // 导入弹窗
  const [editRecord, setEditRecord] = useState<any>(); // 编辑的一行词库
  const [showInfo, setShowInfo] = useState<boolean>(false); // 侧边信息
  useEffect(() => {
    getColumns();
    setSelectedRowKeys([]);
  }, [selectedThesaurus]);

  /**
   * 表格复选框的变化
   */
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  /**
   * 编辑词库
   * @param record 一行的词
   */
  const editWords = (record: any) => {
    if (selectedThesaurus?.status === 'running') {
      message.warning(intl.get('ThesaurusManage.editwordsError'));
      return;
    }
    setEditRecord(record);
    setOpWordsType('edit');
    setAddWordsVisible(true);
  };

  /**
   * 初始化表头和数据
   */
  const getColumns = () => {
    if (_.isEmpty(selectedThesaurus?.columns)) {
      setShowData([]);
      setTotal(0);
      setColumns([]);
      return;
    }
    const arr = selectedThesaurus?.columns;
    const op = {
      title: intl.get('global.operation'),
      dataIndex: 'operation',
      fixed: 'right',
      width: 135,
      render: (_: any, record: { key: React.Key }) => {
        return (
          <div>
            <span onClick={() => editWords(record)} className="edit-words-text">
              {intl.get('datamanagement.edit')}
            </span>
            <span
              onClick={() => {
                if (selectedThesaurus?.status === 'running') {
                  message.warning(intl.get('ThesaurusManage.editwordsError'));
                  return;
                }
                openDeleteModal(record, 'one');
              }}
              className="delete-words-text"
            >
              {intl.get('datamanagement.delete')}
            </span>
          </div>
        );
      }
    };
    let col: any[] = [op];
    arr.forEach((item: any) => {
      const obj = {
        title: `${item}`,
        dataIndex: `${item}`,
        key: `${item}`,
        ellipsis: true
      };
      col = [obj as any, ...col];
    });

    setTotal(selectedThesaurus?.count);
    setShowData(selectedThesaurus?.word_info);
    setColumns(col);
    return col;
  };

  /**
   * 表格选择
   */
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange
  };

  /**
   * 打开删除弹窗
   */
  const openDeleteModal = (item: any, type: any) => {
    if (type === 'one') {
      setDeleteValue([item]);
    }
    if (type === 'more') {
      let value: any[] = [];
      selectedRowKeys.forEach(item => {
        const obj = JSON.parse(item as string);

        value = [...value, obj];
      });
      setDeleteValue(value);
    }
    setDeleteType(type);
    setDelWordsVisible(true);
  };

  /**
   * 搜索词汇
   **/
  const searchWords = async (e: any, isClear = false, page = 1) => {
    const { value } = searchInput.current.input;

    const searchword = isClear ? '' : value;
    const data = {
      id: selectedThesaurus?.id,
      word: searchword,
      page,
      size: SIZE
    };

    setpage(page);
    const response = await serverThesaurus.thesaurusSearchWords(data);
    const { res, ErrorCode } = response || {};
    if (ErrorCode) {
      ERROR_CODE[ErrorCode] ? message.error(intl.get(ERROR_CODE[ErrorCode])) : message.error(response?.ErrorDetails);

      return;
    }

    setSearchWordsValue(value);
    setTotal(res?.count);
    setShowData(res?.df);
  };

  /**
   * 换页
   */
  const currentChange = (page: any) => {
    if (searchWordsValue) {
      searchWords('', false, page);
      return;
    }
    setpage(page);

    getThesaurusById(selectedThesaurus, page);
  };

  // 关闭删除词汇弹窗
  const closeDelModal = () => setDelWordsVisible(false);
  // 关闭导入弹窗
  const closeImportModal = () => setimportModalVisible(false);
  // 关闭添加词库的弹窗
  const closeAddModal = () => setAddWordsVisible(false);
  return (
    <div className="thesaurus-content">
      <div>
        <ThesaurusHeader
          columns={columns}
          selectedThesaurus={selectedThesaurus}
          setimportModalVisible={setimportModalVisible}
          setAddWordsVisible={setAddWordsVisible}
          setOpWordsType={setOpWordsType}
          knowledge={knowledge}
          getThesaurusById={getThesaurusById}
          getThesaurusList={getThesaurusList}
        />
        <div className="ad-space-between wordsList-op" id="wordsList-op">
          {_.isEmpty(selectedThesaurus?.columns) ? (
            <div></div>
          ) : (
            <div className="ad-align-center">
              {selectedRowKeys.length > 0 && (
                <Format.Button className="ad-mr-4 delete-btn" onClick={() => openDeleteModal('', 'more')}>
                  <IconFont type="icon-lajitong" />
                  {intl.get('datamanagement.delete')}
                </Format.Button>
              )}
              <div className="ad-c-primary ad-mr-1">{numToThousand(total)}</div>
              {intl.get('ThesaurusManage.selectedWords').split('|')[0]}
              {selectedRowKeys.length > 0 && (
                <div>
                  {intl.get('ThesaurusManage.selectedWords').split('|')[1]}
                  <span className="ad-ml-1 ad-mr-1 ad-c-primary">{selectedRowKeys.length}</span>
                  {intl.get('ThesaurusManage.selectedWords').split('|')[2]}
                </div>
              )}
            </div>
          )}
          <div className="ad-align-center">
            <SearchInput
              placeholder={intl.get('ThesaurusManage.searchWord')}
              className="ad-mr-4 box-height"
              ref={searchInput}
              onPressEnter={e => searchWords(e)}
              onClear={(e: any) => searchWords(e, true)}
            />
            <Tooltip title={intl.get('ThesaurusManage.infomation')} placement="bottomLeft" trigger={['hover']}>
              <div
                className={showInfo ? 'selected btn-height' : 'btn-height'}
                onClick={() => {
                  setShowInfo(!showInfo);
                }}
              >
                <IconFont type="icon-cebianlan" />
              </div>
            </Tooltip>
            <Tooltip title={intl.get('global.refresh')} placement="bottomLeft" trigger={['hover']}>
              <div
                className="btn-height ad-ml-4"
                onClick={() => {
                  setpage(1);
                  getThesaurusById(selectedThesaurus, 1, true);
                }}
              >
                <IconFont type="icon-tongyishuaxin" />
              </div>
            </Tooltip>
          </div>
        </div>
        <div className={showInfo ? 'ad-flex' : ''}>
          <div className={showInfo ? 'wordsList-table small-table' : 'wordsList-table'}>
            {!_.isEmpty(selectedThesaurus?.columns) ? (
              <Table
                rowSelection={rowSelection}
                pagination={{
                  current: page,
                  total,
                  pageSize: SIZE,
                  onChange: currentChange,
                  showTitle: false,
                  showSizeChanger: false
                }}
                columns={columns}
                dataSource={showData}
                rowKey={record => JSON.stringify(record)}
                locale={{
                  emptyText: searchWordsValue ? (
                    <div className="noWords-box">
                      <img src={noResultImg} alt="nodata" className="nodata-img"></img>
                      <div className="noWords-text">{intl.get('global.noResult')}</div>
                    </div>
                  ) : (
                    <div className="noWords-box">
                      {selectedThesaurus?.status === 'success' ? (
                        <>
                          <img src={kongImage} alt="nodata" className="nodata-img" />
                          <div className="noWords-text">
                            <p className="ad-c-text">{intl.get('ThesaurusManage.noWord')}</p>
                            <p className="ad-c-text">
                              {intl.get('ThesaurusManage.emptyWord').split('|')[0]}
                              <span
                                className="ad-c-primary ad-mr-1 ad-ml-1 cursorStyle"
                                onClick={() => setimportModalVisible(true)}
                              >
                                {intl.get('ThesaurusManage.emptyWord').split('|')[1]}
                              </span>
                              {intl.get('ThesaurusManage.emptyWord').split('|')[2]}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                          <p className="ad-c-text ad-mt-3">{intl.get('ThesaurusManage.importing')}</p>
                        </>
                      )}
                    </div>
                  )
                }}
                scroll={{ y: 590 }}
              />
            ) : selectedThesaurus?.status === 'running' ? (
              <div className="noWords-box">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />

                <div className="noWords-text">
                  <p className="ad-mt-3">{intl.get('ThesaurusManage.importing')}</p>
                </div>
              </div>
            ) : (
              <div className="noWords-box">
                <img
                  src={selectedThesaurus?.status === 'success' ? kongImage : ErrorImage}
                  alt="nodata"
                  className="nodata-img"
                ></img>
                <div className="noWords-text">
                  <p>
                    {selectedThesaurus?.status === 'success'
                      ? intl.get('ThesaurusManage.noWord')
                      : intl.get('ThesaurusManage.importError')}
                  </p>
                  <p>
                    {intl.get('ThesaurusManage.emptyWord').split('|')[0]}
                    <span
                      className="ad-c-primary ad-mr-1 ad-ml-1 cursorStyle"
                      onClick={() => setimportModalVisible(true)}
                    >
                      {intl.get('ThesaurusManage.emptyWord').split('|')[1]}
                    </span>
                    {selectedThesaurus?.status === 'success'
                      ? intl.get('ThesaurusManage.emptyWord').split('|')[2]
                      : intl.get('ThesaurusManage.importAgain')}
                  </p>
                </div>
              </div>
            )}
          </div>
          {showInfo ? (
            <div className="thesaurus-info-box">
              <ThesaurusInfo columns={columns} selectedThesaurus={selectedThesaurus} />
            </div>
          ) : null}
        </div>
      </div>

      <AddWordsModal
        isVisible={addWordsVisible}
        closeModal={closeAddModal}
        setpage={setpage}
        page={page}
        type={opWordsType}
        columns={columns}
        selectedThesaurus={selectedThesaurus}
        editRecord={editRecord}
        getThesaurusById={getThesaurusById}
      />

      <ModalImport
        isVisible={importModalVisible}
        closeModal={closeImportModal}
        selectedThesaurus={selectedThesaurus}
        setpage={setpage}
        page={page}
        getThesaurusById={getThesaurusById}
        getThesaurusList={getThesaurusList}
      />

      <DeleteWordsModal
        isVisible={delWordsVisible}
        closeModal={closeDelModal}
        deleteType={deleteType}
        deleteValue={deleteValue}
        page={page}
        selectedThesaurus={selectedThesaurus}
        getThesaurusById={getThesaurusById}
      />
    </div>
  );
};
export default memo(ThesaurusContent);
