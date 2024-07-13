import React, { useState, useEffect } from 'react';
import { Tabs, Button, message } from 'antd';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import KwScrollBar from '@/components/KwScrollBar';

import IconFont from '@/components/IconFont';
import ResizeDrawer from '@/components/ResizeDrawer';

import TableList from './TableList';
import { handleSelectData } from './assistant';
import { isDef } from '@/utils/handleFunction';

import noResImg from '@/assets/images/noResult.svg';
import './style.less';

type TemplateModalProps = {
  className?: string;
  width?: number;
  visible?: boolean;
  searchType: string; // 侧边搜索模块类型。'full-text'、'vidSearch'、'expandv'
  resultData: any; // 搜索结果
  searchConfig?: any; // 筛选条件 vid 全文检索有
  isSelectAdd?: any; // 是否未选择添加
  isDisabledJson?: boolean;
  onClose: () => void;
  addData: (data: any, isAll?: boolean) => void; // 添加到画布
  parameters: any;
  ontoData?: any; // 本体数据
};
const PAGE_SIZE = 20;
const listType = 'v_result';
const ResultListModal = (props: TemplateModalProps) => {
  const { className, width, visible, searchType, resultData, searchConfig, isSelectAdd, parameters, ontoData } = props;
  const { onClose, addData } = props;
  const [classPage, setClassPage] = useState(1);
  const [tabsKey, setTabsKey] = useState('list');
  const [checkData, setCheckData] = useState<Record<string, any>>({});
  const [addedIds, setSelectedId] = useState<any>([]); // 列表选中数据的id值
  const [pageData, setPageData] = useState<any>([]); // 根据本体类分页的数据
  const [tagList, setTagList] = useState<any>([]); // 保存当前列表显示的tags, 用于保存搜索结果的tag，

  useEffect(() => {
    setSelectedId([]);
    const tags = _.map(resultData?.[listType], item => item?.tag);
    setTagList(tags);
  }, [resultData]);

  useEffect(() => {
    getPageData({});
  }, [tagList]);

  const addIntoGraph = (isAll = false) => {
    if (tabsKey === 'json' || isAll) {
      if (searchType === 'expandv') {
        // 邻居查询
        addData(resultData);
      } else {
        let currData: any = [];
        _.forEach(resultData?.[listType], (n: any) => {
          currData = [...currData, ...n?.vertexs];
        });
        addData(currData);
      }
    } else {
      // 加入选择的点
      const data = handleSelectData(checkData, resultData, searchType);
      addData(data, false);
      message.success(intl.get('exploreGraph.addSuccess'));
    }

    if (isAll) onClose();
    const ids = `${_.values(checkData)}`.split(',');
    setSelectedId([...addedIds, ...ids]);
  };

  // 外层切换页码
  const onPageChange = (page: number) => {
    getPageData({ page });
  };

  /** 分页 */
  const getPageData = ({ page = 1 }) => {
    setClassPage(page);
    const start = (page - 1) * PAGE_SIZE;
    const allData = _.filter(resultData?.[listType], item => _.includes(tagList, item?.tag));
    let currentData = _.slice(allData, start);

    if (start + PAGE_SIZE < allData?.length) {
      currentData = _.slice(allData, start, start + PAGE_SIZE);
    }
    const data = { count: allData?.length, result: currentData };

    setPageData(data);
  };

  // 搜索
  const onSearchTag = (value: string) => {
    const lowerValue = _.toLower(value);
    if (!value) {
      const tags = _.map(resultData?.[listType], item => item?.tag);
      setTagList(tags);
      return;
    }
    const tags: any = [];
    _.forEach(resultData?.[listType], item => {
      const tag = _.toLower(item?.alias);
      if (_.includes(tag, lowerValue)) {
        tags.push(item?.tag);
      }
    });
    setTagList(tags);
  };

  const changeCheckData = (data: any) => {
    setCheckData(data);
  };

  return (
    <ResizeDrawer
      isOpen={visible}
      className={classNames(className, 'resultDrawer')}
      placement="bottom"
      height={isSelectAdd ? 0 : 55}
      title={intl.get('exploreGraph.searchResult')}
      onClose={onClose}
      closable={false}
      maskClosable={false}
      maxClientHeight={173}
      minHeight={isSelectAdd ? 240 : 55}
      zIndex={11}
      style={isDef(width) ? { left: width, width: `calc(100% - ${width}px)` } : undefined}
      extra={<IconFont type="icon-guanbiquxiao" onClick={() => onClose()} />}
    >
      <div style={{ height: '100%', minHeight: 358 }}>
        {_.isEmpty(resultData) ? (
          <div className="empty-box">
            <img src={noResImg} alt="nodata" className="kw-tip-img" />
            <div className="kw-c-text">{intl.get('global.noResult')}</div>
          </div>
        ) : (
          <div className={classNames('result-wrap', { selectWrapper: isSelectAdd })}>
            <Tabs className="resultTabs" activeKey={tabsKey} onChange={e => setTabsKey(e)}>
              <Tabs.TabPane tab={intl.get('exploreGraph.list')} key="list">
                <KwScrollBar className="scroll-wrapper" isShowX={false}>
                  <div className="kw-pl-6 kw-pr-6 kw-h-100">
                    <TableList
                      dataList={pageData}
                      classPage={classPage}
                      searchConfig={searchConfig}
                      checkData={checkData}
                      addedIds={addedIds}
                      isSelectAdd={isSelectAdd}
                      onSearchTag={e => onSearchTag(e)}
                      onPageChange={onPageChange}
                      changeCheckData={changeCheckData}
                    />
                  </div>
                </KwScrollBar>
              </Tabs.TabPane>
            </Tabs>
          </div>
        )}

        {isSelectAdd && (
          <div className="bottom-box kw-center">
            <Button onClick={() => onClose()}>{intl.get('exploreGraph.cancel')}</Button>
            <Button
              className="kw-ml-2"
              type={tabsKey === 'list' ? 'default' : 'primary'}
              onClick={() => addIntoGraph(true)}
            >
              {intl.get('exploreGraph.addAll')}
            </Button>

            {tabsKey === 'list' && (
              <Button
                type="primary"
                onClick={() => addIntoGraph()}
                className="kw-ml-2"
                disabled={tabsKey === 'list' && _.isEmpty(checkData)}
              >
                {intl.get('exploreGraph.addTwo')}
              </Button>
            )}
          </div>
        )}
      </div>
    </ResizeDrawer>
  );
};

export default (props: any) => {
  const { visible } = props;
  if (!visible) return null;
  return <ResultListModal {...props} />;
};
