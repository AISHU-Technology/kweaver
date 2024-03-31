import React, { useState, useEffect, useRef } from 'react';

import _ from 'lodash';
import classNames from 'classnames';
import { message, Button } from 'antd';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';

import HOOKS from '@/hooks';
import HELPER from '@/utils/helper';
import Format from '@/components/Format';
import ADTable from '@/components/ADTable';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import { numToThousand } from '@/utils/handleFunction';
import { PERMISSION_KEYS, PERMISSION_CODES } from '@/enums';
import ContainerIsVisible from '@/components/ContainerIsVisible';

import noResultImg from '@/assets/images/noResult.svg';
import ErrorImage from '@/assets/images/ImportError.svg';
import tableEmpty from '@/assets/images/tableEmpty.svg';

import serverThesaurus from '@/services/thesaurus';

import ThesaurusInfo from '../ThesaurusInfo';

import './style.less';

const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.SearchLexiconWord.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId'
};
const SIZE = 100;
const ThesaurusTable = (props: any) => {
  const {
    selectedThesaurus,
    selectedRowKeys,
    setImportModalVisible,
    knowledge,
    setSelectedRowKeys,
    showInfo,
    setShowInfo,
    hasAuthorEdit,
    columns,
    setPage,
    getThesaurusById,
    addWords,
    showData,
    openDeleteModal,
    page,
    setColumns,
    setShowData,
    editWords
  } = props;
  const history = useHistory();
  const searchInput = useRef<any>(); // 绑定搜索框
  const [searchWordsValue, setSearchWordsValue] = useState<string>(''); // 控制搜索的值
  const [total, setTotal] = useState(0);
  const { height } = HOOKS.useWindowSize();

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
   * 表格选择
   */
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange
    // getCheckboxProps: () => {
    //   return { disabled: !hasAuthorEdit };
    // }
  };

  /**
   * 换页
   */
  const currentChange = (page: any) => {
    if (searchWordsValue) {
      searchWords('', page);
      return;
    }
    setPage(page);

    getThesaurusById(selectedThesaurus?.id, page);
  };

  /**
   * 搜索词汇
   **/
  const searchWords = _.debounce((e: any, page = 1) => {
    const { value } = searchInput.current.input;
    onSearchWords(e, value, page);
  }, 300);

  const onSearchWords = async (e: any, value: any, page: any) => {
    const data = {
      id: selectedThesaurus?.id,
      word: e?.target?.value,
      page,
      size: SIZE
    };

    setPage(page);
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
   * 初始化表头和数据
   */
  const getColumns = () => {
    if (_.isEmpty(selectedThesaurus?.columns)) {
      setShowData([]);
      setTotal(0);
      setColumns([]);
      return;
    }
    const op = {
      title: intl.get('global.operation'),
      dataIndex: 'operation',
      fixed: 'right',
      ellipsis: true,
      render: (_: any, record: { key: React.Key }) => {
        return (
          <div className="kw-flex">
            <ContainerIsVisible
              isVisible={
                HELPER.getAuthorByUserInfo({
                  roleType: PERMISSION_CODES.ADF_KN_LEXICON_EDIT,
                  userType: PERMISSION_KEYS.LEXICON_EDIT,
                  userTypeDepend: selectedThesaurus?.__codes
                }) && !['entity_link', 'std'].includes(selectedThesaurus?.mode)
              }
            >
              <Button
                type="link"
                className="opButton kw-pr-8"
                onClick={() => editWords(record)}
                // disabled={!hasAuthorEdit || ['entity_link', 'std'].includes(selectedThesaurus?.mode)}
              >
                {intl.get('datamanagement.edit')}
              </Button>
            </ContainerIsVisible>

            <ContainerIsVisible
              isVisible={HELPER.getAuthorByUserInfo({
                roleType: PERMISSION_CODES.ADF_KN_LEXICON_EDIT,
                userType: PERMISSION_KEYS.LEXICON_DELETE,
                userTypeDepend: selectedThesaurus?.__codes
              })}
            >
              <Button
                type="link"
                className="opButton"
                onClick={() => {
                  if (selectedThesaurus?.status === 'running') {
                    message.warning(intl.get('ThesaurusManage.editwordsError'));
                    return;
                  }
                  openDeleteModal(record, 'one');
                }}
                // disabled={!hasAuthorEdit}
              >
                {intl.get('datamanagement.delete')}
              </Button>
            </ContainerIsVisible>
          </div>
        );
      }
    };
    const col = onHandleTableCol(selectedThesaurus?.columns, op);
    return col;
  };

  /**
   * 表格行显示
   */
  const onHandleTableCol = (arr: any, op: any) => {
    let col: any[] = [];
    arr.forEach((item: any) => {
      const obj =
        arr?.length === 5
          ? {
              title: `${item}`,
              dataIndex: `${item}`,
              key: `${item}`,
              ellipsis: true,
              width: 210
            }
          : arr?.length === 1
          ? {
              title: `${item}`,
              dataIndex: `${item}`,
              key: `${item}`,
              ellipsis: true,
              width: 1005
            }
          : {
              title: `${item}`,
              dataIndex: `${item}`,
              key: `${item}`,
              ellipsis: true
            };
      col = [...col, obj as any];
    });

    const isOnlyViewPermission =
      selectedThesaurus?.__codes?.length === 1 && selectedThesaurus?.__codes.includes('LEXICON_VIEW');
    if (!isOnlyViewPermission) {
      col = [...col, op];
    }

    setTotal(selectedThesaurus?.count);
    setShowData(selectedThesaurus?.word_info);
    setColumns(col);
    return col;
  };

  /**
   * 运行
   */
  const onEdit = () => {
    history.push(
      `/knowledge/knowledge-thesaurus-create?action=create&mode=${selectedThesaurus?.mode}&thesaurus_name=${
        selectedThesaurus?.lexicon_name
      }&thesaurus_id=${selectedThesaurus?.id}&knw_id=${knowledge?.id}&description=${
        selectedThesaurus?.description || ''
      }`
    );
  };

  return (
    <div className="thesaurus-right-word-table-root">
      <div className={showInfo ? 'kw-flex ' : ''}>
        <div className={showInfo ? 'small-table' : ''}>
          <div className={'kw-space-between wordsList-op kw-mt-4 kw-pl-6 kw-pr-6 kw-mb-2'} id="wordsList-op">
            <div className="kw-align-center">
              <ContainerIsVisible
                isVisible={
                  HELPER.getAuthorByUserInfo({
                    roleType: PERMISSION_CODES.ADF_KN_LEXICON_EDIT,
                    userType: PERMISSION_KEYS.LEXICON_EDIT,
                    userTypeDepend: selectedThesaurus?.__codes
                  }) && !['entity_link', 'std'].includes(selectedThesaurus?.mode)
                }
              >
                <Button
                  className="kw-mr-3"
                  type="primary"
                  // disabled={
                  //   _.isEmpty(selectedThesaurus?.columns) || ['entity_link', 'std'].includes(selectedThesaurus?.mode)
                  // }
                  onClick={addWords}
                >
                  <IconFont type="icon-Add" />
                  {intl.get('ThesaurusManage.add')}
                </Button>
              </ContainerIsVisible>
              <ContainerIsVisible
                isVisible={HELPER.getAuthorByUserInfo({
                  roleType: PERMISSION_CODES.ADF_KN_LEXICON_EDIT,
                  userType: PERMISSION_KEYS.LEXICON_DELETE,
                  userTypeDepend: selectedThesaurus?.__codes
                })}
              >
                <Button
                  className="kw-mr-4 delete-btn"
                  disabled={!selectedRowKeys.length}
                  onClick={() => openDeleteModal('', 'more')}
                >
                  <IconFont type="icon-lajitong" />
                  {intl.get('datamanagement.delete')}
                </Button>
              </ContainerIsVisible>

              {!_.isEmpty(selectedThesaurus?.columns) ? (
                <>
                  <div
                    className={classNames(
                      'kw-mr-1',
                      selectedThesaurus?.status === 'running' || Number(numToThousand(total)) === 0
                        ? ''
                        : 'kw-c-primary'
                    )}
                  >
                    {selectedThesaurus?.status === 'running' ? 0 : numToThousand(total)}
                  </div>
                  {intl.get('ThesaurusManage.selectedWords').split('|')[0]}
                </>
              ) : null}
              {selectedRowKeys.length > 0 && (
                <div>
                  {intl.get('ThesaurusManage.selectedWords').split('|')[1]}
                  <span className="kw-ml-1 kw-mr-1 kw-c-primary">{selectedRowKeys.length}</span>
                  {intl.get('ThesaurusManage.selectedWords').split('|')[2]}
                </div>
              )}
            </div>
            <div className="kw-align-center">
              <SearchInput
                placeholder={intl.get('ThesaurusManage.searchWord')}
                className="box-height"
                ref={searchInput}
                onChange={e => {
                  e.persist();
                  searchWords(e);
                }}
              />
              <Format.Button tip={intl.get('global.refresh')} className="kw-ml-3 kw-align-center" type="icon">
                <IconFont
                  type="icon-tongyishuaxin"
                  onClick={() => {
                    setPage(1);
                    getThesaurusById(selectedThesaurus?.id, 1, true);
                  }}
                  style={{ fontSize: '16px' }}
                />
              </Format.Button>
            </div>
          </div>
          <div className={classNames('wordsList-table kw-pl-6 kw-pr-6')}>
            {!_.isEmpty(selectedThesaurus?.columns) ? (
              <ADTable
                className="kw-table-root"
                showHeader={false}
                dataSource={showData}
                columns={columns}
                // lastCalWidth={170}
                rowKey={record => JSON.stringify(record)}
                pagination={{
                  total,
                  current: page,
                  pageSize: SIZE,
                  showTitle: false,
                  showSizeChanger: false,
                  onChange: currentChange
                }}
                rowSelection={rowSelection}
                scroll={{ y: height - 260 }}
                emptyImage={
                  searchWordsValue ? noResultImg : selectedThesaurus?.status === 'failed' ? ErrorImage : tableEmpty
                }
                emptyText={
                  searchWordsValue ? (
                    <span className="kw-c-text-lower">{intl.get('global.noResult2')}</span>
                  ) : (
                    <div className="kw-c-subtext">
                      <div className="noWords-text">
                        {selectedThesaurus?.status === 'success' ? (
                          <>
                            <div>
                              {selectedThesaurus?.__codes?.length === 1 &&
                              selectedThesaurus?.__codes.includes('LEXICON_VIEW') ? (
                                <>
                                  <div className="kw-c-text-lower">{intl.get('graphDetail.noContent')}</div>
                                </>
                              ) : HELPER.getAuthorByUserInfo({
                                  roleType: PERMISSION_CODES.ADF_KN_LEXICON_CREATE,
                                  userType: PERMISSION_KEYS.KN_ADD_LEXICON,
                                  userTypeDepend: knowledge?.__codes
                                }) ? (
                                <>
                                  {selectedThesaurus?.mode ? (
                                    <div className="kw-c-text-lower">{intl.get('graphDetail.noContent')}</div>
                                  ) : (
                                    <div>
                                      <span className="kw-c-text-lower">
                                        {intl.get('ThesaurusManage.emptyWordsAdd').split('|')[0]}
                                      </span>
                                      <span
                                        className="kw-c-primary kw-mr-1 kw-ml-1 cursorStyle kw-pointer"
                                        onClick={() => setImportModalVisible(true)}
                                      >
                                        {intl.get('ThesaurusManage.emptyWordsAdd').split('|')[1]}
                                      </span>
                                      <span className="kw-c-text-lower">
                                        {intl.get('ThesaurusManage.emptyWordsAdd').split('|')[2]}
                                      </span>
                                    </div>
                                  )}
                                </>
                              ) : null}
                            </div>
                          </>
                        ) : selectedThesaurus?.status === 'failed' ? (
                          <>
                            <p className="kw-c-text-lower">{intl.get('ThesaurusManage.runFailed')}</p>
                          </>
                        ) : selectedThesaurus?.status === 'edit' && selectedThesaurus?.mode ? (
                          <>
                            <div>
                              {selectedThesaurus?.__codes?.length === 1 &&
                              selectedThesaurus?.__codes.includes('LEXICON_VIEW') ? (
                                <span className="kw-c-text-lower">{intl.get('graphDetail.noContent')}</span>
                              ) : (
                                <>
                                  <span className="kw-c-text-lower">
                                    {intl.get('ThesaurusManage.clickEdit').split('|')[0]}
                                  </span>
                                  <span className="kw-c-primary kw-pointer" onClick={onEdit}>
                                    {intl.get('ThesaurusManage.clickEdit').split('|')[1]}
                                  </span>
                                  <span className="kw-c-text-lower">
                                    {intl.get('ThesaurusManage.clickEdit').split('|')[2]}
                                  </span>
                                </>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="kw-c-text-lower">
                              {selectedThesaurus?.__codes?.length === 1 &&
                              selectedThesaurus?.__codes.includes('LEXICON_VIEW')
                                ? intl.get('graphDetail.noContent')
                                : intl.get('ThesaurusManage.importing')}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )
                }
              />
            ) : searchWordsValue ? (
              <div className="noWords-box">
                <img src={noResultImg} alt="nodata" className="nodata-img"></img>
                <div className="noWords-text kw-c-text-lower">{intl.get('global.noResult2')}</div>
              </div>
            ) : ['running', 'waiting'].includes(selectedThesaurus?.status) ? (
              <div className="noWords-box">
                <img src={tableEmpty} alt="nodata" className="nodata-img"></img>
                <div className="noWords-text">
                  <p className="kw-mb-0 kw-c-text-lower">{intl.get('ThesaurusManage.importing')}</p>
                </div>
              </div>
            ) : (
              <div className="noWords-box">
                <img
                  src={selectedThesaurus?.status === 'success' ? tableEmpty : ErrorImage}
                  alt="nodata"
                  className="nodata-img"
                />
                <div className="noWords-text kw-c-text-lower">
                  <ContainerIsVisible
                    placeholder={intl.get('ThesaurusManage.noWord')}
                    isVisible={HELPER.getAuthorByUserInfo({
                      roleType: PERMISSION_CODES.ADF_KN_LEXICON_CREATE,
                      userType: PERMISSION_KEYS.KN_ADD_LEXICON,
                      userTypeDepend: knowledge?.__codes
                    })}
                  >
                    <React.Fragment>
                      <div className="kw-c-text-lower">
                        {selectedThesaurus?.status !== 'success' && intl.get('ThesaurusManage.importError')}
                      </div>
                      <div>
                        {intl.get('ThesaurusManage.emptyWordsAdd').split('|')[0]}
                        <span
                          className="kw-c-primary kw-mr-1 kw-ml-1 cursorStyle"
                          onClick={() => setImportModalVisible(true)}
                        >
                          {intl.get('ThesaurusManage.emptyWordsAdd').split('|')[1]}
                        </span>
                        {selectedThesaurus?.status === 'success'
                          ? intl.get('ThesaurusManage.emptyWordsAdd').split('|')[2]
                          : intl.get('ThesaurusManage.importAgain')}
                      </div>
                    </React.Fragment>
                  </ContainerIsVisible>
                </div>
              </div>
            )}
          </div>
        </div>

        {showInfo ? (
          <div className="thesaurus-info-box">
            <ThesaurusInfo columns={columns} selectedThesaurus={selectedThesaurus} setShowInfo={setShowInfo} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ThesaurusTable;
