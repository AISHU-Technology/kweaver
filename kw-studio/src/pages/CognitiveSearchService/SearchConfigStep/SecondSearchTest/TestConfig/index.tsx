import React, { useCallback, useRef, useState } from 'react';
import { Input, ConfigProvider, Button, message } from 'antd';
import IconFont from '@/components/IconFont';
import _ from 'lodash';
import cognitiveSearchService from '@/services/cognitiveSearch';
import intl from 'react-intl-universal';
import HOOKS from '@/hooks';
import NoDataBox from '@/components/NoDataBox';
import configChange from '@/assets/images/config_change.svg';
import configEmpty from '@/assets/images/strategyEmpty.svg';
import SearchResult from './SearchResult';

import './style.less';
import classNames from 'classnames';

const tipContent = [
  intl.get('cognitiveSearch.otherFirst'),
  intl.get('cognitiveSearch.otherSecond'),
  intl.get('cognitiveSearch.otherThird')
];

const TestConfig = (props: any) => {
  const {
    isShowInput,
    selfState,
    setResData,
    setKgqaResData,
    setAllResData,
    setSaveQa,
    saveQa,
    dispatchState,
    resData,
    kgqaResData,
    allResData,
    isTestConfig,
    testData,
    setTestData,
    isUpdate,
    checked,
    searchConfig,
    setChecked,
    setIsOpenQA,
    setQaError,
    setEmError,
    basicData,
    advGaConfig
  } = props;
  const language = HOOKS.useLanguage();
  const searchResRef = useRef<any>();
  const [inputValueSave, setInputValueSave] = useState(''); // 搜索时保存的input值
  const [viewType, setViewType] = useState('list'); // 搜索结果展现形式

  const onCatChange = useCallback(
    (e: any) => {
      onSearch({ cat: e, page: 1 }, true);
    },
    [selfState]
  );

  /**
   * 翻页
   * @param page 变化的页码
   */
  const onPageChange = useCallback(
    (page: number) => {
      onSearch({ page }, true);
    },
    [selfState]
  );

  /**
   * 点击卡片相关词条触发搜索
   */
  const onCardClick = useCallback(
    (node: any) => {
      onSearch(
        {
          inputValue: node.default_property?.value,
          vertices: [{ kg_id: node.kg_id, vid: node.id }],
          page: 1
        },
        false
      );
    },
    [selfState]
  );

  const onInputChange = (e: any) => {
    dispatchState({ inputValue: e.target.value, isStartSearch: false });
  };

  /**
   * 搜索
   * P_BUTTON 测试配置搜索
   */
  const onSearch = async (state: any = {}, isChange = false) => {
    try {
      const { inputValue = '', page = 1, cat = '全部资源', taskId = '' } = { ...selfState, ...state };
      !isChange && setInputValueSave(inputValue);
      dispatchState({ ...selfState, ..._.omit(state, 'vertices'), loading: true, textLoading: false });

      const data: any = {
        service_id: taskId,
        page,
        full_resource: true, // true 搜索框搜索 false 分页搜索
        size: 20,
        vertices: state.vertices
      };
      if (isChange) {
        data.query_text = inputValueSave;
      } else {
        data.query_text = inputValue;
      }
      if (cat && cat !== '全部资源') {
        data.cat = 'df';
        data.cat = cat;
        data.full_resource = false;
      }

      const { res } = await cognitiveSearchService.searchTest(data);
      setResData({});
      setKgqaResData({});

      if (_.isEmpty(res?.full_text) && res.query_understand !== null) {
        dispatchState({
          textLoading: false,
          resultEmpty: false
        });
      } else {
        dispatchState({
          textLoading: false,
          resultEmpty: true
        });
      }
      if (res?.full_text) {
        dispatchState({
          textLoading: false,
          resultEmpty: res.full_text?.count === 0
        });
        setResData(res.full_text);
      }
      if (!_.isEmpty(res?.kgqa)) {
        // OPEN AI

        setQaError(res?.kgqa?.openai_status ? '' : res?.kgqa?.model_type || 'openai');
        setEmError(res?.kgqa?.embed_model_status);

        const addInputTextAsTitle = _.map(_.cloneDeep(res?.kgqa?.data), (item: any) => {
          item.title = data.query_text;
          return item;
        });

        res.kgqa.data = addInputTextAsTitle;
        setKgqaResData(res.kgqa);
        setSaveQa(res.kgqa);
        dispatchState({
          textLoading: false,
          resultEmpty: res.kgqa?.count === 0
        });
      } else {
        // 如果Qa开关为关，则数据保存为空
        setKgqaResData(saveQa);
      }
      // 全都没有结果并且openAI连接异常
      if (
        _.isEmpty(res?.full_text || !res?.full_text?.count) &&
        !_.isEmpty(res?.kgqa) &&
        _.isEmpty(res.query_understand) &&
        _.isEmpty(res?.knowledge_card) &&
        _.isEmpty(res?.related_knowledge) &&
        !res?.kgqa?.openai_status
      ) {
        setQaError(res?.kgqa?.model_type || 'openai');
      }
      setAllResData(
        res
          ? (pre: any) => {
              // 翻页的时候保留知识卡片和推荐
              if (isChange && _.keys(state).length === 1 && _.isNumber(state.page) && state.page !== 1) {
                return { ...res, ..._.pick(pre, 'knowledge_card', 'related_knowledge') };
              }
              return res;
            }
          : {}
      );
      dispatchState({ loading: false, isStartSearch: true });
    } catch (_err) {
      dispatchState({
        loading: false,
        textLoading: false,
        resultEmpty: true,
        isStartSearch: true
      });
      const err = _err?.response || _err;
      if (err?.ErrorDetails && err?.ErrorDetails[0].detail.includes('has not been initialized')) {
        message.error(intl.get('cognitiveSearch.getStatusFail'));
        return;
      }
      if (err?.ErrorDetails[0].detail.includes('is not found under')) {
        const kgId = err?.ErrorDetails[0].detail.split("This '")[1].split("' ")[0];
        const allData = _.cloneDeep(testData);
        const sourceScope = _.cloneDeep(testData?.props?.data_source_scope);
        const deleteName = _.filter(sourceScope, (item: any) => item?.kg_id === parseInt(kgId));
        const filterScope = _.filter(allData?.props?.data_source_scope, (item: any) => item?.kg_id !== parseInt(kgId));
        const filterFull = _.map(allData?.props?.full_text?.search_config, (item: any) => {
          item.kgs = _.filter(item?.kgs, (i: any) => i?.kg_id !== parseInt(kgId));
          return item;
        });
        const filterDelete = _.filter(filterFull, (item: any) => !_.isEmpty(item?.kgs));

        allData.props.data_source_scope = filterScope;
        allData.props.full_text.search_config = filterDelete;
        // 资源为空,配置项中全文检索和图谱qa开关关闭
        if (_.isEmpty(filterScope)) {
          setChecked({ ...checked, ...{ checked: false, qAChecked: false } });
          setIsOpenQA(false);
        }
        setTestData(allData);
        message.error(intl.get('cognitiveSearch.deleteTip', { name: deleteName?.[0]?.kg_name }));

        return;
      }
      err?.ErrorDetails && message.error(err?.ErrorDetails[0].detail);
      setResData({});
      setAllResData({});
      setKgqaResData({});
    }
  };

  const onViewTypeChange = (value: string) => {
    searchResRef.current && searchResRef.current.viewTypeChange(value);
  };

  return (
    <div className="file-right-test-config-bg">
      <div
        className={classNames('file-right-test-config', {
          'has-card': allResData.knowledge_card?.length || allResData.related_knowledge?.length
        })}
      >
        {isShowInput && (
          <>
            <div className="search-header kw-flex kw-mt-6">
              <Input
                allowClear
                value={selfState.inputValue}
                placeholder={intl.get('searchConfig.pleaseInput')}
                onPressEnter={() => onSearch({ page: 1 }, false)}
                onChange={onInputChange}
                className="search-header-input"
                prefix={<IconFont type="icon-sousuo" style={{ opacity: '0.25' }} />}
              />
              <ConfigProvider autoInsertSpaceInButton={false}>
                <Button type="primary" className="search-btn" onClick={() => onSearch({ page: 1 }, false)}>
                  {intl.get('global.search')}
                </Button>
              </ConfigProvider>
              {!_.isEmpty(resData) || !_.isEmpty(kgqaResData) ? (
                <div className="view-btn" onClick={() => onViewTypeChange(viewType === 'list' ? 'json' : 'list')}>
                  <span className="label-text">
                    {viewType === 'list' ? intl.get('searchConfig.switchJson') : intl.get('searchConfig.switchDoc')}
                  </span>
                </div>
              ) : null}
            </div>
            {_.isEmpty(resData) &&
            (_.isEmpty(kgqaResData) || !kgqaResData?.count) &&
            _.isEmpty(allResData.query_understand) &&
            _.isEmpty(allResData.knowledge_card) &&
            _.isEmpty(allResData.related_knowledge) &&
            !selfState.loading ? (
              <>
                {!selfState.isStartSearch ? (
                  <div className="no-complete-search">
                    <img src={configChange} alt="empty" />
                    <div>{intl.get('cognitiveSearch.enterSearch')}</div>
                  </div>
                ) : (
                  <div className="no-complete-search">
                    <NoDataBox type="NO_RESULT" />
                    {/* OPEN AI */}
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
            ) : (
              isTestConfig &&
              !selfState.loading && (
                <SearchResult
                  ref={searchResRef}
                  onPageChange={onPageChange}
                  onViewChange={setViewType}
                  view={viewType}
                  resData={resData}
                  kgqaResData={kgqaResData}
                  allResData={allResData}
                  page={selfState.page}
                  selfState={selfState}
                  onCatChange={onCatChange}
                  isUpdate={isUpdate}
                  searchConfig={searchConfig}
                  onCardClick={onCardClick}
                  basicData={basicData}
                  advGaConfig={advGaConfig}
                />
              )
            )}
          </>
        )}
        {!selfState.loading && !isTestConfig && (
          <div className="no-complete-search">
            <img src={configEmpty} alt="empty" />
            <div className="full-tip" style={{ width: language === 'zh-CN' ? '266px' : '387px' }}>
              {_.map(tipContent, (item: any, index: any) => {
                return (
                  <div key={index} className="tip-content kw-c-subtext">
                    {item}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestConfig;
