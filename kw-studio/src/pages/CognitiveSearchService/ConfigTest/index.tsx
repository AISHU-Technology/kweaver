import React, { useState, useCallback, useReducer, useEffect, useRef } from 'react';
import { Button, Dropdown, Input, ConfigProvider, message, Menu } from 'antd';
import { LeftOutlined, DownOutlined } from '@ant-design/icons';
import { getParam } from '@/utils/handleFunction';
import classNames from 'classnames';
import cognitiveSearchService from '@/services/cognitiveSearch';
import NoDataBox from '@/components/NoDataBox';
import intl from 'react-intl-universal';
import AdSpin from '@/components/AdSpin';
import HOOKS from '@/hooks';
import _ from 'lodash';
import { useHistory, Prompt } from 'react-router-dom';
import IconFont from '@/components/IconFont';
import smileSvg from '@/assets/images/xiaolian.svg';
import configChangeSvg from '@/assets/images/config_change.svg';
import SearchResult from './SearchResult';

import './style.less';
import LoadingMask from '@/components/LoadingMask';

interface ReducerState {
  loading: boolean;
  textLoading: boolean;
  inputValue: string;
  page: number;
  cat: string;
  taskId: string;
  resultEmpty: boolean;
  isStartSearch: boolean;
}

// 分页、loading、visible等状态变量
const initState: ReducerState = {
  loading: false, // 搜索加载中
  textLoading: true,
  inputValue: '', // 输入框文字, 仅展示
  page: 1, // 当前页码
  cat: '全部资源',
  taskId: '',
  resultEmpty: false,
  isStartSearch: false
};

const DEFAULT_BODY = {
  page: 1,
  size: 1000,
  order_type: 'desc',
  order_field: 'edit_time'
};
const reducer = (state: ReducerState, action: Partial<ReducerState>) => ({ ...state, ...action });

const ConfigTest = (props: any) => {
  const { knwData, knwStudio } = props;
  const location = window.location;
  const { action } = getParam(['action']);
  const language = HOOKS.useLanguage();
  const history = useHistory();
  const [usb, setUsb] = useState({});
  const [viewType, setViewType] = useState('list'); // 搜索结果展现形式
  const [resData, setResData] = useState<any>({}); // 结果数据
  const [saveQa, setSaveQa] = useState<any>({}); // qa保存
  const [allResData, setAllResData] = useState<any>({}); // 所有返回的数据
  const [kgqaResData, setKgqaResData] = useState<any>({}); // 图谱qa返回的数据
  const [selfState, dispatchState] = useReducer(reducer, initState); // 分页、loading、visible等状态变量
  const [isTestConfig, setIsTestConfig] = useState(false); // 测试配置
  const [testData, setTestData] = useState<any>({});
  const [basicData, setBasicData] = useState<any>({});
  const [taskLoading, setTaskLoading] = useState(false);
  const [configList, setConfigList] = useState<any>([]); // 全部服务
  const [serviceInfo, setServiceInfo] = useState<any>({}); // 选中的服务
  const [inputValueSave, setInputValueSave] = useState(''); // 搜索时保存的input值
  const [isPrevent, setIsPrevent] = useState(true); // 是否阻止路由跳转
  const searchResRef = useRef<any>();
  const [iframeStatus, setIframeStatus] = useState({ loading: false, ready: false }); // iframe等待获取配置

  useEffect(() => {
    const { action, service_id } = getParam(['action', 'service_id']);
    service_id && onTest(service_id);
    if (!location.pathname.includes('iframe')) {
      init();
    }
  }, []);

  useEffect(() => {
    if (usb === 'knw') {
      onExits('knw', knwData);
      return;
    }
    if (knwStudio === 'studio') {
      onExits('studio');
    }
  }, [knwStudio, knwData]);

  /**
   * 退出
   */
  const onExits = async (type?: any, data?: any) => {
    const { knw_id } = getParam(['knw_id']);
    setIsPrevent(false);
    if (type === 'studio') {
      Promise.resolve().then(() => {
        history.push('/home');
      });
      return;
    }
    if (type === 'knw') {
      Promise.resolve().then(() => {
        history.push(`/cognitive-application/domain-intention?id=${knwData?.id}&type=search`);
      });
    }
  };

  const onTest = async (id: any) => {
    try {
      dispatchState({ loading: true, textLoading: true, inputValue: '', cat: '全部资源' });
      setResData({});
      setIframeStatus(pre => ({ ...pre, loading: true }));
      const { res } = (await cognitiveSearchService.getAppointList(id)) || {};
      setIframeStatus(pre => ({ ...pre, loading: false }));
      if (res) {
        setIframeStatus(pre => ({ ...pre, ready: true }));
        setServiceInfo(res);
        const { data_source_scope, nodes, openai_status, ...info } = res;
        const newDataSource = _.map(data_source_scope, (item: any) => {
          _.map(item.kgs, (i: any) => {
            i.source_name = item.name;
          });
          return item;
        });
        const p = { props: { data_source_scope: newDataSource, ...nodes?.[0]?.props } };
        setBasicData((pre: any) => ({ ...pre, ...info, knw_id: Number(info.knw_id), kg_id: Number(info.kg_id) }));
        setTestData({ ...p, action: 'init' });
        // setQaError(openai_status);
        onGetStatus(info?.id);
        setTaskLoading(true);
        dispatchState({ taskId: info?.id });
        setIsTestConfig(true);
      }
    } catch (err) {
      setIframeStatus(pre => ({ ...pre, loading: false }));
      dispatchState({ loading: false, textLoading: false });
      const { ErrorCode } = err?.response || err?.data || {};
      if (ErrorCode === 'KnCognition.ServicePermissionDeniedErr') {
        return message.error(intl.get('license.serAuthError'));
      }
      if (ErrorCode === 'KnCognition.GraphPermissionDeniedErr') {
        return message.error(intl.get('analysisService.noGraphAuth'));
      }
      err?.ErrorDetails && message.error(err?.ErrorDetails[0].detail);
    }
  };

  const init = async () => {
    try {
      const { res }: any = (await cognitiveSearchService.cognitiveSearchList({ ...DEFAULT_BODY })) || {};
      if (res) {
        const { results } = res;
        setConfigList(results);
      }
    } catch (err) {
      // if (!err?.type) return;

      const { Description, ErrorCode } = err?.response || err?.data || {};
      if (ErrorCode === 'KnCognition.ServicePermissionDeniedErr') {
        return message.error(intl.get('license.serAuthError'));
      }
      if (ErrorCode === 'KnCognition.GraphPermissionDeniedErr') {
        return message.error(intl.get('analysisService.noGraphAuth'));
      }
      Description && message.error(Description);
    }
  };

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

  /**
   * 获取初始化状态
   */
  const onGetStatus = async (id: any) => {
    try {
      const { res } = await cognitiveSearchService.getStatus(id);
      if (res) {
        setTaskLoading(false);
        dispatchState({ loading: false, textLoading: false });
      }
    } catch (err) {
      setTaskLoading(false);
      dispatchState({ loading: false, textLoading: false });
      if (location.pathname.includes('iframe')) {
        const { ErrorDetails } = err?.response || {};
        onErrorTip(ErrorDetails);
        return;
      }
      onErrorTip(err?.ErrorDetails);
    }
  };

  const onCatChange = useCallback(
    (e: any) => {
      onSearch({ cat: e, page: 1 }, true);
    },
    [selfState]
  );

  /**
   * 搜索
   */
  const onSearch = async (state: any = {}, isChange = false) => {
    try {
      dispatchState({ ...selfState, ..._.omit(state, 'vertices'), loading: true, textLoading: false });
      const { inputValue, page, cat, taskId }: any = { ...selfState, ...state };
      !isChange && setInputValueSave(inputValue);

      const data: any = {
        service_id: basicData.id,
        page,
        full_resource: true, // true 搜索框搜索 false 分页搜索
        size: 20,
        vertices: (state as any).vertices
        // openai_status: qaError
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
      const { res } = await cognitiveSearchService.searchTactics(data);
      setResData({});
      // setAllResData({});
      setKgqaResData({});
      if (_.isEmpty(res?.full_text) && res.query_understand !== null) {
        // setAllResData(res);
        dispatchState({
          textLoading: false,
          resultEmpty: false
        });
      } else {
        // setAllResData(res);
        dispatchState({
          textLoading: false,
          resultEmpty: true
        });
      }
      if (res?.full_text) {
        setResData(res.full_text);
        dispatchState({
          textLoading: false,
          resultEmpty: !res.full_text?.count
        });
      }
      if (!_.isEmpty(res?.kgqa)) {
        const addInputTextAsTitle = _.map(_.cloneDeep(res?.kgqa?.data), (item: any) => {
          item.title = data.query_text;
          return item;
        });

        res.kgqa.data = addInputTextAsTitle;

        setKgqaResData(res.kgqa);
        setSaveQa(res.kgqa);
        dispatchState({
          textLoading: false,
          resultEmpty: !res.kgqa?.count
        });
        // setQaError(res?.kgqa?.openai_status);
      } else {
        setKgqaResData(saveQa);
      }
      setResData(res?.full_text);
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
    } catch (err) {
      dispatchState({
        loading: false,
        textLoading: false,
        resultEmpty: true,
        isStartSearch: true
      });
      if (location.pathname.includes('iframe')) {
        const { ErrorDetails } = err?.response || {};
        onErrorTip(ErrorDetails);
        return;
      }
      onErrorTip(err?.ErrorDetails);
      setResData({});
      setAllResData({});
      setKgqaResData({});
      const { ErrorCode } = err?.response || err?.data || {};
      if (ErrorCode === 'SearchEngine.GraphPermissionDeniedErr') {
        return message.error(intl.get('analysisService.noGraphAuth'));
      }
    }
  };

  /**
   * 错误提示
   */
  const onErrorTip = (ErrorDetails: any) => {
    // 搜索
    if (ErrorDetails && ErrorDetails[0].detail.includes('has not been initialized')) {
      message.error(intl.get('cognitiveSearch.getStatusFail'));
      return;
    }
    // 初始化
    if (ErrorDetails && ErrorDetails[0].detail.includes('has not been trained successfully')) {
      message.error(intl.get('cognitiveSearch.getStatusFail'));
      return;
    }
    if (ErrorDetails?.[0]?.detail.includes("Exception('Upstream node output field mismatch.')")) {
      return;
    }
    ErrorDetails && message.error(ErrorDetails[0].detail);
  };

  // 任务轮询定时器
  HOOKS.useInterval(() => {
    if (taskLoading) {
      onGetStatus(selfState.taskId);
    }
  }, 2000);

  const SERVICE_MENUS = configList?.length ? (
    <Menu
      className="kw-search-dropdown"
      style={{ maxHeight: '370px', overflowY: 'auto', overflowX: 'hidden', width: '226px' }}
      selectedKeys={[String(serviceInfo.id)]}
    >
      {_.map(configList, item => {
        const { name, id } = item;
        const selected = String(item?.id) === id;
        return (
          <Menu.Item
            key={String(id)}
            className={classNames({ selected })}
            style={{ height: 40, width: '226px' }}
            onClick={() => {
              setServiceInfo(item);
              onTest(item.id);
            }}
          >
            <div className="kw-ellipsis" style={{ maxWidth: 196 }} title={name}>
              {name}
            </div>
          </Menu.Item>
        );
      })}
    </Menu>
  ) : (
    <></>
  );

  /**
   * 切换显示类型, 切换时复位滚动条
   */
  const onViewTypeChange = (value: string) => {
    searchResRef.current && searchResRef.current.viewTypeChange(value);
  };

  return (
    <div className="second-step-search-box-test">
      {location.pathname.includes('iframe') && (
        <div className="iframe-loading-mask" style={{ display: iframeStatus.ready ? 'none' : undefined }}>
          <LoadingMask loading={iframeStatus.loading} />
        </div>
      )}
      {!location.pathname.includes('iframe') && (
        <div className="top-header kw-align-center">
          {location.pathname.includes('iframe') ? null : (
            <Button onClick={() => onExits('knw')} type="text" className="kw-pl-6 kw-center exit-btn">
              <LeftOutlined />
              <span className="exit-operate">{intl.get('global.exit')}</span>
            </Button>
          )}
          <Dropdown overlay={SERVICE_MENUS} trigger={['click']} placement="bottomLeft">
            <div className={`${location.pathname.includes('iframe') && 'kw-pl-6'} s-name kw-align-center kw-pointer`}>
              <div className="kw-ellipsis" style={{ maxWidth: 160 }}>
                {serviceInfo.name || ''}
              </div>
              <DownOutlined className="kw-ml-2" style={{ fontSize: 13 }} />
            </div>
          </Dropdown>
        </div>
      )}
      <div className={classNames('first-step-box kw-flex', { 'second-test-step': action === 'test' })}>
        <div className="place-box"></div>
        {/* 搜索结果 */}
        <div
          className={classNames('file-right', {
            'has-card': allResData.knowledge_card?.length || allResData.related_knowledge?.length
          })}
        >
          {selfState.loading && (
            <div className={`loading-mask ${selfState.loading && 'spinning'}`}>
              <div className="spin-content-box kw-flex">
                <AdSpin />
                {selfState.textLoading && (
                  <div className={language === 'zh-CN' ? 'loading-content' : 'loading-us'}>
                    {intl.get('cognitiveSearch.loading')}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="search-header kw-flex kw-mt-6">
            <Input
              allowClear
              value={selfState.inputValue}
              placeholder={intl.get('searchConfig.pleaseInput')}
              onPressEnter={() => onSearch({ page: 1 }, false)}
              onChange={e => {
                dispatchState({ inputValue: e.target.value, isStartSearch: false });
              }}
              className="search-header-input"
              prefix={<IconFont type="icon-sousuo" style={{ opacity: '0.25' }} />}
            />
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button type="primary" className="search-btn" onClick={() => onSearch({ page: 1 }, false)}>
                {intl.get('global.search')}
              </Button>
            </ConfigProvider>
            {/* {(resData?.count || kgqaResData?.count) */}
            {(!_.isEmpty(resData) || !_.isEmpty(kgqaResData)) && !location.pathname.includes('iframe') ? (
              <div className="view-btn" onClick={() => onViewTypeChange(viewType === 'list' ? 'json' : 'list')}>
                <span className="label-text">
                  {viewType === 'list' ? intl.get('searchConfig.switchJson') : intl.get('searchConfig.switchDoc')}
                </span>
              </div>
            ) : null}
          </div>

          {/* {((_.isEmpty(resData) || !resData?.count) && */}
          {(_.isEmpty(resData) &&
            (_.isEmpty(kgqaResData) || !kgqaResData?.count) &&
            _.isEmpty(allResData.query_understand) &&
            !location.pathname.includes('iframe') &&
            _.isEmpty(allResData.knowledge_card) &&
            _.isEmpty(allResData.related_knowledge) &&
            !selfState.loading) ||
          (location.pathname.includes('iframe') &&
            // (_.isEmpty(resData) || !resData?.count) &&
            _.isEmpty(resData) &&
            (_.isEmpty(kgqaResData) || !kgqaResData?.count) &&
            _.isEmpty(allResData.knowledge_card) &&
            _.isEmpty(allResData.related_knowledge) &&
            !selfState.loading) ? (
            <>
              {!selfState.isStartSearch ? (
                <div className="no-complete-search">
                  <img src={configChangeSvg} alt="empty" />
                  <div>{intl.get('cognitiveSearch.enterSearch')}</div>
                </div>
              ) : (
                <div className="no-complete-search">
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
          ) : (
            isTestConfig &&
            !selfState.loading && (
              <SearchResult
                ref={searchResRef}
                onCardClick={onCardClick}
                onPageChange={onPageChange}
                onViewChange={setViewType}
                view={viewType}
                allResData={allResData}
                resData={resData}
                kgqaResData={kgqaResData}
                page={selfState.page}
                selfState={selfState}
                onCatChange={onCatChange}
                testData={testData}
                basicData={basicData}
                advGaConfig={serviceInfo?.nodes?.[0]?.props?.kgqa?.adv_config?.ga_config}
              />
            )
          )}
        </div>
      </div>
      <Prompt
        when={isPrevent}
        message={location => {
          setUsb('knw');
          return false;
        }}
      />
    </div>
  );
};

export default ConfigTest;
