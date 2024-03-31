import React, { memo, useRef, useEffect, forwardRef } from 'react';
import { Pagination, Menu } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import ScrollBar from '@/components/ScrollBar';
import HOOKS from '@/hooks';
import { numToThousand } from '@/utils/handleFunction';
import NoDataBox from '@/components/NoDataBox';
import ListResult from './ListResult';
import JsonResult from './JsonResult';
import GraphResult from './GraphResult';
import CardResult from './CardResult';
import './style.less';
import IconFont from '@/components/IconFont';

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
  allResData: any; // 接口返回所有数据
  page: number; // 页码
  view?: 'list' | 'json' | string; // 结果展现形式
  onPageChange: (page: number) => void; // 翻页
  onViewChange?: (type: 'json' | 'list' | string) => void; // 列表和json视图切换
  onCanvasClick?: (rowData: Record<string, any>) => void; // 点击路径图回调
  onCardClick?: (node: Record<string, any>) => void;
  selfState: any;
  onCatChange: any;
  ref: any;
  isUpdate: boolean;
  searchConfig: any;
  basicData: any;
  advGaConfig: any; // 与分析高级配置
}

const PAGE_SIZE = 20; // 分页数
const { Item } = Menu;
const SearchResult: React.FC<SearchResultProps> = forwardRef((props, ref: any) => {
  const {
    className,
    resData,
    page,
    onPageChange,
    onCardClick,
    selfState,
    onCatChange,
    isUpdate,
    kgqaResData,
    allResData,
    searchConfig,
    view,
    basicData,
    advGaConfig
  } = props;
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

  // 重置滚动条到顶部
  useEffect(() => {
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

  return (
    <div className="complete-search-content-root kw-flex">
      <div
        className={`complete-search-content ${className}`}
        style={{
          display:
            (!kgqaResData?.count || _.isEmpty(kgqaResData)) &&
            (_.isEmpty(resData) || !resData?.count) &&
            _.isEmpty(allResData?.query_understand) &&
            (!_.isEmpty(allResData.knowledge_card) || !_.isEmpty(allResData.related_knowledge))
              ? 'none'
              : undefined
        }}
      >
        <div className={`res-scroll-wrap ${viewType}`}>
          {/* qa有结果返回 但openAI连接异常   qa没结果OPEN AI连接异常 openai_status*/}
          {viewType === 'list' &&
          !_.isEmpty(kgqaResData) &&
          !selfState.loading &&
          !kgqaResData?.openai_status &&
          kgqaResData?.count ? (
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
            <GraphResult res={kgqaResData} basicData={basicData} advGaConfig={advGaConfig} isUpdate={isUpdate} />
          ) : null}
          {viewType === 'json' ? <JsonResult resData={allResData} /> : null}
          {/* 图全文展示 */}
          {!_.isEmpty(resData) && viewType === 'list' ? (
            <>
              <div className="image-text-search-container">
                <h4 className="full-text-title">
                  {intl.get('cognitiveSearch.classify.resources')}
                  <span>（{intl.get('cognitiveSearch.graphResults')}）</span>
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
                    {searchConfig.props?.full_text?.search_config
                      ? _.map(searchConfig.props?.full_text?.search_config.slice(0, 4), (item: any) => {
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
                        })
                      : null}
                    {searchConfig.props?.full_text?.search_config &&
                    searchConfig.props?.full_text?.search_config.length > 4 ? (
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
                    ) : null}
                  </Menu>
                </div>
              </div>
              {resData?.count && viewType === 'list' ? (
                <>
                  <div className="res-info">
                    <div className="res-count">
                      {resData.vertexs && !!resData.execute_time ? (
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
                    <ScrollBar isshowx="false" className="res-scroll" ref={resScrollRef}>
                      <ListResult resData={resData.vertexs} />
                      <div className="pagination-box">
                        <Pagination
                          className="controlled-pagination infinite"
                          current={page}
                          total={resData.count}
                          onChange={onPageChange}
                          pageSize={PAGE_SIZE}
                          showTitle={false}
                          showSizeChanger={false}
                        />
                      </div>
                    </ScrollBar>
                  </div>
                </>
              ) : (
                <div className="no-complete-search-small kw-flex">
                  <NoDataBox.NO_RESULT />
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
          {_.isEmpty(resData) && _.isEmpty(kgqaResData) && !_.isEmpty(allResData.query_understand) ? (
            <ScrollBar isshowx="false" className="res-scroll-query" ref={resScrollRef}>
              <JsonResult resData={allResData} />
            </ScrollBar>
          ) : null}
        </div>
      </div>

      {/* 知识卡片、相关推荐搜索结果 */}
      {view === 'list' && (allResData.knowledge_card?.length || allResData.related_knowledge?.length) ? (
        <CardResult
          size={
            (!kgqaResData?.count || _.isEmpty(kgqaResData)) &&
            (_.isEmpty(resData) || !resData?.count) &&
            _.isEmpty(allResData?.query_understand)
              ? 'large'
              : 'default'
          }
          data={[...(allResData.knowledge_card || []), ...(allResData.related_knowledge || [])]}
          onLabelClick={onCardClick}
        />
      ) : null}
    </div>
  );
});

export default memo(SearchResult);
