import React, { memo, useState, useRef, useEffect, forwardRef } from 'react';
import { Pagination, Menu } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import KwScrollBar from '@/components/KwScrollBar';
import IconFont from '@/components/IconFont';
import HOOKS from '@/hooks';
import { numToThousand } from '@/utils/handleFunction';
import NoDataBox from '@/components/NoDataBox';
import ListResult from './ListResult';
// import GraphResult from './GraphResult';
import GraphResult from '@/pages/CognitiveSearchService/SearchConfigStep/SecondSearchTest/TestConfig/SearchResult/GraphResult';
import JsonResult from './JsonResult';
import CardResult from '@/pages/CognitiveSearchService/SearchConfigStep/SecondSearchTest/TestConfig/SearchResult/CardResult';
import './style.less';
import classNames from 'classnames';

export interface ResData {
  number?: number;
  res?: { search: any[]; [key: string]: any };
  time?: string;
  [key: string]: any;
}

export interface SearchResultProps {
  className?: string; // 类名
  resData: ResData; // 搜索结果数据
  kgqaResData: any; // 谱图qa数据
  page: number; // 页码
  allResData: any; // 接口返回所有数据
  view?: 'list' | 'json' | string; // 结果展现形式
  onPageChange: (page: number) => void; // 翻页
  onViewChange?: (type: 'json' | 'list' | string) => void; // 列表和json视图切换
  onCanvasClick?: (rowData: Record<string, any>) => void; // 点击路径图回调
  onCardClick?: (node: Record<string, any>) => void;
  selfState: any;
  onCatChange: any;
  testData: any;
  ref: any;
  basicData: any;
  advGaConfig?: any; // 问答高级配置意图配置
}

const PAGE_SIZE = 20; // 分页数
const { Item } = Menu;
const SearchResult: React.FC<SearchResultProps> = forwardRef((props, ref: any) => {
  const {
    className,
    resData,
    testData,
    page,
    onPageChange,
    onCardClick,
    selfState,
    onCatChange,
    kgqaResData,
    allResData,
    view,
    basicData,
    advGaConfig
  } = props;
  const location = window.location;
  const resScrollRef = useRef<any>(null); // 搜索结果滚动容器ref
  const pathScrollRef = useRef<any>(null); // 搜索路径滚动容器ref
  const preScrollTop = useRef(0); // 切换视图滚动条复位
  const [viewType, setViewType] = HOOKS.useControllableValue(props, {
    defaultValue: 'list',
    defaultPropName: 'view',
    valuePropName: 'view',
    trigger: 'onViewChange'
  }); // 结果展现形式

  const wrapperRef = useRef<any>();
  const [searchConfig, setSearchConfig] = useState<any>([]); // 全文检索位置变化(全部资源放置最前面)

  // 重置滚动条到顶部
  useEffect(() => {
    const data = _.cloneDeep(testData);
    const searchConfig = _.cloneDeep(testData?.props?.full_text?.search_config);
    const updateConfig = _.filter(searchConfig, (item: any) => item?.class_name === '全部资源');
    const unAll = _.filter(data?.props?.full_text?.search_config, (item: any) => item?.class_name !== '全部资源');
    data.props.full_text.search_config = [...updateConfig, ...unAll];
    setSearchConfig(data);
    if (resData) {
      resScrollRef.current?.scrollbars?.scrollToTop();
      pathScrollRef.current?.scrollbars?.scrollToTop();
      preScrollTop.current = 0;
    }
  }, [resData]);

  /**
   * 切换显示类型, 切换时复位滚动条
   */
  if (ref) {
    ref.current = {
      viewTypeChange: (value: string) => {
        const scrollTop = resScrollRef?.current?.scrollbars?.getScrollTop();
        setViewType(value);
        setTimeout(() => {
          resScrollRef?.current?.scrollbars?.scrollTop(preScrollTop?.current);
          preScrollTop.current = scrollTop;
        }, 0);
      }
    };
  }

  const onChange = (e: any) => {
    onCatChange(e.key);
  };

  const isOtherEmpty = () => {
    return (!kgqaResData?.count || _.isEmpty(kgqaResData)) &&
      (_.isEmpty(resData) || !resData?.count) &&
      _.isEmpty(allResData?.query_understand) &&
      (!_.isEmpty(allResData.knowledge_card) || !_.isEmpty(allResData.related_knowledge))
      ? 'none'
      : undefined;
  };

  return (
    <div className="test-complete-search-content-root kw-flex">
      <div
        className={classNames('test-complete-search-content  kw-center', className)}
        style={{
          display: isOtherEmpty() ? 'none' : undefined
        }}
      >
        <div className={`res-scroll-wrap ${viewType}`}>
          {/* qa有结果返回 但openAI连接异常   qa没结果OPEN AI连接异常 openai_status*/}
          {viewType === 'list' &&
          !_.isEmpty(kgqaResData) &&
          kgqaResData?.count &&
          !selfState.loading &&
          !kgqaResData?.openai_status ? (
            // && resData?.count
            <div className="error-box kw-mb-4">
              <IconFont type="icon-Warning" className="icon-warn" />
              {kgqaResData?.model_type === 'private_llm'
                ? intl.get('cognitiveSearch.answersOrganization.LLMSearchError')
                : intl.get('cognitiveSearch.answersOrganization.openAIInAnswersConnection')}
            </div>
          ) : viewType === 'list' &&
            !_.isEmpty(kgqaResData) &&
            !kgqaResData?.count &&
            !kgqaResData?.openai_status &&
            resData?.count ? (
            <div className="error-box kw-mb-4">
              <IconFont type="icon-Warning" className="icon-warn" />
              {kgqaResData?.model_type === 'private_llm'
                ? intl.get('cognitiveSearch.answersOrganization.LLMSearchNull')
                : intl.get('cognitiveSearch.answersOrganization.openAIInAnswersConnectionMode')}
            </div>
          ) : null}
          {viewType === 'list' && !_.isEmpty(kgqaResData) && !selfState.loading ? (
            <GraphResult res={kgqaResData} basicData={basicData} advGaConfig={advGaConfig} />
          ) : null}
          {viewType === 'json' && <JsonResult resData={allResData} />}
          {!_.isEmpty(resData) && viewType === 'list' ? (
            <>
              <div className="image-text-search-container">
                <h4 className="full-text-title">
                  {intl.get('cognitiveSearch.classify.resources')}
                  {<span>（{intl.get('cognitiveSearch.graphResults')}）</span>}
                </h4>
                <div className="full-text-menu">
                  <Menu
                    onClick={onChange}
                    mode="horizontal"
                    defaultSelectedKeys={[
                      selfState?.cat === '全部资源' ? intl.get('cognitiveSearch.classify.allResource') : selfState?.cat
                    ]}
                    getPopupContainer={node => node?.parentElement?.parentElement || document.body}
                  >
                    {searchConfig.props?.full_text?.search_config.length &&
                      _.map(searchConfig.props?.full_text?.search_config.slice(0, 4), (item: any) => {
                        return (
                          <Item
                            className="kw-ellipsis result-item"
                            key={item.class_name}
                            title={
                              item.class_name === '全部资源'
                                ? intl.get('cognitiveSearch.classify.allResource')
                                : item.class_name
                            }
                            style={{ display: 'block', maxWidth: '98px' }}
                          >
                            {item.class_name === '全部资源'
                              ? intl.get('cognitiveSearch.classify.allResource')
                              : item.class_name}
                          </Item>
                        );
                      })}
                    {searchConfig.props?.full_text?.search_config &&
                      searchConfig.props?.full_text?.search_config.length > 4 && (
                        <Menu.SubMenu key="SubMenu" title={intl.get('cognitiveSearch.more')} icon={<DownOutlined />}>
                          {_.map(searchConfig.props?.full_text?.search_config.slice(4), (item: any) => {
                            return (
                              <Item
                                className="kw-ellipsis"
                                key={item.class_name}
                                title={item.class_name}
                                style={{ display: 'block' }}
                              >
                                {item.class_name}
                              </Item>
                            );
                          })}
                        </Menu.SubMenu>
                      )}
                  </Menu>
                </div>
              </div>
              {resData?.count && viewType === 'list' ? (
                <>
                  <div className="res-info">
                    <div className="res-count">
                      {resData?.vertexs && !!resData?.execute_time ? (
                        <>
                          <span>{intl.get('searchConfig.find1')}</span>
                          <span className="number">{numToThousand(resData.count!)}</span>
                          <span>{intl.get('cognitiveSearch.results')}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div
                    className={_.isEmpty(kgqaResData) || !kgqaResData?.count ? 'res-wrapper' : 'res-wrapper-no-qa'}
                    ref={wrapperRef}
                  >
                    <KwScrollBar isShowX={false} className="res-scroll" ref={resScrollRef}>
                      <ListResult resData={resData?.vertexs} />
                      <div className={'pagination-box'}>
                        <Pagination
                          className="controlled-pagination infinite"
                          current={page}
                          total={resData?.count}
                          onChange={onPageChange}
                          pageSize={PAGE_SIZE}
                          showTitle={false}
                          showSizeChanger={false}
                        />
                      </div>
                    </KwScrollBar>
                  </div>
                </>
              ) : (
                <div className="no-complete-search-small kw-flex">
                  <NoDataBox type="NO_RESULT" />
                  {!kgqaResData?.openai_status && !_.isEmpty(kgqaResData) && (
                    <div className="sorry-tip">
                      {kgqaResData.model_type === 'private_llm'
                        ? intl.get('cognitiveSearch.answersOrganization.LLMNoResult')
                        : intl.get('cognitiveSearch.answersOrganization.sorryNoResultsFoundOpenAI')}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
          {/* 图全文展示 */}
          {_.isEmpty(resData) && _.isEmpty(kgqaResData) && !_.isEmpty(allResData.query_understand) && (
            <KwScrollBar isShowX={false} className="res-scroll-query" ref={resScrollRef}>
              <JsonResult resData={allResData} />
            </KwScrollBar>
          )}
        </div>
      </div>
      {/* 知识卡片、相关推荐搜索结果 */}
      {view === 'list' && (allResData.knowledge_card?.length || allResData.related_knowledge?.length) ? (
        <CardResult
          size={isOtherEmpty() ? 'large' : 'default'}
          data={[...(allResData.knowledge_card || []), ...(allResData.related_knowledge || [])]}
          onLabelClick={onCardClick}
        />
      ) : null}
    </div>
  );
});

export default memo(SearchResult);
