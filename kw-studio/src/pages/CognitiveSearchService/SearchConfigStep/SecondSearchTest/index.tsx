/* eslint-disable max-lines */
import React, { useState, useReducer, useEffect, useRef, useMemo } from 'react';
import { Button, message } from 'antd';
import { getParam } from '@/utils/handleFunction';
import HOOKS from '@/hooks';
import AdSpin from '@/components/AdSpin';
import classnames from 'classnames';
import cognitiveSearchService from '@/services/cognitiveSearch';
import intl from 'react-intl-universal';
import _ from 'lodash';

import QuerySettingModal from './QuerySettingModal';
import SearchRange from './SearchRange';
import FullTextQA from './FullTextQA';
import TestConfig from './TestConfig';
import PC_ConfigModal from './PC_ConfigModal';
import {
  onHandleConfig,
  onHandleGraph,
  initConfs,
  checkProperty,
  getPropertyRes,
  handleKnwCardKgId,
  handleRelatedKgId
} from './assistFunction';

import Configuration from './Configuration';
import ResourceClassification from './ResourceClassification';
import './style.less';

// 知识卡片和相关推荐组件
import ScoreThresholdModal from '../../KnowledgeCard/components/ScoreThresholdModal';
import WeightSortingModal from '../../KnowledgeCard/components/WeightSortingModal';
import KnowledgeCardModal from '../../KnowledgeCard/Modal';
import { getDefaultCardConfigs } from './enum';
import { TCardConfigs } from './types';
import QaAdvanceConfig from '../../QaAdvConfig';

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
  textLoading: true, // 搜索加载中
  inputValue: '', // 输入框文字, 仅展示
  page: 1, // 当前页码
  cat: '全部资源',
  taskId: '',
  resultEmpty: false,
  isStartSearch: false
};
type AuthErrorType = {
  qa: boolean;
  range: boolean;
  classify: boolean;
};
const reducer = (state: ReducerState, action: Partial<ReducerState>) => ({ ...state, ...action });
const SecondSearchTest = (props: any) => {
  const {
    onNext,
    onPrev,
    step,
    setTestData,
    basicData,
    setBasicData,
    operateFail,
    setOperateFail,
    setQuerySave,
    operateSave,
    setOperateSave,
    setChecked,
    testData,
    checked,
    isOpenQA,
    setIsOpenQA,
    kgqaData,
    setKgqaData,
    kgqaConfig,
    setKgqaConfig,
    saveConfs,
    isClassifySetting,
    setIsClassifySetting,
    qaError,
    setQaError,
    setEmError,
    advError,
    isQAConfigError,
    setIsQAConfigError,
    externalModel,
    onUpdateTableData,
    onUpdateTableForLarge
  } = props;
  const searchTest = window.location.pathname;
  const { action } = getParam(['action']);
  const [queryModal, setQueryModal] = useState(false); // Query理解弹窗
  const [fullTextModal, setFullTextModal] = useState(false); // 高级搜索弹窗
  const [qaModal, setQaModal] = useState(false); // 图谱Qa弹窗
  const [canvasConfigModal, setCanvasConfigModal] = useState(false); // 画布配置弹窗
  const [resData, setResData] = useState<any>({}); // 结果数据
  const [saveQa, setSaveQa] = useState<any>({}); // qa保存
  const [kgqaResData, setKgqaResData] = useState<any>({}); // 图谱qa返回的数据
  const [allResData, setAllResData] = useState<any>({}); // 所有返回的数据
  const [selfState, dispatchState] = useReducer(reducer, initState); // 分页、loading、visible等状态变量
  const [isTestConfig, setIsTestConfig] = useState(false); // 测试配置
  const [fullContent, setFullContent] = useState<any>([]);
  const [isSwitchDisable, setIsSwitchDisable] = useState<'kg' | 'model' | 'all' | ''>(''); // kg-无图谱资源 model-无模型资源，all-都无
  const [taskLoading, setTaskLoading] = useState(false);
  const [isShowInput, setIsShowInput] = useState(false);
  const [textIsDisable, setTextIsDisable] = useState(false);
  const [graphQaConfs, setGraphQaConfs] = useState<any>([]); // 初始化图谱配置
  const [qaStep, setQaStep] = useState(1); // qa配置 1-参数配置 2-问答配置
  const [authError, setAuthError] = useState<AuthErrorType>({
    qa: false,
    range: false,
    classify: false
  }); // 权限错误
  const [isUpdate, setIsUpdate] = useState(false); // 测试配置点击更新搜索结果的分类

  // 知识卡片和相关推荐
  const [cardConfigs, setCardConfigs] = useState<TCardConfigs>(() => getDefaultCardConfigs());
  const [recommendConfigs, setRecommendConfigs] = useState<TCardConfigs>(() => getDefaultCardConfigs());
  const [scoreController, setScoreController] = useState({ visible: false, type: '', score: 0.8 });
  const [weightsController, setWeightsController] = useState({
    visible: false,
    type: '',
    data: [] as TCardConfigs['weights']
  });
  const [cardController, setCardController] = useState({
    visible: false,
    type: '',
    data: [] as TCardConfigs['entity_cards'],
    testOptions: {} as any
  });
  const [advConfigController, setAdvConfigController] = useState({ visible: false });
  const classifyRef = useRef<any>({});
  // 添加分类后，搜索结果中的分类不应该实时更新
  const searchConfig = useMemo(() => {
    if (isUpdate) {
      const data = _.cloneDeep(testData);
      const searchConfigClone = _.cloneDeep(testData?.props?.full_text?.search_config);
      const updateConfig = _.filter(searchConfigClone, (item: any) => item?.class_name === '全部资源');
      const unAll = _.filter(data?.props?.full_text?.search_config, (item: any) => item?.class_name !== '全部资源');
      data.props.full_text.search_config = [...updateConfig, ...unAll];
      classifyRef.current.testData = data;
      return data || [];
    }
    return classifyRef?.current?.testData;
  }, [isUpdate]);

  useEffect(() => {
    onHandleTestSwitch(checked);
    handleCardSwitch(checked);
  }, [testData?.props?.data_all_source, checked, isOpenQA]);

  // 更新知识卡片和推荐
  useEffect(() => {
    if (testData.action !== 'init') return;
    testData?.props?.knowledge_card && setCardConfigs(testData?.props?.knowledge_card);
  }, [testData?.props?.knowledge_card]);
  useEffect(() => {
    if (testData.action !== 'init') return;
    testData?.props?.related_knowledge && setRecommendConfigs(testData?.props?.related_knowledge);
  }, [testData?.props?.related_knowledge]);

  useEffect(() => {
    const allSource = _.cloneDeep(testData?.props?.data_all_source);
    if (allSource?.length) {
      (async () => {
        const allExistIds = _.map(testData?.props?.data_source_scope, (item: any) => {
          return String(item?.kg_id);
        });
        const propertyRes = await getPropertyRes(testData?.props?.data_source_scope);
        const noRepeat = [...new Set(allExistIds)];
        const filterArr = _.filter(propertyRes?.data, (item: any) => noRepeat.includes(item?.kg_id));
        const kgqaDATA = {
          props: {
            ...kgqaData.props,
            data_source_scope: testData?.props?.data_source_scope,
            confs: filterArr
          }
        };

        if (!_.isEmpty(saveConfs) && _.isEmpty(kgqaDATA.props.saveConfs)) {
          kgqaDATA.props.saveConfs = saveConfs;
        }
        setKgqaData(kgqaDATA);
        const newConfig = initConfs(kgqaDATA);
        setGraphQaConfs(newConfig);
      })();
    }
  }, [testData?.props?.data_all_source, saveConfs]);

  /**
   * 开关-测试配置(禁止点击或可以点击) 状态
   */
  const onHandleTestSwitch = (checked: any) => {
    const kgEmpty = _.isEmpty(testData?.props?.data_source_scope);
    const allSource = _.cloneDeep(testData?.props?.data_all_source);
    const modelEmpty = _.isEmpty(_.filter(allSource, (item: any) => item?.sub_type === 'embbeding_model') || []);
    if (kgEmpty && modelEmpty) {
      setIsSwitchDisable('all');
      setKgqaResData({});
    } else {
      if (kgEmpty) return setIsSwitchDisable('kg');
      if (modelEmpty) return setIsSwitchDisable('model');
      setIsSwitchDisable('');
    }
    // 开关均未开启
    const boolKeys = ['checked', 'queryChecked', 'qAChecked', 'card', 'recommend'];
    const hasChecked = _.some(_.values(_.pick(checked, boolKeys)), Boolean);
    setTextIsDisable(!hasChecked);
  };

  /**
   * 菜单变更
   */
  const onHandleCancel = (isUpdate = false) => {
    setQueryModal(false);
    setFullTextModal(false);
    setQaModal(false);
    !isUpdate && setFullContent([]);
  };

  /**
   * 初始化
   */
  const onTextConfig = async (isRefresh = false) => {
    // 开关都关闭
    if (!checked?.checked && !isRefresh && !checked?.queryChecked && !isOpenQA && !checked.card && !checked.recommend) {
      message.warning(intl.get('cognitiveSearch.openMode'));
      return;
    }
    if (qaError || isQAConfigError) {
      message.warning(intl.get('cognitiveSearch.graphQA.checkPropertyError'));
      return;
    }

    // 卡片和推荐未配置
    if (isCardError()) return;
    if (textIsDisable) return;
    const { action } = getParam(['action']);

    setSaveQa({});
    setOperateFail(false);
    setTextIsDisable(true);
    const { knw_id } = basicData;
    const data_source_scope = onHandleGraph(testData.props?.data_all_source);
    const search_config = onHandleConfig(testData.props?.full_text?.search_config);
    // 处理知识卡片图谱id类型
    const knowledge_card = handleKnwCardKgId(cardConfigs);
    const related_knowledge = handleRelatedKgId(recommendConfigs);
    let data: any = {
      knw_id: String(knw_id),
      openai_status: !qaError,
      auto_wire: true,
      data_source_scope,
      nodes: [
        {
          props: {
            full_text: {
              search_config,
              switch: checked?.checked
            },
            kgqa: { switch: false },
            knowledge_card,
            related_knowledge
          }
        }
      ]
    };

    // 新建配置
    const { s_id } = getParam(['s_id']);
    data = onHandleQa(data, s_id);

    if (action !== 'create') {
      data.id = basicData.id;
    }
    dispatchState({ inputValue: '', resultEmpty: false, cat: '全部资源', loading: false, textLoading: false });
    setResData({});
    setAllResData({});
    setKgqaResData({});

    try {
      const { res } = await cognitiveSearchService.getInitialization(data);
      if (res) {
        onGetStatus(res);
        dispatchState({ taskId: res, loading: true, textLoading: true, isStartSearch: false });
        setTaskLoading(true);
      }
      setIsUpdate(true);
      setIsTestConfig(true);
    } catch (err) {
      dispatchState({ loading: false, textLoading: false });
      setTaskLoading(true);

      // 资源被删除，删除对应的分类里的资源(分类中只有一个已被删除的资源，则删除分类)
      if (err?.ErrorDetails?.[0]?.detail?.includes('is not found under')) {
        onHandleClassify(err);
        return;
      }

      const { ErrorCode } = err?.data || err || {};
      if (ErrorCode === 'SearchEngine.GraphPermissionDeniedErr') {
        return message.error(intl.get('analysisService.noGraphAuth'));
      }

      err?.ErrorDetails && message.error(err?.ErrorDetails[0].detail);
    }
  };

  /**
   * 处理qa传参
   */
  const onHandleQa = (data: any, s_id: any) => {
    if (!s_id) {
      let confTmp = {};
      let kgqaDataTmp: any = {};
      if (!_.isEmpty(kgqaConfig?.confs)) {
        const qaConfig = _.cloneDeep(kgqaConfig);
        const newKgqa = _.map(qaConfig?.confs, (item: any) => {
          item.kg_id = String(item?.kg_id);
          return item;
        });
        kgqaConfig.confs = newKgqa;
        confTmp = kgqaConfig.confs;
        kgqaDataTmp = kgqaConfig;
      } else {
        confTmp = graphQaConfs;
        kgqaDataTmp = {
          limit: kgqaData?.props?.limit,
          threshold: kgqaData?.props?.threshold,
          ans_organize: kgqaData?.props?.ans_organize,
          confs: [...graphQaConfs],
          switch: isOpenQA,
          adv_config: kgqaConfig?.adv_config
        };
      }
      if (isOpenQA && !checkProperty(confTmp)) {
        message.warning(intl.get('cognitiveSearch.graphQA.checkPropertyError'));
        setIsQAConfigError(true);
        return false;
      }
      kgqaDataTmp.exploration_switch = checked.qaSubgraph;
      data.nodes[0].props.kgqa = kgqaDataTmp;
    } else {
      // 修改之后配置
      let configTmp;
      if (!_.isEmpty(kgqaConfig)) {
        // 手动修改配置
        kgqaConfig.switch = isOpenQA;
        configTmp = kgqaConfig;
      } else if (!_.isEmpty(kgqaData.props.saveConfs)) {
        // 点击编辑按钮获取到配置
        const confsArr = initConfs(kgqaData);
        configTmp = {
          ...kgqaData.props.saveConfs,
          confs: [...confsArr]
        };
        configTmp.switch = isOpenQA;
      }
      if (isOpenQA && !checkProperty(configTmp?.confs)) {
        message.warning(intl.get('cognitiveSearch.graphQA.checkPropertyError'));
        setIsQAConfigError(true);
        return false;
      }
      configTmp.exploration_switch = checked.qaSubgraph;
      data.nodes[0].props.kgqa = configTmp;
    }
    return data;
  };

  /**
   * 资源被删除，分类中的资源处理
   */
  const onHandleClassify = (err: any) => {
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
  };

  /**
   * 获取初始化状态
   */
  const onGetStatus = async (id: any) => {
    try {
      const { res } = await cognitiveSearchService.getStatus(id);
      if (res) {
        setTaskLoading(false);
        dispatchState({ loading: false, textLoading: false });
        setIsShowInput(true);
      }
    } catch (err) {
      setTaskLoading(false);
      dispatchState({ loading: false, textLoading: false });
      if (err?.ErrorDetails && err?.ErrorDetails[0].detail.includes('has not been trained successfully')) {
        message.error(intl.get('cognitiveSearch.getStatusFail'));
        return;
      }
      const { ErrorCode } = err?.data || err || {};
      if (ErrorCode === 'SearchEngine.GraphPermissionDeniedErr') {
        return message.error(intl.get('analysisService.noGraphAuth'));
      }
      if (err?.ErrorDetails?.[0]?.detail.includes("Exception('Upstream node output field mismatch.')")) {
        return;
      }
      err?.ErrorDetails && message.error(err?.ErrorDetails[0].detail);
    }
  };

  // 任务轮询定时器
  HOOKS.useInterval(() => {
    if (taskLoading && step === 1) {
      onGetStatus(selfState.taskId);
    }
  }, 2000);

  /**
   * 保存
   */
  const onSaveDefault = () => {
    setQuerySave(true);
    setTextIsDisable(false);
    setIsUpdate(false);
  };

  /**
   * 下一步
   */
  const onIsNext = async () => {
    // Query理解、图全文检索均未开启点击下一步，toast提示
    if (!checked?.checked && !checked?.queryChecked && !isOpenQA && !checked.card && !checked.recommend) {
      message.warning(intl.get('cognitiveSearch.openMode'));
      return;
    }
    if (qaError) {
      message.warning(intl.get('cognitiveSearch.graphQA.checkPropertyError'));
      return;
    }
    if (isCardError()) return;
    setOperateFail(false);
    emitCardConfigs();
    onNext(2);
  };

  /**
   * 权限错误
   */
  const onAuthError = (data: Partial<AuthErrorType>) => {
    setAuthError(pre => ({ ...pre, ...data }));
  };

  /*
   * 各配置保存后测试配置结果中显示的分类不更新
   */
  const onNotUpdate = () => {
    setIsUpdate(false);
  };

  /**
   * 修改实体得分阈值
   */
  const onScoreChange = (value: number) => {
    const updateFunc = scoreController.type === 'card' ? setCardConfigs : setRecommendConfigs;
    setScoreController({ visible: false, type: '', score: 0.8 });
    updateFunc(pre => ({ ...pre, score_threshold: value }));
    setTextIsDisable(false);
  };

  /**
   * 修改实体类结果的权重
   */
  const onWeightsChange = (data: TCardConfigs['weights']) => {
    const updateFunc = weightsController.type === 'card' ? setCardConfigs : setRecommendConfigs;
    setWeightsController({ visible: false, type: '', data: [] });
    updateFunc(pre => ({ ...pre, weights: data }));
    setTextIsDisable(false);
  };

  /**
   * 更新卡片配置
   */
  const onCardChange = (data: TCardConfigs['entity_cards']) => {
    const updateFunc = cardController.type === 'card' ? setCardConfigs : setRecommendConfigs;
    const checked = cardController.type === 'card' ? cardConfigs.switch : recommendConfigs.switch;
    const error = checked && !data.length;
    setCardController({ visible: false, type: '', data: [], testOptions: {} });
    updateFunc(pre => ({ ...pre, entity_cards: data, error }));
    setTextIsDisable(false);
  };

  /**
   * 更新知识卡片和推荐的开关
   * @param checked
   */
  const handleCardSwitch = (checked: Record<string, boolean>) => {
    setCardConfigs(pre => {
      if (_.isBoolean(checked.card) && checked.card !== pre.switch) {
        const error = checked.card && !pre.entity_cards?.length;
        return { ...pre, switch: checked.card, error };
      }
      return pre;
    });
    setRecommendConfigs(pre => {
      if (_.isBoolean(checked.recommend) && checked.recommend !== pre.switch) {
        const error = checked.recommend && !pre.entity_cards?.length;
        return { ...pre, switch: checked.recommend, error };
      }
      return pre;
    });
  };

  /**
   * 提交保存卡片配置
   */
  const emitCardConfigs = () => {
    setTestData((pre: any) => ({
      ...pre,
      props: {
        ...pre.props,
        knowledge_card: _.omit(cardConfigs, 'error'),
        related_knowledge: _.omit(recommendConfigs, 'error')
      }
    }));
  };

  /**
   * 卡片或推荐是否有误
   */
  const isCardError = () => {
    if (cardConfigs.switch && _.isEmpty(cardConfigs.entity_cards)) {
      message.warning(intl.get('knowledgeCard.cardWarning'));
      return true;
    }
    if (recommendConfigs.switch && _.isEmpty(recommendConfigs.entity_cards)) {
      message.warning(intl.get('knowledgeCard.recommendWarning'));
      return true;
    }
    return false;
  };

  /**
   * 打开弹窗的助手
   */
  const openModalHelper = (options: {
    configType: 'qa' | 'card' | 'recommend';
    modalType: 'answerOrganization' | 'score' | 'weights' | 'card' | 'advconfig';
  }) => {
    const { configType, modalType } = options;
    switch (modalType) {
      case 'score':
        setScoreController({
          visible: true,
          type: configType,
          score: configType === 'card' ? cardConfigs.score_threshold : recommendConfigs.score_threshold
        });
        break;
      case 'weights':
        setWeightsController({
          visible: true,
          type: configType,
          data: _.cloneDeep(configType === 'card' ? cardConfigs.weights : recommendConfigs.weights)
        });
        break;
      case 'card':
        setCardController({
          visible: true,
          type: configType,
          data: _.cloneDeep(configType === 'card' ? cardConfigs.entity_cards : recommendConfigs.entity_cards),
          testOptions: _.cloneDeep(
            _.pick(configType === 'card' ? cardConfigs : recommendConfigs, 'score_threshold', 'weights')
          )
        });
        break;
      case 'advconfig':
        setAdvConfigController({ visible: true });
        break;
      default:
        break;
    }
  };

  /**
   * 基础配置保存后部分功能恢复默认
   */
  const onHandleSave = () => {
    setQaError('');
    onSaveDefault();
    onHandleCancel();
    message.success(intl.get('global.saveSuccess'));
  };

  /**
   * 取消获取初始化状态
   */
  const onCancel = () => {
    setTaskLoading(false);
    dispatchState({ loading: false, textLoading: false, taskId: '' });
    setTextIsDisable(false);
  };

  /** 保存qa高级配置 */
  const setQaAdvanceConfig = (config: any) => {
    onSaveDefault();
    setKgqaConfig((pre: any) => ({ ...pre, adv_config: config }));
  };

  return (
    <div className="second-step-search-box-classify kw-h-100 kw-w-100">
      <div className="kw-flex second-box kw-h-100">
        {/* loading加载 */}
        {selfState.loading && (
          <div className={`loading-mask ${selfState.loading && 'spinning'}`}>
            <div className="spin-content-box kw-flex">
              <AdSpin />
              {selfState.textLoading && (
                <div className="loading-content">
                  {intl.get('cognitiveSearch.loading')}
                  <span onClick={onCancel} className="kw-c-link kw-pointer kw-ml-3">
                    {intl.get('exploreGraph.cancelOperation')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        <div className={classnames('first-step-box', { 'second-test-step': action === 'test' })}>
          {isClassifySetting ? (
            // 资源分类
            <ResourceClassification
              testData={testData}
              setTestData={setTestData}
              visible={isClassifySetting}
              isClassifySetting={isClassifySetting}
              onAuthError={onAuthError}
              onNotUpdate={onNotUpdate}
            />
          ) : (
            <div className="kw-w-100 config-box">
              {/* 配置项 */}
              <div className="kw-flex kw-w-100 config-result">
                <Configuration
                  authError={authError}
                  checked={checked}
                  setChecked={setChecked}
                  onTextConfig={onTextConfig}
                  qaError={qaError}
                  isSwitchDisable={isSwitchDisable}
                  textIsDisable={textIsDisable}
                  setFullTextModal={setFullTextModal}
                  setQueryModal={setQueryModal}
                  setIsClassifySetting={setIsClassifySetting}
                  setIsOpenQA={setIsOpenQA}
                  setQaModal={setQaModal}
                  advError={advError}
                  setQaStep={setQaStep}
                  setCanvasConfigModal={setCanvasConfigModal}
                  onSaveDefault={onSaveDefault}
                  operateFail={operateFail}
                  isQAConfigError={isQAConfigError}
                  testData={testData}
                  openModalHelper={openModalHelper}
                  setIsUpdate={setIsUpdate}
                  error={{
                    card: cardConfigs.error,
                    recommend: recommendConfigs.error,
                    query: operateSave && !operateFail ? null : { '1-1-1': 'fail' }
                  }}
                />
                {/* 测试配置 */}
                <TestConfig
                  setResData={setResData}
                  setAllResData={setAllResData}
                  isShowInput={isShowInput}
                  selfState={selfState}
                  setKgqaResData={setKgqaResData}
                  dispatchState={dispatchState}
                  saveQa={saveQa}
                  setSaveQa={setSaveQa}
                  resData={resData}
                  kgqaResData={kgqaResData}
                  allResData={allResData}
                  isTestConfig={isTestConfig}
                  testData={testData}
                  setTestData={setTestData}
                  checked={checked}
                  setChecked={setChecked}
                  setIsOpenQA={setIsOpenQA}
                  isUpdate={isUpdate}
                  searchConfig={searchConfig}
                  setQaError={setQaError}
                  setEmError={setEmError}
                  basicData={basicData}
                  advGaConfig={kgqaConfig?.adv_config?.ga_config}
                />
              </div>

              {/* 底部 */}
              {!searchTest.includes('/search/test') ? (
                <div className="cog-search-footer-box kw-center">
                  <Button type="default" onClick={() => onPrev(0)}>
                    {intl.get('global.previous')}
                  </Button>
                  <Button type="primary" onClick={onIsNext}>
                    {intl.get('global.next')}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      {/* 意图识别 */}
      <QuerySettingModal
        visible={queryModal}
        onHandleCancel={onHandleCancel}
        setTestData={setTestData}
        testData={testData}
        checked={checked}
        onSaveDefault={onSaveDefault}
        operateFail={operateFail}
        setOperateFail={setOperateFail}
        setOperateSave={setOperateSave}
      />
      {/* 搜索配置 */}
      <SearchRange
        visible={fullTextModal}
        setTestData={setTestData}
        testData={testData}
        onHandleCancel={onHandleCancel}
        checked={checked}
        setChecked={setChecked}
        fullContent={fullContent}
        setFullContent={setFullContent}
        setTextIsDisable={setTextIsDisable}
        onSaveDefault={onSaveDefault}
        onAuthError={onAuthError}
        setIsOpenQA={setIsOpenQA}
      />
      {/* 图谱qa */}
      <FullTextQA
        visible={qaModal}
        kgqaData={kgqaData}
        setKgqaData={setKgqaData}
        kgqaConfig={kgqaConfig}
        setKgqaConfig={setKgqaConfig}
        onHandleCancel={onHandleCancel}
        checked={checked}
        setChecked={setChecked}
        isOpenQA={isOpenQA}
        setTextIsDisable={setTextIsDisable}
        onSaveDefault={onSaveDefault}
        onHandleSave={onHandleSave}
        qaStep={qaStep}
        setQaStep={setQaStep}
        onAuthError={onAuthError}
        setIsQAConfigError={setIsQAConfigError}
        testData={testData}
      />

      {/* 实体分数阈值 */}
      <ScoreThresholdModal
        visible={scoreController.visible}
        score={scoreController.score}
        onCancel={() => setScoreController(pre => ({ ...pre, visible: false }))}
        onOk={onScoreChange}
      />

      {/* 权重配置弹窗 */}
      <WeightSortingModal
        visible={weightsController.visible}
        data={weightsController.data}
        graphSources={testData.props?.data_source_scope}
        onCancel={() => setWeightsController(pre => ({ ...pre, visible: false }))}
        onOk={onWeightsChange}
      />

      {/* 知识卡片和推荐配置弹窗 */}
      <KnowledgeCardModal
        {...cardController}
        knwId={basicData.knw_id}
        graphSources={testData.props?.data_source_scope}
        externalModel={externalModel}
        onExit={() => setCardController(pre => ({ ...pre, visible: false }))}
        onSave={onCardChange}
      />

      {/* 高级配置 */}
      <QaAdvanceConfig
        {...advConfigController}
        onExit={() => setAdvConfigController(pre => ({ ...pre, visible: false }))}
        graphSources={testData.props?.data_source_scope}
        externalModel={externalModel}
        onSave={(data: any) => setQaAdvanceConfig(data)}
        testData={testData}
        setTestData={setTestData}
        onUpdateTableData={onUpdateTableData}
        adv_config={kgqaConfig?.adv_config}
        onUpdateTableForLarge={onUpdateTableForLarge}
        // 还需要大模型资源
      />

      {/* 画布配置 */}
      <PC_ConfigModal
        visible={canvasConfigModal}
        savedPCConfig={basicData?.pc_configure_item ? JSON.parse(basicData?.pc_configure_item) : []}
        basicData={basicData}
        configInfo={testData.config_info}
        onCancel={() => setCanvasConfigModal(false)}
        onSave={data => {
          basicData.pc_configure_item = data ? JSON.stringify(data) : '';
          setBasicData(basicData);
          onSaveDefault();
        }}
      />
    </div>
  );
};

export default SecondSearchTest;
