/* eslint-disable max-lines */
/**
 * 搜索策略配置
 */

import React, { useState, useEffect, useRef, useReducer, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Button, Empty, Select, ConfigProvider, message, Input, InputNumber, Slider } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import localStore from 'store';
import { connect } from 'react-redux';
import _ from 'lodash';
import servicesSearchConfig from '@/services/searchConfig';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import servicesPermission from '@/services/rbacPermission';
import cognitiveSearchService from '@/services/cognitiveSearch';
import { knowModalFunc, tipModalFunc } from '@/components/TipModal';
import ExplainTip from '@/components/ExplainTip';
import KwScrollBar from '@/components/KwScrollBar';
import { getParam } from '@/utils/handleFunction';
import { ONLY_KEYBOARD, GRAPH_DB_TYPE } from '@/enums';

import { CN_NUMBER, EN_NUMBER, convertData, initConfig, generateConfig } from '../assistFunction';
import SaveModal from '../SaveModal';
import ConfigModal from '../ConfigModal';
import kongImg from '@/assets/images/kong.svg';
import type { TGraphData, TConfigData, TSortRule } from '../types';
import './style.less';

export interface StrategyConfigProps {
  store?: any;
  type?: 'edit' | 'create' | string;
  kgData?: Record<string, any>;
  tabKey?: string;
  editId?: number;
  kwLang?: string;
  onTest?: (data: Record<string, any>) => void;
  onAfterSave?: () => void;
  notGraphCallback?: (isEmpty: boolean, isClear?: boolean) => void;
  onClose?: (needRefresh?: boolean) => void;
  setIsDrawer: (state: any) => void;
  clearInput: () => void;
}

interface ReducerState {
  initLoading: boolean;
  saveVisible: boolean;
  defaultTab: 'node' | 'edge' | string;
  selectErr: boolean;
  nameErrText: string;
}

// 使用useReducer管理状态变量
const initState: ReducerState = {
  initLoading: false, // 初始化loading
  saveVisible: false, // 保存弹窗
  defaultTab: 'node', // 打开配置弹窗默认切换的tab
  selectErr: false, // 未选择图谱
  nameErrText: '' // 配置名错误信息
};
const reducer = (state: ReducerState, action: Partial<ReducerState>) => ({ ...state, ...action });
const DEFAULT_DEEP = 1; // 默认深度
const MAX_DEEP = 10; // 最大深度
const MIN_DEEP = 1; // 最小深度
const getDefaultRule = () => ({ lucene_weight: 1, depth_weight: 5 }); // 默认权重配置
const { Option } = Select;
const keyboardReg =
  /(^[\u4e00-\u9fa5_a-zA-Z0-9=~!@#$&%^&*()_+`'"{}[\];:,.?<>|/~！@#￥%…&*·（）—+。={}|【】：；‘’“”、《》？，。/\n\\\s]+$)|-/;
const CONFIG = 'config tab'; // 搜索策略配置
const SAVED = 'saved tab'; // 已保存搜索策略
const TEST_DATA_KEY = 'test_data_key'; // 存储在localStorage的测试数据key值
const ERROR_CODE: Record<string, string> = {
  'EngineServer.ErrKGIDErr': 'searchConfig.graphNoExist', // 图谱不存在
  'EngineServer.ErrRightsErr': 'searchConfig.noAuth', // 无权限
  'EngineServer.ErrAdvConfKGErr': 'searchConfig.hasChange', // 图谱变更无法配置
  'EngineServer.ErrAdvConfContentErr': 'searchConfig.hasChange', // 图谱变更无法配置
  'EngineServer.ErrAdvSearchConfIDErr': 'searchConfig.noConfig', // 配置不存在
  'Builder.service.ontology.getOtlIdbyKGId.kgidNotExists': 'searchConfig.graphNoExist' // 图谱不存在
};

const StrategyConfig: React.ForwardRefRenderFunction<unknown, StrategyConfigProps> = (
  {
    type, // 编辑或新建
    kgData, // 知识网络数据
    tabKey, // tab key
    editId, // 编辑的配置id
    kwLang,
    onTest, // 测试回调
    onAfterSave, // 新增 | 编辑配置后的回调
    notGraphCallback, // 图谱为空回调
    onClose, // 编辑时关闭
    setIsDrawer,
    clearInput
  },
  ref
) => {
  const deepTimer = useRef<any>(); // 长按深度定时器
  const isFirstMount = useRef(true); // 标记第一次挂载
  const needRefresh = useRef(false); // 标记是否需要刷新配置
  const [selfState, dispatchState] = useReducer(reducer, initState); // 分页、loading等状态
  const [graphList, setGraphList] = useState<any[]>([]); // 可配置的图谱列表
  const [graphInfo, setGraphInfo] = useState<Record<string, any>>({}); // 图谱信息
  const [graphData, setGraphData] = useState<TGraphData>({}); // 图谱数据
  const [deep, setDeep] = useState(DEFAULT_DEEP); // 边深度
  const [editData, setEditData] = useState<Record<string, any>>({}); // 编辑数据
  const [configData, setConfigData] = useState<TConfigData>({ nodeScope: [], nodeRes: [], edgeScope: [] }); // 配置数据
  const [configVisible, setConfigVisible] = useState(false); // 配置弹窗
  const [isConfiguring, setIsConfiguring] = useState(false); // 标记正在配置
  const [sortRules, setSortRule] = useState<TSortRule>(() => getDefaultRule()); // 排序权重配置

  // 暴露组件内部方法
  useImperativeHandle(ref, () => ({
    reset,
    getGraphList,
    isConfiguring: () => isConfiguring,
    getTestContent: () => ({
      kg_ids: `${graphInfo.id}`,
      conf_content: generateConfig(configData, deep, sortRules)
    }),
    needRefresh: () => needRefresh.current
  }));

  useEffect(() => {
    return () => {
      if (!kgData?.id) return;
      localStore.remove(TEST_DATA_KEY);
    };
  }, [kgData?.id]);

  useEffect(() => {
    tabKey === CONFIG ? getGraphList(kgData?.id) : reset();
    // tabKey === CONFIG ? getKwList() : reset();
  }, [tabKey]);

  useEffect(() => {
    if (type !== 'edit') return;

    if (!editId) {
      setEditData({});
      return;
    }

    initByEdit(editId);
  }, [type, editId]);

  /**
   * 界面恢复初始状态
   */
  const reset = () => {
    getGraphList(kgData?.id);
    dispatchState({ selectErr: false });
    setIsConfiguring(false);
    clearStore();
    setDeep(DEFAULT_DEEP);
    setSortRule(getDefaultRule());
    setGraphInfo({});
    setGraphData({});
    setEditData({});
    needRefresh.current = false;
  };

  /**
   * 清除localStorage数据
   */
  const clearStore = () => localStore.remove(TEST_DATA_KEY);

  /**
   * 编辑配置
   * @param id 配置id
   */
  const initByEdit = async (id: number) => {
    dispatchState({ initLoading: true });
    try {
      const { res, ErrorCode, Description } = (await servicesSearchConfig.fetchConfig(id)) || {};

      if (res) {
        const { kg_name, kg_id, conf_content } = res;

        setEditData(res);
        setGraphInfo({ name: kg_name, id: kg_id });
        setDeep(conf_content.max_depth);
        conf_content.sort_rules && setSortRule(conf_content.sort_rules);
        getGraphData({ id: kg_id, conf_content });

        return;
      }

      dispatchState({ initLoading: false });

      if (ERROR_CODE[ErrorCode]) {
        message.error(intl.get(ERROR_CODE[ErrorCode]));
        onClose?.(true);

        return;
      }

      Description && message.error(Description);
    } catch {
      dispatchState({ initLoading: false });
    }
  };

  /**
   * 获取可配置的知识图谱
   * @param id 知识网络id
   * @param isInit 是否是初始化
   */
  const getGraphList = async (id: number, isInit = false) => {
    if (!id) return;
    try {
      const { res } = (await cognitiveSearchService.getKgList(id)) || {};
      const { test: testId, gid } = getParam(['test', 'gid']);

      res?.df && setGraphList(res?.df);
      notGraphCallback?.(!res?.df?.length);

      if (isInit && gid) {
        const graph = res?.df.find((d: any) => `${d.id}` === gid);
        if (!graph) return res?.df;
        setGraphInfo(graph);
        getGraphData({ id: graph.id });
      }

      if (isInit && testId) {
        const testStore = localStore.get(TEST_DATA_KEY);
        const { kg_ids, conf_content } = testStore || {};
        if (testId !== kg_ids || !conf_content) return res?.df;
        const graph = res?.df?.find((d: any) => `${d.id}` === kg_ids);
        if (!graph) return res?.df;
        setGraphInfo(graph);
        setIsConfiguring(true);
        getGraphData({ id: kg_ids, conf_content });
      }

      return res?.df;
    } catch {
      return false;
    }
  };

  /**
   * 获取图谱数据
   * @param id 图谱id
   * @param conf_content 原配置数据
   * @param triggerTest 是否触发测试推荐
   */
  const getGraphData = async ({
    id,
    conf_content,
    triggerTest = true
  }: {
    id: number;
    conf_content?: Record<string, any>;
    triggerTest?: boolean;
  }) => {
    try {
      !conf_content && dispatchState({ initLoading: true });
      const { res, ErrorCode, Description } = (await servicesSearchConfig.fetchCanvasData(id)) || {};
      dispatchState({ initLoading: false });
      if (res) {
        const graph = convertData(res);
        const config = initConfig(graph, conf_content);
        const testConfig = generateConfig(
          config,
          conf_content?.max_depth || DEFAULT_DEEP,
          conf_content?.sort_rules || getDefaultRule()
        );
        setGraphData(graph);
        setConfigData(config);
        triggerTest && onTest?.({ kg_ids: `${id}`, conf_content: testConfig });
      }

      if (ERROR_CODE[ErrorCode]) {
        message.error(intl.get(ERROR_CODE[ErrorCode]));
        reset();
        getGraphList(kgData?.id);
        return;
      }

      Description && message.error(Description);
    } catch {
      dispatchState({ initLoading: false });
    }
  };

  /**
   * 选择图谱
   * @param option 选择的图谱
   */
  const onGraphChange = async (value: string, option: Record<string, any>) => {
    setIsDrawer(false);
    if (isConfiguring) {
      const isOk = await tipModalFunc({
        title: intl.get('global.tip'),
        content: intl.get('searchConfig.changeTip'),
        closable: false
      });

      if (!isOk) return;
    }

    reset();

    if (!value) {
      notGraphCallback?.(false, true);
      return;
    }

    const { id } = option.data;
    setGraphInfo(option.data);
    getGraphData({ id });
  };

  /**
   * 深度变化
   * @param type 加 | 减
   */
  const onDeepChange = (type: '+' | '-') => {
    setDeep(preDeep => {
      if ((type === '-' && preDeep === MIN_DEEP) || (type === '+' && preDeep === MAX_DEEP)) {
        return preDeep;
      }

      return type === '+' ? preDeep + 1 : preDeep - 1;
    });
  };

  // 改变深度按钮--鼠标按下
  const onDeepMousedown = (type: '+' | '-') => {
    onDeepChange(type);

    if (graphInfo.id && !editData.conf_id) {
      setIsConfiguring(editData.max_depth !== deep);
    }

    // 长按
    deepTimer.current = setTimeout(() => {
      deepTimer.current = setInterval(() => {
        onDeepChange(type);
      }, 300);
    }, 600);
  };

  /**
   * 改变深度按钮--鼠标抬起
   */
  const onDeepMouseup = () => {
    clearInterval(deepTimer.current);
  };

  /**
   * 编辑配置
   * @param type 点类 | 关系类
   */
  const onEdit = (type: string) => {
    setIsDrawer(false);
    if (!graphList.length) return;
    if (!graphInfo.id) {
      dispatchState({ selectErr: true });
      return;
    }

    dispatchState({ defaultTab: !graphData.edgeLen ? 'node' : type });
    setConfigVisible(true);
  };

  /**
   * 测试配置
   */
  const onTestStrategy = () => {
    clearInput();
    setIsDrawer(false);
    if (!graphInfo.id) {
      dispatchState({ selectErr: true });
      return;
    }
    onConfigFinish(configData);
  };

  /**
   * 弹窗中配置完成的回调
   * @param config 前端配置数据
   */
  const onConfigFinish = useCallback(
    (config: TConfigData) => {
      clearInput?.();
      const conf_content = generateConfig(config, deep, sortRules);
      const testData = { kg_ids: `${graphInfo.id}`, conf_content };

      setConfigVisible(false);
      setIsConfiguring(true);
      setConfigData(config);
      onTest?.(testData);
      localStore.set(TEST_DATA_KEY, testData);
    },
    [deep, graphInfo]
  );

  /**
   * 恢复默认 | 取消
   */
  const onReset = () => {
    setIsDrawer(false);
    if (type === 'edit') {
      onClose?.(needRefresh.current);
      return;
    }

    if (!graphInfo.id) {
      dispatchState({ selectErr: false });
      return;
    }

    try {
      const configs = initConfig(graphData);
      setConfigData(configs);
      setDeep(DEFAULT_DEEP);
      setSortRule(getDefaultRule());
      setIsConfiguring(false);
      clearStore();
      message.success(intl.get('searchConfig.resetSuccess'));
    } catch (e) {
      return 0;
    }
  };

  /**
   * 保存配置
   * @param name 配置名称
   */
  const onSave = async (name?: string, setFieldsErr?: Function) => {
    if (selfState.initLoading) return;

    if (!name) {
      const nameErrText = verifyName(editData.conf_name);
      dispatchState({ nameErrText });

      if (nameErrText) return;
    }

    const conf_content = generateConfig(configData, deep, sortRules);
    const params: any = {
      conf_id: type === 'edit' ? editData.conf_id : undefined,
      kg_id: type === 'edit' ? undefined : graphInfo.id,
      conf_name: name || editData.conf_name,
      conf_content
    };
    dispatchState({ initLoading: true });
    const { res, ErrorCode, Description } =
      (await (type === 'edit'
        ? servicesSearchConfig.updateAdvConfig(params)
        : servicesSearchConfig.addAdvConfig(params))) || {};
    dispatchState({ initLoading: false });

    if (res) {
      message.success(intl.get('searchConfig.saveSuccess'));
      dispatchState({ saveVisible: false });
      onAfterSave?.();
      reset();
    }

    if (ErrorCode) {
      if (['EngineServer.ErrAdvConfNameErr', 'EngineServer.ErrInternalErr'].includes(ErrorCode)) {
        setFieldsErr
          ? setFieldsErr({ name: intl.get('global.repeatName') })
          : dispatchState({ nameErrText: intl.get('global.repeatName') });
        return;
      }

      if (ERROR_CODE[ErrorCode]) {
        dispatchState({ saveVisible: false });

        if (type === 'edit') {
          message.error(intl.get(ERROR_CODE[ErrorCode]));
          needRefresh.current = true;
          return;
        }

        knowModalFunc.open({
          content: intl.get(ERROR_CODE[ErrorCode]),
          onOk: () => {
            reset();
            getGraphList(kgData?.id);
          }
        });

        return;
      }

      type === 'edit' && (needRefresh.current = true);
      Description && message.error(Description);
    }
  };

  /**
   * 校验配置名
   * @param name 配置名
   */
  const verifyName = (name: string) => {
    switch (true) {
      case !name:
        return intl.get('global.noNull');
      case name.length > 50:
        return intl.get('searchConfig.max50');
      case !keyboardReg.test(name):
        return intl.get('global.onlyKeyboard');
      default:
        return '';
    }
  };

  /**
   * 编辑配置名
   */
  const onConfigNameChange = (e: any) => {
    const { value } = e.target;
    setEditData(pre => ({ ...pre, conf_name: value }));
    dispatchState({ nameErrText: verifyName(value) });
  };

  /**
   * 排序权重变化
   * @param value 变化值
   * @param type lucene或depth
   */
  const onSortRuleChange = (value: number | null, type: 'lucene_weight' | 'depth_weight') => {
    if (!value) return;
    const newRule = { ...sortRules, [type]: value };
    setSortRule(newRule);
  };

  return (
    <div className={`cognitive-config-pane ${kwLang === 'en-US' && 'en-pane'}`}>
      <div className="pane-scroll-wrap">
        <KwScrollBar isShowX={false}>
          <div className="pane-scroll-inner">
            <h2 className="h-title" style={{ marginTop: 20 }}>
              {intl.get('searchConfig.basicInfo')}
            </h2>

            {/* 配置名 */}
            {type === 'edit' && (
              <div className="config-row">
                <p className="row-title required">{intl.get('searchConfig.configName')}</p>
                <Input
                  className={selfState.nameErrText && 'border-error'}
                  value={editData.conf_name}
                  onChange={onConfigNameChange}
                />
                <div className="err-msg">{selfState.nameErrText}</div>
              </div>
            )}

            {/* 图谱 */}
            <div className="config-row">
              <p className="row-title required">{intl.get('global.graph')}</p>
              <Select
                className={`graph-select ${selfState.selectErr && 'border-error'}`}
                placeholder={intl.get('searchConfig.pleaseGraph')}
                showSearch
                allowClear
                disabled={type === 'edit'}
                value={type === 'edit' ? graphInfo.name : graphInfo.id}
                onChange={onGraphChange}
                optionFilterProp="label"
                notFoundContent={<Empty image={kongImg} description={intl.get('global.noData')} />}
                getPopupContainer={triggerNode => triggerNode.parentElement}
              >
                {graphList.map(item => (
                  <Option key={item.id} value={item.id} label={item.name} data={item}>
                    {item.name}
                  </Option>
                ))}
              </Select>
              <div className="err-msg">{selfState.selectErr && intl.get('searchConfig.pleaseSelect')}</div>
            </div>

            <div className="config-row">
              <p className="row-title required">{intl.get('searchConfig.deep')}</p>
              <div className="deep-select">
                <div
                  className={`change-btn reduce-btn ${deep === MIN_DEEP && 'disabled'}`}
                  onMouseDown={() => onDeepMousedown('-')}
                  onMouseUp={onDeepMouseup}
                />
                <div className="deep-text">
                  &le;&nbsp;&nbsp;{kwLang === 'en-US' ? EN_NUMBER[deep] : CN_NUMBER[deep]}
                  {intl.get('searchConfig.deepFix')}
                </div>
                <div
                  className={`change-btn add-btn ${deep === MAX_DEEP && 'disabled'}`}
                  onMouseDown={() => onDeepMousedown('+')}
                  onMouseUp={onDeepMouseup}
                />
              </div>
            </div>

            <h2 className="h-title">{intl.get('searchConfig.searchRule')}</h2>

            {/* 搜索范围 */}
            <div className="config-row">
              <p className="row-title">
                {intl.get('searchConfig.searchScope')}
                <ExplainTip placement="right" title={intl.get('searchConfig.scopeTip')} />
              </p>

              <div className="rule-box">
                <div className="combo-row">
                  <div className="addon-before">{intl.get('global.relationClass')}</div>
                  <div className="rule-num">
                    {(graphData.edgeLen || 0) > configData.edgeScope.length ? (
                      <>
                        {intl.get('searchConfig.checked1')}
                        <span className="num-span">{configData.edgeScope.length}</span>
                        {intl.get('searchConfig.checked2')}
                      </>
                    ) : graphData.nodeLen ? (
                      intl.get('global.all')
                    ) : (
                      '--'
                    )}
                  </div>
                  <div
                    className={`edit-btn ${!!graphData.nodeLen && !graphData.edgeLen && 'disabled'}`}
                    title={graphData.nodeLen && !graphData.edgeLen ? intl.get('global.noContent') : undefined}
                    onClick={() => {
                      if (!graphInfo.id) dispatchState({ selectErr: true });
                      graphData.edgeLen && onEdit('edge');
                    }}
                  >
                    {intl.get('global.edit')}
                  </div>
                </div>
              </div>
            </div>

            {/* 搜索范围 */}
            <div className="config-row kw-mt-4">
              <p className="row-title">{intl.get('searchConfig.searchStart')}</p>
              <div className="combo-row" style={{ marginBottom: 16 }}>
                <div className="addon-before">{intl.get('global.entityClass')}</div>
                <div className="rule-num">
                  {(graphData.nodeLen || 0) > [...new Set(configData.nodeScope)].length ? (
                    <>
                      {intl.get('searchConfig.checked1')}
                      <span className="num-span">{[...new Set(configData.nodeScope)].length}</span>
                      {intl.get('searchConfig.checked2')}
                    </>
                  ) : graphData.nodeLen ? (
                    intl.get('global.all')
                  ) : (
                    '--'
                  )}
                </div>
                <div className="edit-btn" onClick={() => onEdit('node')}>
                  {intl.get('global.edit')}
                </div>
              </div>
            </div>

            {/* 搜索结果 */}
            <div className="config-row kw-mt-4">
              <p className="row-title">
                {intl.get('searchConfig.searchRes')}
                <ExplainTip placement="right" title={intl.get('searchConfig.resTip')} />
              </p>

              <div className="rule-box">
                <div className="combo-row">
                  <div className="addon-before">{intl.get('global.entityClass')}</div>
                  <div className="rule-num">
                    {(graphData.nodeLen || 0) > configData.nodeRes.length ? (
                      <>
                        {intl.get('searchConfig.checked1')}
                        <span className="num-span">{configData.nodeRes.length}</span>
                        {intl.get('searchConfig.checked2')}
                      </>
                    ) : graphData.nodeLen ? (
                      intl.get('global.all')
                    ) : (
                      '--'
                    )}
                  </div>
                  <div className="edit-btn" onClick={() => onEdit('node')}>
                    {intl.get('global.edit')}
                  </div>
                </div>
              </div>
            </div>

            {/* 排序规则 */}
            <h2 className="h-title">{intl.get('searchConfig.sortRule')}</h2>
            <div className="config-row">
              <p className="row-title">
                {intl.get('searchConfig.LuceneWeight')}
                <ExplainTip placement="right" title={intl.get('searchConfig.LuceneWeightTip')} />
              </p>
              <div className="rule-box kw-align-center">
                <Slider
                  min={0}
                  max={5}
                  value={sortRules.lucene_weight}
                  onChange={v => onSortRuleChange(v, 'lucene_weight')}
                />

                <InputNumber
                  className="kw-ml-4"
                  style={{ width: 80 }}
                  min={0}
                  max={5}
                  precision={0}
                  value={sortRules.lucene_weight}
                  onChange={v => onSortRuleChange(v, 'lucene_weight')}
                />
              </div>
            </div>
            <div className="config-row kw-mt-4">
              <p className="row-title">
                {intl.get('searchConfig.depthWeight')}
                <ExplainTip placement="right" title={intl.get('searchConfig.depthWeightTip')} />
              </p>
              <div className="rule-box kw-align-center">
                <Slider
                  min={0}
                  max={5}
                  value={sortRules.depth_weight}
                  onChange={v => onSortRuleChange(v, 'depth_weight')}
                />

                <InputNumber
                  className="kw-ml-4"
                  style={{ width: 80 }}
                  min={0}
                  max={5}
                  precision={0}
                  value={sortRules.depth_weight}
                  onChange={v => onSortRuleChange(v, 'depth_weight')}
                />
              </div>
            </div>
          </div>
        </KwScrollBar>
      </div>

      {/* 加载loading */}
      <div className={`pane-loading ${selfState.initLoading && !selfState.saveVisible && 'spanning'} `}>
        <LoadingOutlined className="l-icon" />
      </div>

      <div className="config-footer-btn">
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button type="default" className="reset-btn" onClick={onReset}>
            {type === 'edit' ? intl.get('global.cancel') : intl.get('searchConfig.resetText')}
          </Button>
          <Button type="default" className="reset-btn" onClick={onTestStrategy}>
            {intl.get('searchConfig.toTestTwo')}
          </Button>
          <Button
            type="primary"
            className="save-btn"
            onClick={() => {
              setIsDrawer(false);
              if (!graphInfo.id) {
                dispatchState({ selectErr: true });
                return;
              }

              type === 'edit' ? onSave() : dispatchState({ saveVisible: true });
            }}
          >
            {intl.get('searchConfig.saveConfig')}
          </Button>
        </ConfigProvider>
      </div>

      {/* 保存配置弹窗 */}
      <SaveModal
        visible={selfState.saveVisible}
        editInfo={editData}
        setVisible={(bool: boolean) => dispatchState({ saveVisible: bool })}
        type={type === 'edit' ? 'edit' : 'create'}
        onOk={onSave}
      />

      <ConfigModal
        visible={configVisible}
        graphData={graphData}
        defaultTab={selfState.defaultTab}
        defaultConfig={configData}
        setVisible={setConfigVisible}
        onOk={onConfigFinish}
      />
    </div>
  );
};

const mapStateToProps = (state: Record<string, any>) => ({
  kwLang: state.getIn(['changekwLang', 'kwLang'])
});

export { ERROR_CODE };
export default connect(mapStateToProps, null, null, { forwardRef: true })(forwardRef(StrategyConfig));
