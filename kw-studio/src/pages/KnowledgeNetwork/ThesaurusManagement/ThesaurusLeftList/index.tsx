import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import _ from 'lodash';
import { Input, Tooltip, Dropdown, Menu, Button, Pagination, Checkbox, message, Spin } from 'antd';
import { LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';

import HELPER from '@/utils/helper';
import { PERMISSION_KEYS, PERMISSION_CODES } from '@/enums';
import { sessionStore, wrapperTitle } from '@/utils/handleFunction';
import serverThesaurus from '@/services/thesaurus';
import serviceLicense from '@/services/license';
import IconFont from '@/components/IconFont';
import ContainerIsVisible from '@/components/ContainerIsVisible';
import Format from '@/components/Format';

import ImportThesaurusModal from './ImportThesaurusModal';

import noResult from '@/assets/images/noResult.svg';
import './style.less';
import SearchInput from '@/components/SearchInput';

const PAGESIZE = 20;
const ORDER_MENU = [
  { id: 'name', intlText: intl.get('cognitiveService.analysis.byName') },
  { id: 'create_time', intlText: intl.get('cognitiveService.analysis.byCreate') },
  { id: 'update_time', intlText: intl.get('subscriptionService.byUpdate') }
];

const ThesaurusLeftList = (props: any, ref: any) => {
  const {
    thesaurusList,
    selectedThesaurus,
    thesaurusListCount,
    knowledge,
    createModalVisible,
    listPage,
    importModalVisible,
    setImportModalVisible,
    collapse,
    setCollapse,
    selectedLeftId,
    setSelectedLeftId
  } = props;
  const { setCreateModalVisible, getThesaurusById, getThesaurusList, onImportAndCreateModal } = props;
  const [name, setName] = useState<string>(''); // 搜索词库名
  const [order, setOrder] = useState<string>('desc'); // 新旧排序
  const [rule, setRule] = useState<string>('create_time'); // 筛选方式
  const [page, setPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<Array<any>>([]); // 选择的词库
  const [checkAll, setCheckAll] = useState(false);
  const [errorInfoList, setErrorInfoList] = useState<Array<boolean>>([]); // 控制错误是否可见
  const [isShowClose, setIsShowClose] = useState(false); // 收起图标
  // const [selectedLeftId, setSelectedLeftId] = useState<any>(0);

  useImperativeHandle(ref, () => ({
    onClearInputValue
  }));

  useEffect(() => {
    getThesaurusList({ order, rule });
  }, [order, rule]);

  useEffect(() => {
    pageListIsSelected(selectedIds);
    if (page !== listPage) setPage(listPage);
    const errorList = _.map(thesaurusList, item => {
      return item?.status === 'failed';
    });
    setErrorInfoList(errorList);
  }, [thesaurusList, listPage]);

  const onClearInputValue = () => {
    setName('');
  };

  /**
   * 获取知识量
   */
  const onCalculate = async () => {
    try {
      const res = await serviceLicense.graphCountAll();
      if (res && res !== undefined) {
        const { all_knowledge, knowledge_limit } = res;
        if (knowledge_limit === -1) return; // 无限制
        if (knowledge_limit - all_knowledge >= 0 && knowledge_limit - all_knowledge < knowledge_limit * 0.1) {
          message.warning(intl.get('license.remaining'));
        }
      }
    } catch (error) {
      if (!error.type) return;
      const { Description } = error.response || {};
      Description && message.error(Description);
    }
  };

  /**
   * 搜索词库
   */
  const searchThesaurus = (value: any) => {
    // setName(value);
    getThesaurusList({ page: 1, word: value });
    setPage(1);
  };

  /**
   * 排序
   */
  const selectMenu = (e: any) => {
    if (e.key === rule) return setOrder(order === 'desc' ? 'asc' : 'desc');
    setRule(e.key);
  };

  /**
   * 换页
   */
  const changePage = (page: number) => {
    setPage(page);
    getThesaurusList({ page, order, rule });
  };

  /**
   *复选框切换
   */
  const onChange = (e: any, item: any) => {
    let ids = _.cloneDeep(selectedIds);
    if (e?.target?.checked) {
      ids = [...ids, item?.id];
    }
    if (!e?.target?.checked) {
      ids = _.filter(selectedIds, id => id !== item?.id);
    }
    setSelectedIds(ids);

    pageListIsSelected(ids);
  };

  // 全选
  const onChangeAll = (e: any) => {
    let ids = _.cloneDeep(selectedIds);

    if (e?.target?.checked) {
      _.forEach(thesaurusList, item => {
        if (
          !_.isEmpty(item.columns) &&
          !selectedIds.includes(item?.id) &&
          item?.status !== 'running' &&
          !item.isDisable
        ) {
          ids = [...ids, item?.id];
        }
      });
      setSelectedIds(ids);
    } else {
      const thesaurusListIds = _.map(thesaurusList, item => item?.id);
      ids = _.filter(ids, id => !thesaurusListIds.includes(id));
      setSelectedIds(ids);
    }
    setCheckAll(e?.target?.checked);
  };

  // 判断是否选择
  const indeterminate = () => {
    if (_.isEmpty(thesaurusList)) return;
    const list = _.filter(thesaurusList, (item: any) => {
      return !_.isEmpty(item?.columns) && item?.status !== 'running' && !item.isDisable;
    });

    return !!selectedIds.length && selectedIds.length < list.length;
  };

  // 当前页已选
  const pageListIsSelected = (ids: any) => {
    if (_.isEmpty(thesaurusList)) return;
    const list = thesaurusList?.filter((item: any) => {
      return !_.isEmpty(item?.columns) && item?.status !== 'running' && !item.isDisable;
    });

    if (list.length === 0) {
      setCheckAll(false);
      return;
    }

    const selected = list.every((item: any) => ids.includes(item?.id));

    setCheckAll(selected);
  };

  // 导出词库
  const exportData = async () => {
    if (_.isEmpty(selectedIds) || _.isEmpty(thesaurusList)) return;
    if (selectedThesaurus?.status === 'running') {
      message.error(intl.get('ThesaurusManage.import'));
      return;
    }
    const ids = _.filter(thesaurusList, item => {
      return selectedIds.includes(item?.id);
    }).map(item => item?.id);

    try {
      const data = {
        id_list: ids
      };

      const response = await serverThesaurus.thesaurusExport(data);

      if (response) {
        const exportedIds = _.filter(selectedIds, item => {
          return !ids.includes(item);
        });
        setSelectedIds(exportedIds);
        setCheckAll(false);
      }
    } catch (err) {
      //
    }
  };

  // 关闭导入弹窗
  // const closeModal = () => setCreateModalVisible(false);
  const closeModal = () => setImportModalVisible(false);

  const changeErrorList = (index: number) => {
    const arr = _.cloneDeep(errorInfoList);
    arr[index] = false;
    setErrorInfoList(arr);
  };

  const menuRule = (
    <Menu className="menu-select" onClick={selectMenu}>
      {_.map(ORDER_MENU, item => {
        const { id, intlText } = item;
        const isSelectClass = rule === id ? 'menu-selected' : '';
        // const iconDirection = order === 'desc' ? '' : 'direction';
        const iconDirection = order === 'desc' ? 'direction' : '';

        return (
          <Menu.Item key={id} className={isSelectClass}>
            <div className="select">
              <div className="icon">
                {rule === id ? <IconFont type="icon-fanhuishangji" className={iconDirection} /> : null}
              </div>
              <div>{intlText}</div>
            </div>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  const hasCreate = HELPER.getAuthorByUserInfo({
    roleType: PERMISSION_CODES.ADF_KN_LEXICON_CREATE,
    userType: PERMISSION_KEYS.KN_ADD_LEXICON,
    userTypeDepend: knowledge?.__codes
  });

  /**
   * 鼠标移入
   */
  const onMouseOver = (e: any) => {
    setIsShowClose(true);
  };

  /**
   * 鼠标移出
   */
  const onMouseLeave = (e: any) => {
    setIsShowClose(false);
  };

  /**
   * 收起
   */
  const onCollapse = () => {
    setCollapse(true);
    sessionStore.set('thesaurusList', '1');
  };

  return (
    <div
      className={collapse ? 'thesaurus-list-collapse-root' : 'thesaurus-list-root'}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
    >
      <div className="search kw-flex">
        <SearchInput
          allowClear={true}
          placeholder={intl.get('ThesaurusManage.searchName')}
          prefix={<IconFont type="icon-sousuo" className="search-icon" />}
          onChange={e => {
            e?.persist();
            setName(e?.target?.value);
            searchThesaurus(e?.target?.value);
          }}
          debounce
        />
        {isShowClose ? (
          <Format.Button tip={intl.get('global.unExpand')} className="kw-ml-2" type="icon" onClick={onCollapse}>
            <IconFont type="icon-zhankai1" style={{ fontSize: 12 }} />
          </Format.Button>
        ) : null}
      </div>
      <div className="kw-h-100" style={{ height: 'calc(100% - 32px)' }}>
        {!name && (
          <React.Fragment>
            <div className="list-head kw-mb-1 kw-mt-2">
              <div>{intl.get('ThesaurusManage.thesaurus')}</div>
              <div className="op kw-flex">
                <Dropdown
                  overlay={menuRule}
                  trigger={['click']}
                  placement="bottomRight"
                  disabled={_.isEmpty(thesaurusList)}
                  getPopupContainer={triggerNode => triggerNode?.parentElement?.parentElement || document.body}
                >
                  <Format.Button
                    size="small"
                    tip={intl.get('knowledge.sort')}
                    className="kw-align-center"
                    type="icon"
                    disabled={_.isEmpty(thesaurusList)}
                  >
                    <IconFont type="icon-paixu11" style={{ fontSize: 14 }} />
                  </Format.Button>
                </Dropdown>

                <Format.Button
                  className="kw-align-center"
                  tip={intl.get('uploadService.export')}
                  disabled={_.isEmpty(selectedIds) || _.isEmpty(thesaurusList)}
                  type="icon"
                  onClick={() => exportData()}
                  size="small"
                >
                  <IconFont type="icon-daochu" style={{ fontSize: 14 }} />
                </Format.Button>

                <ContainerIsVisible isVisible={hasCreate}>
                  <Format.Button
                    className="kw-align-center"
                    type="icon"
                    onClick={() => onImportAndCreateModal('import')}
                    tip={intl.get('analysisService.importService.import')}
                    size="small"
                  >
                    <IconFont type="icon-daoru" style={{ fontSize: 14 }} />
                  </Format.Button>
                </ContainerIsVisible>
                <ContainerIsVisible isVisible={hasCreate}>
                  <Format.Button
                    onClick={() => {
                      onCalculate();
                      onImportAndCreateModal('create');
                    }}
                    tip={intl.get('cognitiveSearch.create')}
                    className="kw-align-center"
                    type="icon"
                    size="small"
                  >
                    <IconFont type="icon-Add" style={{ fontSize: 14 }} />
                  </Format.Button>
                </ContainerIsVisible>
              </div>
            </div>
          </React.Fragment>
        )}
        {!_.isEmpty(thesaurusList) ? (
          <div className="kw-h-100">
            {/* 全选 */}
            {/* {HELPER.getAuthorByUserInfo({ roleType: PERMISSION_CODES.ADF_KN_LEXICON_EXPORT }) && ( */}
            <div className="select-all kw-flex kw-pl-2">
              <Checkbox
                onChange={e => onChangeAll(e)}
                disabled={thesaurusList.every((e: any) => _.isEmpty(e?.columns))}
                indeterminate={indeterminate()}
                checked={checkAll}
              >
                {intl.get('ThesaurusManage.allThesaurus')}
              </Checkbox>
            </div>
            {/* )} */}
            <div className="kw-h-100">
              <div className="lists-wrap">
                {_.map(thesaurusList, (item: any, index: number) => {
                  return (
                    <div
                      key={item.id}
                      className={Number(selectedLeftId) === item?.id ? 'line-selected  list-item' : 'list-item'}
                    >
                      {/* {HELPER.getAuthorByUserInfo({ roleType: PERMISSION_CODES.ADF_KN_LEXICON_EXPORT }) && ( */}
                      <Checkbox
                        disabled={item?.isDisable || _.isEmpty(item?.columns) || item?.status === 'running'}
                        onChange={e => onChange(e, item)}
                        checked={selectedIds.includes(item.id)}
                      />
                      {/* )} */}
                      <div
                        className={'line kw-align-center'}
                        onClick={() => {
                          getThesaurusById(item?.id);
                          setSelectedLeftId(item?.id);
                          sessionStore.set('thesaurusSelectedId', item?.id);
                        }}
                      >
                        <IconFont type="icon-ciku1" className="kw-mr-2 kw-ml-2" style={{ fontSize: '18px' }} />
                        <div className="name kw-ellipsis" title={wrapperTitle(item.name)}>
                          {item.name}
                        </div>
                        {item?.status === 'failed' ? (
                          // {item?.status === 'failed' && errorInfoList[index] ? (
                          <span
                            className="kw-c-error"
                            onClick={() => {
                              _.debounce(() => {
                                changeErrorList(index);
                              }, 4000)();
                            }}
                          >
                            <Tooltip placement="right" title={item?.error_info} trigger="click">
                              <IconFont type="icon-Warning" className="kw-c-error" />
                              {/* <ExclamationCircleOutlined /> */}
                            </Tooltip>
                          </span>
                        ) : ['running', 'waiting'].includes(item?.status) ? (
                          <Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : name ? (
          <div className="search-none">
            <img src={noResult} alt="noResult" />
            <div className="word">{intl.get('global.noResult2')}</div>
          </div>
        ) : null}
      </div>

      <ImportThesaurusModal
        isVisible={importModalVisible}
        closeModal={closeModal}
        knowledge={knowledge}
        setPage={setPage}
        getThesaurusList={getThesaurusList}
      />
    </div>
  );
};
export default forwardRef(ThesaurusLeftList);
