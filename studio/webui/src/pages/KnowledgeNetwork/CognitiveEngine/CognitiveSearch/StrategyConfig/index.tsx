/* eslint-disable max-lines */
/**
 * 搜索策略配置
 */

import React, { useState, useEffect, useRef, useReducer, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Button, Empty, Select, Tooltip, ConfigProvider, message, Input } from 'antd';
import { QuestionCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import localStore from 'store';
import { connect } from 'react-redux';
import servicesSearchConfig from '@/services/searchConfig';
import { knowModalFunc, tipModalFunc } from '@/components/TipModal';
import ScrollBar from '@/components/ScrollBar';
import ExplainTip from '@/components/ExplainTip';
import { getParam } from '@/utils/handleFunction';
import { CN_NUMBER, EN_NUMBER, convertData, initConfig, generateConfig } from '../assistFunction';
import SaveModal from './SaveModal';
import ConfigModal from '../ConfigModal';
import kongImg from '@/assets/images/kong.svg';
import type { TGraphData, TConfigData } from '../types';
import './style.less';

export interface StrategyConfigProps {
  store?: any;
  type?: 'edit' | 'create' | string;
  kgData?: Record<string, any>;
  tabKey?: string;
  editId?: number;
  anyDataLang?: string;
  onTest?: (data: Record<string, any>) => void;
  onAfterSave?: () => void;
  notGraphCallback?: (isEmpty: boolean, isClear?: boolean) => void;
  onClose?: (needRefresh?: boolean) => void;
}

const initState = {
  initLoading: false, // 初始化loading
  saveVisible: false, // 保存弹窗
  defaultTab: 'node', // 打开配置弹窗默认切换的tab
  selectErr: false, // 未选择图谱
  nameErrText: '' // 配置名错误信息
};
type ReducerState = typeof initState;
const reducer = (state: ReducerState, action: Partial<ReducerState>) => ({ ...state, ...action });
const DEFAULT_DEEP = 1; // 默认深度
const MAX_DEEP = 10; // 最大深度
const MIN_DEEP = 1; // 最小深度
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
    anyDataLang,
    onTest, // 测试回调
    onAfterSave, // 新增 | 编辑配置后的回调
    notGraphCallback, // 图谱为空回调
    onClose // 编辑时关闭
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

  // 暴露组件内部方法
  useImperativeHandle(ref, () => ({
    reset,
    getGraphList,
    isConfiguring: () => isConfiguring,
    getTestContent: () => ({
      kg_ids: `${graphInfo.kg_id}`,
      conf_content: generateConfig(configData, deep)
    }),
    needRefresh: () => needRefresh.current
  }));

  useEffect(() => {
    return () => {
      if (!kgData?.id) return;
      localStore.remove(TEST_DATA_KEY);
    };
  }, [kgData]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;

      return;
    }

    tabKey === CONFIG ? getGraphList(kgData?.id) : reset();
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
    dispatchState({ selectErr: false });
    setIsConfiguring(false);
    clearStore();
    setDeep(DEFAULT_DEEP);
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
    const { res, ErrorCode, Description } = (await servicesSearchConfig.fetchConfig(id)) || {};
    dispatchState({ initLoading: false });

    if (res) {
      const { kg_name, kg_id, conf_content } = res;

      setEditData(res);
      setGraphInfo({ kg_name, kg_id });
      setDeep(conf_content.max_depth);
      getGraphData({ id: kg_id, conf_content });

      return;
    }

    if (ERROR_CODE[ErrorCode]) {
      message.error(intl.get(ERROR_CODE[ErrorCode]));
      onClose?.(true);

      return;
    }

    Description && message.error(Description);
  };

  /**
   * 获取可配置的知识图谱
   * @param id 知识网络id
   * @param isInit 是否是初始化
   */
  const getGraphList = async (id: number, isInit = false) => {
    if (!id) return;

    const { res } = (await servicesSearchConfig.fetchConfigGraph({ knowledge_network_id: id })) || {};
    const testId = getParam('test');
    res && setGraphList(res);
    notGraphCallback?.(!res?.length);

    if (isInit && testId) {
      const testStore = localStore.get(TEST_DATA_KEY);
      const { kg_ids, conf_content } = testStore || {};

      if (testId !== kg_ids || !conf_content) return res;

      const graph = res.find((d: any) => `${d.kg_id}` === kg_ids);

      if (!graph) return res;

      setGraphInfo(graph);
      setIsConfiguring(true);
      getGraphData({ id: kg_ids, conf_content });
    }

    return res;
  };

  /**
   * 获取图谱数据
   * @param obj.id 图谱id
   * @param obj.conf_content 原配置数据
   * @param obj.triggerTest 是否触发测试推荐
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
    !conf_content && dispatchState({ initLoading: true });
    const { res, ErrorCode, Description } = (await servicesSearchConfig.fetchCanvasData(id)) || {};
    dispatchState({ initLoading: false });

    if (res) {
      const graph = convertData(res?.df?.[0]);
      const config = initConfig(graph, conf_content);
      const testConfig = generateConfig(config, conf_content?.max_depth || DEFAULT_DEEP);
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
  };

  /**
   * 选择图谱
   * @param value 图谱名
   * @param option 选择的图谱
   */
  const onGraphChange = async (value: string, option: Record<string, any>) => {
    if (isConfiguring) {
      const isOk = await tipModalFunc({
        title: intl.get('global.tip'),
        content: intl.get('searchConfig.changeTip')
      });

      if (!isOk) return;
    }

    reset();

    if (!value) {
      notGraphCallback?.(false, true);
      return;
    }

    const { kg_id } = option.data;
    setGraphInfo(option.data);
    getGraphData({ id: kg_id });
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

  /**
   * 改变深度按钮--鼠标按下
   * @param type 加 | 减
   */
  const onDeepMousedown = (type: '+' | '-') => {
    onDeepChange(type);

    if (graphInfo.kg_id && !editData.conf_id) {
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
    if (!graphInfo.kg_id) {
      dispatchState({ selectErr: true });
      return;
    }

    dispatchState({ defaultTab: !graphData.edgeLen ? 'node' : type });
    setConfigVisible(true);
  };

  /**
   * 弹窗中配置完成的回调
   * @param config 前端配置数据
   */
  const onConfigFinish = useCallback(
    (config: TConfigData) => {
      const conf_content = generateConfig(config, deep);
      const testData = { kg_ids: `${graphInfo.kg_id}`, conf_content };

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
    if (type === 'edit') {
      onClose?.(needRefresh.current);
      return;
    }

    if (!graphInfo.kg_id) {
      dispatchState({ selectErr: false });
      return;
    }

    try {
      const configs = initConfig(graphData);
      setConfigData(configs);
      setDeep(DEFAULT_DEEP);
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
   * @param setFieldsErr 设置报错提示回调
   */
  const onSave = async (name?: string, setFieldsErr?: Function) => {
    if (selfState.initLoading) return;

    if (!name) {
      const nameErrText = verifyName(editData.conf_name);
      dispatchState({ nameErrText });

      if (nameErrText) return;
    }

    const conf_content = generateConfig(configData, deep);
    const params: any = {
      conf_id: type === 'edit' ? editData.conf_id : undefined,
      kg_id: type === 'edit' ? undefined : graphInfo.kg_id,
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

    if (!ErrorCode) return;

    if (ErrorCode === 'EngineServer.ErrAdvConfNameErr') {
      setFieldsErr
        ? setFieldsErr({ name: intl.get('searchConfig.repeatName') })
        : dispatchState({ nameErrText: intl.get('searchConfig.repeatName') });
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
  };

  /**
   * 校验配置名
   * @param name 配置名
   */
  const verifyName = (name: string) => {
    switch (true) {
      case !name:
        return intl.get('searchConfig.noNull');
      case name.length > 50:
        return intl.get('searchConfig.max50');
      case !keyboardReg.test(name):
        return intl.get('searchConfig.support');
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

  return (
    <div className={`cognitive-config-pane ${anyDataLang === 'en-US' && 'en-pane'}`}>
      <div className="pane-scroll-wrap">
        <ScrollBar isshowx="false">
          <div className="pane-scroll-inner">
            <h2 className="h-title" style={{ marginTop: 20 }}>
              {intl.get('searchConfig.basicInfo')}
            </h2>

            {type === 'edit' && (
              <div className="config-row">
                <p className="row-title required">{intl.get('searchConfig.configName')}</p>
                <Input
                  className={selfState.nameErrText && 'border-error'}
                  value={editData.conf_name}
                  onChange={onConfigNameChange}
                />
                <p className="err-msg">{selfState.nameErrText}</p>
              </div>
            )}

            <div className="config-row">
              <p className="row-title required">{intl.get('global.graph')}</p>
              <Select
                className={`graph-select ${selfState.selectErr && 'border-error'}`}
                placeholder={intl.get('searchConfig.pleaseGraph')}
                showSearch
                allowClear
                disabled={type === 'edit'}
                value={type === 'edit' ? graphInfo.kg_name : graphInfo.kg_id}
                onChange={onGraphChange}
                optionFilterProp="label"
                notFoundContent={<Empty image={kongImg} description={intl.get('global.noData')} />}
                getPopupContainer={triggerNode => triggerNode.parentElement}
              >
                {graphList.map(item => (
                  <Option key={item.kg_id} value={item.kg_id} label={item.kg_name} data={item}>
                    {item.kg_name}
                  </Option>
                ))}
              </Select>
              <p className="err-msg">{selfState.selectErr && intl.get('searchConfig.pleaseSelect')}</p>
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
                  &le;&nbsp;&nbsp;{anyDataLang === 'en-US' ? EN_NUMBER[deep] : CN_NUMBER[deep]}
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
            <div className="config-row">
              <p className="row-title">
                {intl.get('searchConfig.searchScope')}
                <ExplainTip placement="right" title={intl.get('searchConfig.scopeTip')} />
              </p>

              <div className="rule-box">
                <div className="combo-row" style={{ marginBottom: 16 }}>
                  <div className="addon-before">{intl.get('global.entityClass')}</div>
                  <div className="rule-num">
                    {(graphData.nodeLen || 0) > configData.nodeScope.length ? (
                      <>
                        {intl.get('searchConfig.checked1')}
                        <span className="num-span">{configData.nodeScope.length}</span>
                        {intl.get('searchConfig.checked2')}
                      </>
                    ) : (
                      intl.get('global.all')
                    )}
                  </div>
                  <div className="edit-btn" onClick={() => onEdit('node')}>
                    {intl.get('global.edit')}
                  </div>
                </div>

                <div className="combo-row">
                  <div className="addon-before">{intl.get('global.relationClass')}</div>
                  <div className="rule-num">
                    {(graphData.edgeLen || 0) > configData.edgeScope.length ? (
                      <>
                        {intl.get('searchConfig.checked1')}
                        <span className="num-span">{configData.edgeScope.length}</span>
                        {intl.get('searchConfig.checked2')}
                      </>
                    ) : (
                      <>{graphData.nodeLen && !graphData.edgeLen ? '--' : intl.get('global.all')}</>
                    )}
                  </div>
                  <div
                    className={`edit-btn ${!!graphData.nodeLen && !graphData.edgeLen && 'disabled'}`}
                    title={graphData.nodeLen && !graphData.edgeLen ? intl.get('global.noContent') : undefined}
                    onClick={() => graphData.edgeLen && onEdit('edge')}
                  >
                    {intl.get('global.edit')}
                  </div>
                </div>
              </div>
            </div>

            <div className="config-row">
              <p className="row-title" style={{ marginTop: 24 }}>
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
                    ) : (
                      intl.get('global.all')
                    )}
                  </div>
                  <div className="edit-btn" onClick={() => onEdit('node')}>
                    {intl.get('global.edit')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollBar>
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
          <Button
            type="primary"
            className="save-btn"
            onClick={() => {
              if (!graphInfo.kg_id) {
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
        type={type || 'create'}
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
  anyDataLang: state.getIn(['changeAnyDataLang', 'anyDataLang'])
});

export { ERROR_CODE };
export default connect(mapStateToProps, null, null, { forwardRef: true })(forwardRef(StrategyConfig));
