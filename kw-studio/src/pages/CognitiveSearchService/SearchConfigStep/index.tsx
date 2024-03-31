import React, { useState, useEffect, useRef } from 'react';
import { message, Button, Tooltip } from 'antd';
import { LeftOutlined } from '@ant-design/icons';

import { Prompt, useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';

import cognitiveSearchService from '@/services/cognitiveSearch';
import { tipModalFunc } from '@/components/TipModal';
import { getParam } from '@/utils/handleFunction';
import { ANALYSIS_SERVICES } from '@/enums';
import IconFont from '@/components/IconFont';

import FirstSearchResource from './FirstSearchResource';
import SecondSearchTest from './SecondSearchTest';
import TopSteps from './TopSteps';
import ThirdPublish from './ThirdPublish';

import { PC_CONFIG } from './enum';
import { BasicData } from './types';
import { MODEL_TYPE } from '../enum';
import { getPropertyRes } from './SecondSearchTest/assistFunction';
import { getDefaultCardConfigs } from './SecondSearchTest/enum';
import './style.less';

const LARGE_TYPE = ['openai', 'private_llm'];

// 判断进入的界面
// 点击【编辑】进入服务，跳转「配置策略与测试」页面
// 点击【发布】进入服务，跳转「发布服务」页面
const getFirstParam = () => {
  let action = getParam('action') as any;
  if (!['create', 'edit', 'publish', 'copy'].includes(action)) {
    action = 'create';
  }
  let step = 0;
  if (action === 'publish' || action === 'copy') {
    step = 2;
  } else if (action === 'create' || action === 'edit') {
    step = 0;
  } else {
    step = 1;
  }
  return { step, action };
};

const { ACCESS_METHOD, PERMISSION } = ANALYSIS_SERVICES;

const CONFIG_PROPS = {
  // props里存储用于向后端发送请求的数据
  full_text: { search_config: [], switch: false }, // 搜索范围
  knowledge_card: getDefaultCardConfigs(),
  related_knowledge: getDefaultCardConfigs(),
  data_source_scope: [], // 流程一中使用图谱的数据,
  data_all_source: [] // 流程一中所有配置的数据
};

// 部分参数写死
const DEFAULT_CONFIG: any = {
  operation_type: 'custom-search',
  permission: PERMISSION.APPID_LOGIN,
  access_method: [ACCESS_METHOD.REST_API, ACCESS_METHOD.PC_EMBED],
  oldMethod: [ACCESS_METHOD.REST_API, ACCESS_METHOD.PC_EMBED],
  selectMes: '', // 为空表示全部资源 非空是具体某一个分类名称
  props: CONFIG_PROPS,
  switch: false,
  pc_configure_item: JSON.stringify(PC_CONFIG)
};
const DEFAULT_CONFIG_KGQA: any = {
  props: {
    confs: [],
    limit: 5,
    threshold: 0.6,
    action: 'init',
    ans_organize: { type: 'default' }
  }
};

const SearchConfigStep = (props: any) => {
  const { knwData, knwStudio, setKnwStudio, setIsClassifySetting, isClassifySetting } = props;
  const history = useHistory();
  const firstStepRef = useRef<any>();
  const [step, setStep] = useState(() => getFirstParam().step);
  const [action] = useState<any>(() => getFirstParam().action); // 进入页面的动作行为
  const [isPrevent, setIsPrevent] = useState(true); // 是否阻止路由跳转
  const [basicData, setBasicData] = useState<BasicData>({} as BasicData); // 基本信息
  const [testData, setTestData] = useState<any>({} as any); // 第二步 搜索方式配置与测试数据
  const [kgqaData, setKgqaData] = useState<any>({} as any); // 第二步 图谱问答
  const [kgqaConfig, setKgqaConfig] = useState<any>({});
  const [usb, setUsb] = useState({});
  const [querySave, setQuerySave] = useState(false); // Query保存
  const [operateFail, setOperateFail] = useState(false); // 意图操作是否失败
  const [isOpenQA, setIsOpenQA] = useState(false); // qa开关
  const [saveConfs, setSaveConfs] = useState<any>({});
  const [isQAConfigError, setIsQAConfigError] = useState(false); // 图谱问答配置错误
  const [operateSave, setOperateSave] = useState(false); // 意图保存成功
  const [qaError, setQaError] = useState(''); // ''(无错误) | openai | private_llm
  const [emError, setEmError] = useState(true); // 向量模型错误
  const [advError, setAdvError] = useState(''); // ''(无错误) 高级配置报错
  const [checked, setChecked] = useState({
    checked: false,
    queryChecked: false,
    qAChecked: false,
    card: false,
    recommend: false,
    qaSubgraph: true
  }); // 开关
  const [externalModel, setExternalModel] = useState<any[]>([]); // 资源配置外接模型
  const [isSaved, setIsSaved] = useState<boolean>(false); // 是否保存

  useEffect(() => {
    init();
  }, []);
  useEffect(() => {
    if (usb === 'knw') {
      onExit('knw', knwData);
      return;
    }
    if (knwStudio === 'studio') {
      onExit('studio');
    }
  }, [knwStudio, knwData]);

  useEffect(() => {
    setIsSaved(false);
  }, [JSON.stringify(basicData), JSON.stringify(testData), JSON.stringify(kgqaConfig)]);

  useEffect(() => {
    if (kgqaConfig?.adv_config?.ans_config?.type) {
      // 重新选择后取消报错
      setAdvError('');
    }
  }, [kgqaConfig?.adv_config?.ans_config?.type]);

  /**
   * 初始化页面, 获取路由参数
   * {knw_id、knw_name：知识网络id、名称}  {g_id：图谱id}  {s_id：服务id}
   */
  const init = async () => {
    /* eslint-disable */
    //debugger;
    const { s_id } = getParam(['s_id']);
    // 新建-保存默认配置
    onCreateDataSave();
    if (!s_id) return;
    // 编辑
    try {
      const { res } = (await cognitiveSearchService.getAppointList(s_id)) || {};
      if (res) {
        // 判断是否是升级上来的
        const { data_source_scope, nodes, openai_status, ...info } = onHandleUpgrades(res);

        // 图谱资源
        const { sourceResult, fullTextConfig } = onHandleGraphSource(data_source_scope, nodes);
        // 全部资源
        const allSourceData = onHandleAllSource(data_source_scope);
        const p = {
          props: {
            data_source_scope: sourceResult,
            data_all_source: allSourceData,
            full_text: { search_config: fullTextConfig },
            knowledge_card: nodes?.[0]?.props?.knowledge_card || getDefaultCardConfigs(),
            related_knowledge: nodes?.[0]?.props?.related_knowledge || getDefaultCardConfigs()
          }
        };
        // 编辑进入 所有数据存储
        onEditSaveAllData(p, nodes, info);
        onHandleQa(sourceResult, nodes, openai_status);
        const isIncludesEmbed = Object.keys(res).includes('embed_model_status');
        isIncludesEmbed && setEmError(res?.embed_model_status);
        return;
      }
    } catch (err) {
      const { Description } = err?.response || err || {};
      Description && message.error(Description);
    }
  };

  /**
   * 升级上来的大模型数据处理
   */
  const onHandleUpgrades = (res: any) => {
    const { data_source_scope, nodes } = res;
    const kgqaType = nodes?.[0]?.props?.kgqa?.ans_organize?.type;
    const filterKg = _.find(_.cloneDeep(data_source_scope), (item: any) => item?.resource_type === 'kg');
    const isExistLargeData = _.filter(_.cloneDeep(data_source_scope), (item: any) =>
      LARGE_TYPE.includes(item?.sub_type)
    );
    const { create_time, creater_name, creator, edit_time, editor, editor_name } = filterKg || {};
    if (LARGE_TYPE.includes(kgqaType) && _.isEmpty(isExistLargeData)) {
      const data = [
        {
          category: [],
          create_time,
          creater_name,
          creator,
          description: '',
          edit_time,
          editor,
          editor_name,
          kg_id: null,
          model_conf: _.omit(nodes?.[0]?.props?.kgqa?.ans_organize, ['prompt']),
          resource_type: 'model',
          sub_type: kgqaType
        }
      ];
      const newDataSource = [...data, ...data_source_scope];

      return { ...res, data_source_scope: newDataSource };
    }
    return res;
  };

  /**
   * 新建-默认数据保存
   */
  const onCreateDataSave = () => {
    const { knw_id, g_id, s_id } = getParam(['knw_id', 'g_id', 's_id', 'action']);
    setBasicData({
      ...(action === 'create' ? DEFAULT_CONFIG : {}),
      knw_id: parseInt(knw_id),
      knw_name: knwData?.knw_name,
      id: s_id,
      kg_id: parseInt(g_id) || 0,
      action: 'init'
    } as BasicData);
    DEFAULT_CONFIG.props = {
      full_text: { search_config: [], switch: false }
    };
    setTestData({
      ...DEFAULT_CONFIG,
      action: 'init'
    } as any);
    setKgqaData({ ...DEFAULT_CONFIG_KGQA } as any);
    setKgqaConfig({ ...(DEFAULT_CONFIG_KGQA?.props as any) });
  };

  /**
   * 编辑-知识图谱数据处理
   */
  const onHandleGraphSource = (data: any, nodes: any) => {
    const cloneSourceScope = _.cloneDeep(data);
    const kgSource = _.filter(cloneSourceScope, item => {
      const { resource_type } = item;
      if (resource_type === '知识图谱') {
        // 旧数据可能存了 知识图谱
        item.resource_type = 'kg';
      }
      return item?.resource_type !== 'model';
    });
    const cloneFullText = _.cloneDeep(nodes?.[0]?.props?.full_text?.search_config);
    const fullTextConfig = _.map(cloneFullText, (item: any) => {
      _.map(item?.kgs, (i: any) => {
        _.map(kgSource, (k: any) => {
          if (k?.kg_id === i?.kg_id) {
            i.creater_name = k.creater_name;
            i.editor_name = k.editor_name;
          }
        });
        return i;
      });
      return item;
    });
    const newDataSource = _.filter(fullTextConfig, (item: any) => item?.class_name === '全部资源');
    const sourceResult = !_.isEmpty(cloneFullText)
      ? _.map(newDataSource?.[0]?.kgs, kg => ({ ...kg, kg_id: Number(kg.kg_id), resource_type: 'kg' }))
      : kgSource;
    return { sourceResult, fullTextConfig };
  };

  /**
   * 编辑-流程一全部资源
   */
  const onHandleAllSource = (data: any) => {
    const result = _.map(_.cloneDeep(data), kg => {
      if (kg?.resource_type !== 'model') {
        return {
          ...kg,
          kg_id: Number(kg.kg_id),
          resource_type: 'kg'
        };
      } else {
        return {
          ...kg,
          model_name: MODEL_TYPE[kg?.sub_type]
        };
      }
    });
    return result;
  };

  /**
   * 编辑-图谱qa数据存储
   */
  const onHandleQa = async (newDataSource: any, nodes: any, openai_status: boolean) => {
    const model_type = nodes?.[0]?.props?.kgqa?.ans_organize?.type || 'default';
    setQaError(openai_status || model_type === 'default' ? '' : model_type);
    const propertyRes = await getPropertyRes(newDataSource);
    const kgqaDATA = {
      props: {
        ...DEFAULT_CONFIG_KGQA.props,
        data_source_scope: newDataSource,
        confs: propertyRes?.data,
        saveConfs: nodes?.[0]?.props?.kgqa,
        action: 'update',
        limit: nodes?.[0]?.props?.kgqa?.limit,
        threshold: nodes?.[0]?.props?.kgqa?.threshold
      }
    };

    setKgqaData(kgqaDATA);
    setSaveConfs(nodes?.[0]?.props?.kgqa);
    setKgqaConfig(nodes?.[0]?.props?.kgqa);
    setIsOpenQA(nodes?.[0]?.props?.kgqa?.switch);
  };

  /**
   * 编辑-各流程里的数据存储
   */
  const onEditSaveAllData = (p: any, nodes: any, info: any) => {
    setBasicData(pre => ({
      ...pre,
      ...info,
      knw_id: Number(info.knw_id),
      kg_id: Number(info.kg_id),
      oldMethod: info.access_method
    }));

    setTestData({ ...p, action: 'init', switch: nodes?.[0]?.props?.kgqa?.switch });

    const exploration_switch = nodes?.[0]?.props?.kgqa?.exploration_switch;
    setChecked({
      ...checked,
      checked: nodes?.[0]?.props?.full_text.switch,
      qAChecked: nodes?.[0]?.props?.kgqa?.switch,
      card: nodes?.[0]?.props?.knowledge_card?.switch || false,
      recommend: nodes?.[0]?.props?.related_knowledge?.switch || false,
      qaSubgraph: typeof exploration_switch === 'boolean' && !exploration_switch ? false : true
    });
  };

  /**
   * 退出
   */
  const onExit = async (type?: any, data?: any) => {
    if (isSaved) return history.push(`/cognitive-application/domain-intention`);
    const isOk = await tipModalFunc({
      title: intl.get('cognitiveSearch.quit'),
      content: intl.get('cognitiveSearch.notRetrieved'),
      closable: false
    });
    setKnwStudio('');
    if (!isOk) {
      setIsPrevent(true);
      return;
    }
    setIsPrevent(false);
    if (type === 'studio') {
      Promise.resolve().then(() => {
        history.push('/home');
      });
      return;
    }
    if (type === 'knw') {
      Promise.resolve().then(() => {
        history.push(`/cognitive-application/domain-intention?id=${data?.id}&type=search`);
      });
    } else {
      Promise.resolve().then(() => {
        history.push(`/cognitive-application/domain-intention?id=${knwData?.id}&type=search`);
      });
    }
  };

  /**
   * 下一步
   */
  const onNext = (data: any) => {
    setStep(data);
    if (action === 'edit') {
      setBasicData({ ...basicData });
      return;
    }

    basicData.access_method = ['restAPI', 'PC_embed'];
    setBasicData({ ...basicData });
  };

  /**
   * 上一步
   */
  const onPrev = (data: any) => {
    setStep(data);
  };

  /**
   * 修改发布信息
   * @param data 新数据
   */
  const onPublishChange = (data: Partial<BasicData>) => {
    setBasicData({ ...basicData, ...data, action: 'change' });
  };

  /**
   * 退出
   */
  const onExitClassify = () => {
    setIsClassifySetting(false);
  };

  /**
   * 更新流程一的数据
   */
  const onUpdateTableData = (data: any) => {
    firstStepRef?.current?.onChangeTable({ page: 1 }, data);
  };

  const onUpdateTableForLarge = (data: any) => {
    firstStepRef?.current?.onUpdateTableForLarge(data);
  };

  return (
    <div className="search-resource-box kw-h-100">
      {isClassifySetting ? (
        <div className="second-step-classification">
          <div className="left-extra-box">
            <Button onClick={onExitClassify} type="text" className="kw-pl-6">
              <LeftOutlined />
              <span>{intl.get('global.back')}</span>
            </Button>
            <div className="t-name kw-c-header">
              {action !== 'create'
                ? intl.get('cognitiveSearch.classify.editResources')
                : intl.get('cognitiveSearch.classify.createResources')}
              <Tooltip
                title={intl.get('cognitiveSearch.full.sourceClassify')}
                placement="top"
                className="kw-ml-2 icon-why"
              >
                <IconFont type="icon-wenhao" />
              </Tooltip>
            </div>
          </div>
        </div>
      ) : (
        <TopSteps
          step={step}
          title={action === 'create' ? intl.get('cognitiveSearch.createService') : basicData?.name}
          onExit={onExit}
          isHideStep={action === 1}
        />
      )}
      <div className={classNames('search-content kw-mr-6 kw-ml-6', { 'full-container': step === 1 })}>
        <div className={classNames('view-wrapper', step === 0 ? 'show' : 'hide')}>
          <FirstSearchResource
            ref={firstStepRef}
            onNext={onNext}
            onExit={onExit}
            action={action}
            basicData={basicData}
            testData={testData}
            knwData={knwData}
            setTestData={setTestData}
            setQuerySave={setQuerySave}
            checked={checked}
            setChecked={setChecked}
            setIsOpenQA={setIsOpenQA}
            externalModel={externalModel}
            setExternalModel={setExternalModel}
            qaError={qaError}
            setQaError={setQaError}
            emError={emError}
            setEmError={setEmError}
            kgqaConfig={kgqaConfig}
            setKgqaConfig={setKgqaConfig}
            kgqaData={kgqaData}
            setKgqaData={setKgqaData}
            setAdvError={setAdvError}
          />
        </div>
        <div className={classNames('view-wrapper', step === 1 ? 'show' : 'hide')}>
          <SecondSearchTest
            onNext={onNext}
            onPrev={onPrev}
            step={step}
            setTestData={setTestData}
            basicData={basicData}
            testData={testData}
            checked={checked}
            setChecked={setChecked}
            setBasicData={setBasicData}
            querySave={querySave}
            setQuerySave={setQuerySave}
            operateFail={operateFail}
            setOperateFail={setOperateFail}
            isOpenQA={isOpenQA}
            setIsOpenQA={setIsOpenQA}
            kgqaData={kgqaData}
            setKgqaData={setKgqaData}
            kgqaConfig={kgqaConfig}
            setKgqaConfig={setKgqaConfig}
            saveConfs={saveConfs}
            isClassifySetting={isClassifySetting}
            setIsClassifySetting={setIsClassifySetting}
            operateSave={operateSave}
            setOperateSave={setOperateSave}
            qaError={qaError}
            setQaError={setQaError}
            setEmError={setEmError}
            advError={advError}
            isQAConfigError={isQAConfigError}
            setIsQAConfigError={setIsQAConfigError}
            externalModel={externalModel}
            onUpdateTableData={onUpdateTableData}
            onUpdateTableForLarge={onUpdateTableForLarge}
          />
        </div>
        <div className={classNames('view-wrapper', step === 2 ? 'show' : 'hide')}>
          <ThirdPublish
            onPrev={onPrev}
            setOperateFail={setOperateFail}
            setIsPrevent={setIsPrevent}
            setTestData={setTestData}
            onChange={onPublishChange}
            basicData={basicData}
            testData={testData}
            kgqaData={kgqaData}
            setKgqaData={setKgqaData}
            kgqaConfig={kgqaConfig}
            setKgqaConfig={setKgqaConfig}
            checked={checked}
            isOpenQA={isOpenQA}
            qaError={qaError}
            isSaved={isSaved}
            setIsSaved={setIsSaved}
            setIsQAConfigError={setIsQAConfigError}
            externalModel={externalModel}
            emError={emError}
          />
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

export default SearchConfigStep;
