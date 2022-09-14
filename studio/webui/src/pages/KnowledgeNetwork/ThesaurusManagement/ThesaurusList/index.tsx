import React, { useState, useEffect } from 'react'
import _ from 'lodash';
import { Input, Tooltip, Dropdown, Menu, Button, Pagination, Checkbox, message, Spin } from 'antd';
import { LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';

import serverThesaurus from '@/services/thesaurus';

import IconFont from '@/components/IconFont';
import ScrollBar from '@/components/ScrollBar';
import { wrapperTitle } from '@/utils/handleFunction';
import HOOKS from '@/hooks';

import ModalCreate from './CreateThesaurusModal';

import noResult from '@/assets/images/noResult.svg';
// import error from '@/assets/images/noResult.svg';

import './style.less'

const PAGESIZE = 20;
const ORDER_MENU = [
  { id: 'create_time', intlText: 'knowledge.byCreate' },
  { id: 'update_time', intlText: 'knowledge.byUpdate' },
  { id: 'name', intlText: 'knowledge.byName' }
];

const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.ExportLexicon.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId',
  'Builder.LexiconController.ExportLexicon.EmptyLexicon': 'ThesaurusManage.emptyWords'
}
const ThesaurusList = (props: any) => {
  const {
    thesaurusList, selectedThesaurus, thesaurusListCount, knowledge, createModalVisible,
    listPage
  } = props;
  const { setCreateModalVisible, getThesaurusById, getThesaurusList } = props;
  const [name, setName] = useState<string>(''); // 搜索词库名
  const [order, setOrder] = useState<string>('desc'); // 新旧排序
  const [rule, setRule] = useState<string>('update_time'); // 筛选方式
  const [page, setPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<Array<any>>([]); // 选择的词库
  const [checkAll, setCheckAll] = useState(false);
  const [errorInfoList, setErrorInfoList] = useState<Array<boolean>>([]); // 控制错误是否可见

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

  /**
   * 搜索词库
   */
  const searchThesaurus = (e: any) => {
    const { value } = e.target;

    setName(value);
    _.debounce(value => {
      getThesaurusList({ page: 1, word: value });
      setPage(1);
    }, 300)(value);
  }

  // const searchThesaurus = HOOKS.useDebounce((e: any) => {
  //   const { value } = e.target;
  //   setName(value);
  //   getThesaurusList({ page: 1, word: value });
  //   setPage(1);
  // }, 300, true);

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
      ids = [...ids, item?.id]
    }
    if (!e?.target?.checked) {
      ids = selectedIds.filter(id => id !== item?.id);
    }
    setSelectedIds(ids)

    pageListIsSelected(ids)
  };

  // 全选
  const onChangeAll = (e: any) => {
    let ids = _.cloneDeep(selectedIds);

    if (e?.target?.checked) {
      _.forEach(thesaurusList, item => {
        if (!_.isEmpty(item.columns) && !selectedIds.includes(item?.id) && item?.status !== 'running') {
          ids = [...ids, item?.id]
        }
      });
      setSelectedIds(ids);
    } else {
      const thesaurusListIds = _.map(thesaurusList, item => item?.id);
      ids = ids.filter(id => !thesaurusListIds.includes(id));
      setSelectedIds(ids);
    }
    setCheckAll(e?.target?.checked);
  }

  // 判断是否选择
  const indeterminate = () => {
    if (_.isEmpty(thesaurusList)) return
    const list = thesaurusList.filter((item: any) => {
      return (!_.isEmpty(item?.columns) && item?.status !== 'running')
    });

    return !!selectedIds.length && selectedIds.length < list.length;
  }

  // 当前页已选
  const pageListIsSelected = (ids: any) => {
    if (_.isEmpty(thesaurusList)) return
    const list = thesaurusList?.filter((item: any) => {
      return (!_.isEmpty(item?.columns) && item?.status !== 'running');
    });

    if (list.length === 0) {
      setCheckAll(false);
      return;
    }

    const selected = list.every((item: any) => ids.includes(item?.id));

    setCheckAll(selected);
  }

  // 导出词库
  const exportData = async () => {
    const ids = _.filter(thesaurusList, item => {
      return selectedIds.includes(item?.id);
    }).map(item => item?.id);

    try {
      const data = {
        id_list: ids
      }

      const response = await serverThesaurus.thesaurusExport(data);

      if (response) {
        const exportedIds = _.filter(selectedIds, item => {
          return !ids.includes(item);
        })
        setSelectedIds(exportedIds);
        setCheckAll(false);
      }
    } catch (err) {
      //
    }
  }

  // 关闭新建弹窗
  const closeModal = () => setCreateModalVisible(false);

  const changeErrorList = (index: number) => {
    const arr = _.cloneDeep(errorInfoList);
    arr[index] = false;
    setErrorInfoList(arr);
  }

  const menuRule = (
    <Menu className="menu-select" onClick={selectMenu}>
      {_.map(ORDER_MENU, item => {
        const { id, intlText } = item;
        const isSelectClass = rule === id ? 'menu-selected' : '';
        const iconDirection = order === 'desc' ? '' : 'direction';

        return (
          <Menu.Item key={id} className={isSelectClass}>
            <div className="select">
              <div className="icon">
                {rule === id ? <IconFont type="icon-fanhuishangji" className={iconDirection} /> : null}
              </div>
              <div>{intl.get(intlText)}</div>
            </div>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  return (
    <div className="thesaurus-list">
      <div className="search">
        <Input
          value={name}
          allowClear={true}
          placeholder={intl.get('ThesaurusManage.searchPlace')}
          prefix={<IconFont type="icon-sousuo" className="search-icon" />}
          onChange={searchThesaurus}
        />
      </div>
      <div>
        {!name && (
          <React.Fragment>
            <div className="list-head">
              <h2>{intl.get('ThesaurusManage.thesaurus')}</h2>
              <div className="op">
                <Tooltip title={intl.get('knowledge.sort')} placement="bottom">
                  <Dropdown
                    overlay={menuRule}
                    trigger={['click']}
                    placement="bottomRight"
                    disabled={_.isEmpty(thesaurusList)}
                    getPopupContainer={triggerNode => triggerNode?.parentElement?.parentElement || document.body}

                  >
                    <IconFont type="icon-paixu11" className={_.isEmpty(thesaurusList) ? 'disabled' : 'order'} />
                  </Dropdown>
                </Tooltip>
              </div>
            </div>
            <div className="list-btn-wrap">
              <Button className="operate-btn" type="primary" onClick={() => { setCreateModalVisible(true) }}>
                <IconFont type="icon-Add" />
                {intl.get('knowledge.create')}
              </Button>
              <Button className="operate-btn" disabled={_.isEmpty(selectedIds) || _.isEmpty(thesaurusList)} onClick={() => exportData()}>
                <IconFont type="icon-daochu" />
                {intl.get('ThesaurusManage.export')}
              </Button>
            </div>
          </React.Fragment>
        )}
        {!_.isEmpty(thesaurusList) ?
          <React.Fragment>
            {/* 全选 */}
            <div className="select-all">
              <Checkbox
                onChange={e => onChangeAll(e)}
                disabled={thesaurusList.every((e: any) => _.isEmpty(e?.columns))}
                indeterminate={indeterminate()}
                checked={checkAll}
              >{intl.get('ThesaurusManage.allThesaurus')}</Checkbox>
            </div>
            <ScrollBar autoHeight autoHeightMax={680} isshowx="false" color="rgb(184,184,184)">
              <div className="lists-wrap">
                {_.map(thesaurusList, (item: any, index: number) => {
                  return (
                    <div key={item.id} className={selectedThesaurus?.id === item.id ? 'line-selected  list-item' : 'list-item'}>
                      <Checkbox
                        disabled={_.isEmpty(item?.columns) || item?.status === 'running'}
                        onChange={e => onChange(e, item)}
                        checked={selectedIds.includes(item.id)} />
                      <div
                        className={'line ad-align-center'}
                        onClick={() => getThesaurusById(item)}
                      >
                        <div className="img">
                          <IconFont type="icon-ciku1" className="icon"></IconFont>
                        </div>
                        <div className="name ad-ellipsis" title={wrapperTitle(item.name)}>
                          {item.name}
                        </div>
                        {(item?.status === 'failed' && errorInfoList[index]) ?
                          <span className="ad-c-error" onClick={() => {
                            _.debounce(() => {
                              changeErrorList(index);
                            }, 4000)();
                          }}>
                            <Tooltip placement="right" title={item?.error_info} trigger="click">
                              <ExclamationCircleOutlined />
                            </Tooltip>
                          </span> :
                          item?.status === 'running' ?
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} /> : null
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollBar>
            <Pagination
              className="pagina"
              current={page}
              pageSize={PAGESIZE}
              total={thesaurusListCount}
              hideOnSinglePage={true}
              onChange={changePage}
              size={thesaurusListCount < 100 ? 'default' : 'small'}
              showSizeChanger={false}
            />
          </React.Fragment>
          : name ? (
            <div className="search-none">
              <img src={noResult} alt="noResult" />
              <div className="word">{intl.get('memberManage.searchNull')}</div>
            </div>) : null}
      </div>

      <ModalCreate
        isVisible={createModalVisible}
        closeModal={closeModal}
        knowledge={knowledge}
        setPage={setPage}
        getThesaurusList={getThesaurusList} />
    </div >
  )
}
export default ThesaurusList;
