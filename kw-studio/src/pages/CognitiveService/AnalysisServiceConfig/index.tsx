/**
 * 认知服务-图分析服务配置
 */
import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { Prompt, useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import analysisService from '@/services/analysisService';
import serviceGraphDetail from '@/services/graphDetail';
import cognitiveSearchService from '@/services/cognitiveSearch';
import servicesPermission from '@/services/rbacPermission';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

import { GRAPH_LAYOUT, ANALYSIS_SERVICES, PERMISSION_KEYS, GRAPH_LAYOUT_PATTERN } from '@/enums';
import { tipModalFunc } from '@/components/TipModal';
import LoadingMask from '@/components/LoadingMask';
import { getParam } from '@/utils/handleFunction';
import TopSteps from './TopSteps';
import BaseInfo from './BaseInfo';
import ConfigAndTest from './ConfigAndTest';
import Publish from './Publish';
import { KnwItem, BasicData, TestData, ActionType } from './types';
import './style.less';

const { ACCESS_METHOD, PERMISSION } = ANALYSIS_SERVICES;

// 判断进入的界面
// 点击【编辑】进入服务，跳转「配置策略与测试」页面
// 点击【发布】进入服务，跳转「发布服务」页面
const getFirstParam = () => {
  let action = getParam('action') as ActionType;
  if (!['edit', 'publish', 'import'].includes(action)) {
    action = 'create';
  }
  const step = action === 'edit' ? 1 : action === 'publish' ? 2 : 0;
  return { step, action };
};
// 2.0.1.4版本, 部分配置直接写死
const DEFAULT_CONFIG: Partial<BasicData & TestData> = {
  operation_type: 'custom-search',
  canvas_config: JSON.stringify({ key: GRAPH_LAYOUT.FREE }),
  canvas_body: '',
  permission: PERMISSION.APPID_LOGIN,
  access_method: [ACCESS_METHOD.REST_API, ACCESS_METHOD.PC_EMBED]
};

export interface AnalysisServiceConfigProps {
  knwData?: KnwItem;
}

const AnalysisServiceConfig = (props: AnalysisServiceConfigProps) => {
  const history = useHistory();
  const [step, setStep] = useState(() => getFirstParam().step);
  // const [step, setStep] = useState(1);
  const [action] = useState<ActionType>(() => getFirstParam().action); // 进入页面的动作行为
  const [basicData, setBasicData] = useState<BasicData>({} as BasicData); // 基本信息
  const [testData, setTestData] = useState<TestData>({} as TestData); // 配置与测试数据
  const [loading, setLoading] = useState(false); // 初始化的loading
  const [isPrevent, setIsPrevent] = useState(true); // 是否阻止路由跳转
  const [ontoData, setOntoData] = useState<any>([]);
  const [saveImportEntity, setSaveImportEntity] = useState<any>([]); // 导入的实体类信息
  const [isExist, setIsExist] = useState(false);
  const [isChange, setIsChange] = useState(false); // 导入后更改选中图谱，流程二配置更新

  const [isSaved, setIsSaved] = useState<boolean>(false); // 是否保存

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    getClassData();
  }, [basicData?.kg_id]);

  /** 获取本体信息 */
  const getClassData = async () => {
    const id: any = basicData?.kg_id; // 图谱id
    if (parseInt(id) <= 0 || Number.isNaN(parseInt(id))) return;

    try {
      const resultOnto = await serviceGraphDetail.graphGetInfoOnto({ graph_id: id });
      const entityData = resultOnto?.res;
      setOntoData(entityData);
    } catch (err) {
      //
      const { ErrorCode } = err?.data || {};
      if (ErrorCode === 'Gateway.Common.NoDataPermissionError') {
        message.error(intl.get('analysisService.noGraphAuth'));
      }
    }
  };
  /**
   * 初始化页面, 获取路由参数
   * {knw_id、knw_name：知识网络id、名称}  {g_id：图谱id}  {service_id：服务id} {config_id: 文件解析传参}
   */
  const init = async () => {
    const { knw_name, g_id, service_id, config_id } = getParam([
      'knw_name',
      'g_id',
      'service_id',
      'action',
      'config_id'
    ]);

    setBasicData({
      ...(action === 'create' ? DEFAULT_CONFIG : {}),
      knw_id: 0,
      knw_name: knw_name || '',
      id: service_id,
      kg_id: parseInt(g_id) || 0,
      action: 'init',
      graphLayoutPattern: GRAPH_LAYOUT_PATTERN.COMMON
    } as BasicData);
    setTestData({ ...DEFAULT_CONFIG, action: 'init' } as any);
    if (!service_id && action !== 'import') return;
    try {
      setLoading(true);
      // 导入文件返回不是{res:xxx}格式，因此解析不同
      const res =
        action === 'import'
          ? await analysisService.analysisServiceInfo({ config_id })
          : (await analysisService.analysisServiceGet(service_id)) || {};

      if (action === 'import') {
        const knw_name = await getKwName(res?.knw_id);
        if (res?.kg_id !== '-1') {
          const { config_info, canvas_config, canvas_body, knw_id, ...info } = res;
          const handleData = { config_info, canvas_config, canvas_body, action: 'init' };
          const basicUpdate = {
            ...basicData,
            ...info,
            knw_name,
            knw_id: parseInt(knw_id) || 0,
            kg_id: Number(info.kg_id)
          };
          // 处理实体类信息{name:{properties}} 方便后面进行信息对比
          if (!_.isEmpty(config_info) && action === 'import') {
            const handleProperty: any = [];
            _.map(config_info?.filters, (item: any) => {
              _.map(item?.v_filters, (m: any) => {
                handleProperty.push({
                  name: m?.tag,
                  properties: _.map(m?.property_filters, (p: any) => {
                    return { name: p?.name, type: p?.type };
                  })
                });
              });
            });
            setSaveImportEntity(handleProperty);
          }
          getGraphList(knw_id, basicUpdate, handleData);
          return;
        }
        setIsExist(true);
        message.error(intl.get('analysisService.importService.notFound'));
        const { config_info, knw_id, canvas_config, canvas_body, ...info } = res;
        const { graphLayoutPattern } = JSON.parse(canvas_body);
        setBasicData({
          ...basicData,
          ...info,
          knw_id: parseInt(knw_id),
          knw_name,
          id: service_id,
          kg_id: 0,
          action: 'init',
          graphLayoutPattern
        } as BasicData);
        setTestData({ ...DEFAULT_CONFIG, action: 'init' } as any);
        setLoading(false);
        return;
      }
      setLoading(false);
      if (res?.res) {
        const { config_info, canvas_config, canvas_body, ...info } = res?.res;
        const { graphLayoutPattern } = JSON.parse(canvas_body);
        setBasicData(pre => ({
          ...pre,
          ...info,
          knw_id: Number(info.knw_id),
          kg_id: Number(info.kg_id),
          graphLayoutPattern
        }));
        setTestData({ config_info, canvas_config, canvas_body, action: 'init' });
        return;
      }
    } catch (err) {
      setLoading(false);
      const { Description } = err?.data || err || {};
      Description && message.error(Description);
    }
  };

  const getKwName = async (id: any) => {
    const params = { size: 1000, page: 1, rule: 'update', order: 'desc' };
    const { res = {} } = (await servicesKnowledgeNetwork.knowledgeNetGet(params)) || {};
    const knw_name = _.find(res?.df, item => String(item?.id) === String(id))?.knw_name;
    const importErr = !knw_name && action === 'import';
    if (importErr) {
      message.error('未找到配置的知识网络,请重新选择知识网络');
      // return setErrors(pre => ({ ...pre, knw: ' ' }));
    }

    return knw_name;
  };

  /**
   * 查询图谱
   * @param id 知识网络id
   */
  const getGraphList = async (id: number, data: any, handleData: any) => {
    try {
      // 获取有效图谱
      const { res } = (await cognitiveSearchService.getKgList(id)) || {};

      if (res?.df) {
        const dataIds = _.map(res?.df, item => String(item.id));
        const postData = { dataType: PERMISSION_KEYS.TYPE_KG, dataIds };
        // servicesPermission.dataPermission(postData).then(result => {
        //   const codesData = _.keyBy(result?.res, 'dataId');
        //   const newGraphData = _.filter(res?.df, item => {
        //     const hasAuth = _.includes(codesData?.[item.id]?.codes, 'KG_VIEW');
        //     return hasAuth;
        //   });
        //   const cloneList = _.cloneDeep(newGraphData);
        //   const kgName = _.filter(cloneList, (item: any) => item.id === parseInt(data?.kg_id));

        //   if (_.isEmpty(kgName)) {
        //     // 未找到相同id
        //     setBasicData({ ...data, kg_id: 0 });
        //     setTestData({ ...handleData });
        //     setLoading(false);
        //     message.error(intl.get('analysisService.importService.notFound'));
        //     setIsExist(true);
        //   } else {
        //     // 找到相同id，判断本体信息是否一致
        //     onHandleEqual(data, kgName, handleData);
        //   }
        // });
        const cloneList = _.cloneDeep(res?.df);
        const kgName = _.filter(cloneList, (item: any) => item.id === parseInt(data?.kg_id));

        if (_.isEmpty(kgName)) {
          // 未找到相同id
          setBasicData({ ...data, kg_id: 0 });
          setTestData({ ...handleData });
          setLoading(false);
          message.error(intl.get('analysisService.importService.notFound'));
          setIsExist(true);
        } else {
          // 找到相同id，判断本体信息是否一致
          onHandleEqual(data, kgName, handleData);
        }
      }
    } catch (error) {
      //
    }
  };

  /**
   * 导入图谱本体信息与获取的信息是否一致
   */
  const onHandleEqual = async (data: any, kgName: any, handleData: any) => {
    let isModal = true;
    try {
      const resultOnto = await serviceGraphDetail.graphGetInfoOnto({ graph_id: parseInt(data?.kg_id) });
      const entityData = resultOnto?.res;
      const copyEntity = _.cloneDeep(entityData);
      const copyOntoData = _.cloneDeep(saveImportEntity);
      // 判断切换后的图谱信息是否一致
      // 导入图谱的所有kg_id

      // 最短路径和全路径(图谱kg_id和起始点是否完全一致)
      if (['shortest-path', 'full-path'].includes(data.operation_type)) {
        // 图谱名
        const filterEntityName = _.map(copyEntity?.entity, (item: any) => item?.name);
        const filterStart = _.filter(filterEntityName, (item: any) =>
          handleData?.config_info?.start_tags.includes(item)
        );
        const filterEnd = _.filter(filterEntityName, (item: any) => handleData?.config_info?.end_tags.includes(item));
        const isEqualLength =
          filterStart?.length === handleData?.config_info?.start_tags?.length &&
          filterEnd?.length === handleData?.config_info?.end_tags?.length;
        if (_.isEmpty(copyOntoData)) {
          if (isEqualLength) {
            isModal = true;
          } else {
            isModal = false;
          }
        } else {
          const { handleOnto, handleEntity } = onHandleDataReduce(copyOntoData, copyEntity);

          const isEqual = JSON.stringify(_.sortBy(handleOnto)) === JSON.stringify(_.sortBy(handleEntity));
          const isUpdate = isEqual && isEqualLength;

          if (isUpdate) {
            isModal = true;
          } else {
            isModal = false;
          }
        }

        if (isModal) {
          setLoading(false);
          setBasicData({ ...data, kg_name: kgName?.[0]?.name });
          setTestData({ ...handleData });
        } else {
          message.error(intl.get('analysisService.importService.notFound'));
          setLoading(false);
          setIsExist(true);
          setBasicData({ ...data, kg_id: 0 });
          setTestData({ ...handleData });
        }
        return;
      } else if (data.operation_type === 'custom-search') {
        // 自定义查询
        let isExitEntity = false;
        const handleEntity = _.reduce(
          handleData?.config_info?.params,
          (pre: any, key: any) => {
            if (!key?.entity_classes) {
              isExitEntity = true;
            }
            return pre?.concat(key?.entity_classes || []);
          },
          []
        );
        const repeatEntity = [...new Set(handleEntity)];
        const filterData = _.filter(entityData?.entity, (item: any) => repeatEntity.includes(item?.name));
        const isEqual = repeatEntity?.length === filterData?.length;
        // && entityData?.entity?.length === handleData?.config_info?.params?.length;

        if (isEqual) {
          isModal = true;
        } else {
          isModal = false;
        }
      } else {
        // 邻居查询
        const allKgIds = _.map(copyOntoData, (item: any) => item?.name);
        const filterEntity = _.map(copyEntity?.entity, (item: any) => allKgIds.includes(item?.name));
        const lengthIsEqual = allKgIds?.length === filterEntity?.length && copyEntity?.length === copyOntoData?.length;
        const isSameName = _.filter(copyEntity?.entity, (item: any) =>
          handleData?.config_info?.tags?.includes(item?.name)
        );
        const notSame = _.isEmpty(copyOntoData)
          ? isSameName?.length === handleData?.config_info?.tags?.length
          : lengthIsEqual && isSameName?.length === handleData?.config_info?.tags?.length;

        if (notSame) {
          isModal = true;
        } else if (!_.isEmpty(copyOntoData)) {
          const { handleOnto, handleEntity } = onHandleDataReduce(copyOntoData, copyEntity);
          const isEqual = JSON.stringify(_.sortBy(handleOnto)) === JSON.stringify(_.sortBy(handleEntity));
          const isUpdate = !_.isEmpty(copyOntoData)
            ? isEqual && isSameName?.length === copyEntity?.entity?.length
            : isSameName?.length === copyEntity?.entity?.length;
          if (isUpdate) {
            isModal = false;
          } else {
            isModal = true;
          }
        } else {
          isModal = false;
        }
      }

      if (isModal) {
        setBasicData({ ...data, kg_name: kgName?.[0]?.name });
        setTestData({ ...handleData });
        setLoading(false);
      } else {
        setIsExist(true);
        message.error(intl.get('analysisService.importService.notFound'));
        setBasicData({ ...data, kg_id: 0 });
        setTestData({ ...handleData });
        setLoading(false);
      }
    } catch (err) {
      //
    }
  };

  const onHandleDataReduce = (copyOntoData: any, copyEntity: any) => {
    const handleOnto = _.reduce(
      copyOntoData,
      (pre: any, key: any) => {
        pre[key.name] = _.map(key?.properties, (item: any) => ({ name: item?.name, type: item?.type }));
        return pre;
      },
      {}
    );
    const handleEntity = _.reduce(
      copyEntity?.entity,
      (pre: any, key: any) => {
        pre[key.name] = key.properties;
        return pre;
      },
      {}
    );
    return { handleOnto, handleEntity };
  };

  /**
   * 退出
   */
  const onExit = async (location?: { pathname: string; search: string }) => {
    if (isSaved) return history.push('/cognitive-application/domain-analysis');
    const isOk = await tipModalFunc({
      title: intl.get('analysisService.existTitle'),
      content: intl.get('analysisService.existTip'),
      closable: false
    });
    if (!isOk) return;
    setIsPrevent(false);
    Promise.resolve().then(() => {
      if (location?.pathname && location.pathname !== '/cognitive-application/domain-analysis') {
        return history.push(location.pathname + location.search);
      }
      history.push('/cognitive-application/domain-analysis');
    });
  };

  /**
   * 上一步
   */
  const onPrev = () => {
    if (step === 0) return;
    setStep(step - 1);
  };

  /**
   * 下一步
   */
  const onNext = () => {
    if (step === 2) return;
    setStep(step + 1);
  };

  /**
   * 修改基本信息(流程一)
   * @param data 新数据
   */
  const onBasicChange = async (data: Partial<BasicData>, isClear = true) => {
    setBasicData({ ...basicData, ...data, action: 'change' });
    setIsSaved(false);
    if (isClear) {
      // 清空配置
      setTestData({
        config_info: {},
        canvas_config: JSON.stringify({ key: GRAPH_LAYOUT.FREE }),
        canvas_body: '',
        action: 'init'
      });
    }
  };

  /**
   * 修改基配置与测试数据
   * @param data 新数据
   */
  const onTestChange = (data: Partial<TestData>) => {
    setTestData({ ...testData, ...data, action: 'change' });
    setIsChange(true);
  };

  /**
   * 修改发布信息
   * @param data 新数据
   */
  const onPublishChange = (data: Partial<BasicData>) => {
    setBasicData({ ...basicData, ...data, action: 'change' });
  };

  return (
    <div className="analysis-service-config-root kw-flex-column kw-h-100">
      <TopSteps
        step={step}
        title={['create', 'import'].includes(action) ? intl.get('analysisService.createTitle') : basicData.name || ''}
        onExit={onExit}
      />

      <div className="container-wrapper">
        <LoadingMask loading={loading} />

        <div className={classNames('view-wrapper', step === 0 ? 'show' : 'hide')}>
          <BaseInfo
            action={action}
            disabled={(action !== 'create' || !!basicData.id) && action !== 'import'}
            basicData={basicData}
            isExist={isExist}
            isConfigured={!_.isEmpty(testData.config_info)}
            onChange={onBasicChange}
            saveImportEntity={saveImportEntity}
            onNext={onNext}
            onExit={onExit}
            testData={testData}
            setIsChange={setIsChange}
          />
        </div>
        <div className={classNames('view-wrapper', step === 1 ? 'show' : 'hide')}>
          <ConfigAndTest
            step={step}
            action={action}
            ontoData={ontoData}
            onChange={onTestChange}
            basicData={basicData}
            testData={testData}
            onPrev={onPrev}
            onNext={onNext}
            isChange={isChange}
            setIsSaved={setIsSaved}
          />
        </div>
        <div className={classNames('view-wrapper', step === 2 ? 'show' : 'hide')}>
          <Publish
            action={action}
            onChange={onPublishChange}
            basicData={basicData}
            testData={testData}
            isSaved={isSaved}
            setIsSaved={setIsSaved}
            onPrev={onPrev}
            setIsPrevent={setIsPrevent}
          />
        </div>
      </div>

      <Prompt
        when={isPrevent}
        message={location => {
          onExit(location);
          return false;
        }}
      />
    </div>
  );
};

export default AnalysisServiceConfig;
