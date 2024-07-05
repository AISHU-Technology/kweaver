/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import intl from 'react-intl-universal';
import { useHistory, useLocation } from 'react-router-dom';
import { Spin, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import apiService from '@/utils/axios-http/oldIndex';
import serviceWorkflow from '@/services/workflow';
import servicesCreateEntity from '@/services/createEntity';
import servicesPermission from '@/services/rbacPermission';
import servicesSubGraph from '@/services/subGraph';

import TipModal from '@/components/TipModal';
import { getParam, sessionStore } from '@/utils/handleFunction';

import Basic from './Basic';
import TopSteps from './TopSteps';
import DataSourceBox from './DataSource';
import FlowCreateEntity from './FlowCreateEntity';
import KnowledgeMap from './KnowledgeMap/KnowledgeMap';
import { graphTipModal } from './GraphTipModal';

import './style.less';
import _ from 'lodash';

const antIconBig = <LoadingOutlined className="load-icon" spin />;

const Workflow = ({ knData }) => {
  const history = useHistory(); // 路由
  const location = useLocation();
  const step1Ref = useRef(); // 绑定流程一组件实例
  const step2Ref = useRef(); // 绑定流程二组件实例
  const step3Ref = useRef(); // 绑定流程三组件实例
  const step4Ref = useRef(); // 绑定流程四组件实例
  const [current, setCurrent] = useState(
    sessionStore.get('graphFlowStep') || sessionStore.get('graphFlowStep') === 0
      ? sessionStore.get('graphFlowStep')
      : location.state?.current ?? 0
  ); // 步骤
  const [dbType, setDbType] = useState('');
  const [osId, setOsId] = useState(0); // 图数据库绑定的openserch id
  const [basicData, setBasicData] = useState({}); // 基本信息
  const [dataSourceData, setDataSourceData] = useState([]); // 数据源
  const [useDs, setUseDs] = useState([]); // 被使用的数据源
  const [ontoData, setOntoData] = useState([]); // 本体
  const [knowMapData, setKnowMapData] = useState({}); // 映射
  const [graphId, setGraphId] = useState(''); // 知识网络ID
  const [quitVisible, setQuitVisible] = useState(false); // 控制退出弹框
  const [dataLoading, setDataLoading] = useState(false); // 流程一加载loading
  const [ontologyId, setOntologyId] = useState(0); // 本体id
  const savedCache = useRef(''); // 保存的数据, 用于退出时判断是否发生变更
  const [parsingSet, setParsingSet] = useState([]); // 流程四文件对应的解析规则
  const [defaultParsingRule, setDefaultParsingRule] = useState({ delimiter: ',', quotechar: '"', escapechar: '"' }); // 默认解析规则
  const [sourceFileType, setSourceFileType] = useState('csv');
  const [parsingTreeChange, setParsingTreeChange] = useState([]); // 未保存时解析规则变化
  const [graphStepNum, setGraphStepNum] = useState(0); // 后端记录图谱已经配置到哪一个步骤, 后端是从1 开始计数的
  const viewMode = location.state?.mode === 'view'; // 是否处于查看模式
  const cacheStep = useRef(null); // 缓存要切换的步骤，待保存成功之后，使用该数据进行流程跳转

  useEffect(() => {
    const knId = location?.search
      ?.slice(1)
      ?.split('&')
      ?.filter(item => item?.includes('knId'))?.[0]
      ?.split('=')[1];
    // servicesPermission.dataPermission(postData).then(result => {
    //   if (_.isEmpty(result?.res?.[0]?.codes)) {
    //     window.location.replace('/home');
    //   }
    // });
    setParsingTreeChange([]);
  }, []);

  // 初始进入, 把body的滚动条隐藏
  // 取出id
  useEffect(() => {
    const id = parseInt(getParam('id'));

    if (id) {
      getGraph(id);
    }

    document.body.classList.add('hidden-scroll');

    return () => {
      document.body.classList.remove('hidden-scroll');
      sessionStore.remove('graphFlowStep');
    };
  }, []);

  // 根据ID获取数据
  const getGraph = async id => {
    setDataLoading(true);
    const res = await serviceWorkflow.graphGet(id);
    setDataLoading(false);
    if (res && res.res) {
      res.res.graph_baseInfo && setBasicData({ ...res.res.graph_baseInfo }); // 获取基本信息的数据
      res.res.graph_ds && setDataSourceData(res.res.graph_ds); // ds
      res.res.graph_used_ds && setUseDs(res.res.graph_used_ds); // 被使用的ds
      res.res.graph_otl && setOntoData(res.res.graph_otl);
      res.res.graph_KMap && setKnowMapData(res.res.graph_KMap);
      setGraphStepNum(res.res.step_num);
      setGraphId(id);
      setOsId(res?.res?.graph_db_id);
      onHandleParsing(res.res.graph_KMap);
    }

    if (res?.Code) {
      switch (true) {
        case res.Code === 500001 && res.Cause.includes('not exist'):
          graphTipModal.open(intl.get('graphList.hasBeenDel'));
          break; // 图谱不存在
        case res.Code === 'Manager.SoftAuth.UnknownServiceRecordError':
          graphTipModal.open(intl.get('graphList.authErr')); // 权限错误 500403
        default:
          // res.Cause && message.error(res.Cause);
          res.Cause &&
            message.error({
              content: res.Cause,
              className: 'custom-class',
              style: {
                marginTop: '6vh'
              }
            });
      }
    }
  };

  /**
   * 解析规则
   */
  const onHandleParsing = graph_KMap => {
    const files = graph_KMap.files;
    if (_.isEmpty(files)) return;
    const handleFormatParsing = _.map(files, item => {
      return _.reduce(
        item.files,
        (pre, key) => {
          pre = [
            ...pre,
            {
              key: key.file_source,
              parsing: { delimiter: key.delimiter, quotechar: key.quotechar, escapechar: key.escapechar }
            }
          ];
          return pre;
        },
        []
      );
    });
    setParsingSet(handleFormatParsing[0]);
  };

  // 下一步
  const next = res => {
    if (res) {
      const { Code, Cause, ErrorCode, Description } = res;
      const curCode = Code || ErrorCode;
      const curCause = Cause || Description;

      // 权限错误
      if (curCode === 500403) {
        graphTipModal.open(intl.get('graphList.authErr'));

        return;
      }

      // 图谱不存在
      if ((curCode === 500001 && curCause?.includes('not exist')) || curCode === 500357) {
        graphTipModal.open(intl.get('graphList.hasBeenDel'));

        return;
      }

      // 知识量已超过量级限制
      if (curCode === 500055) {
        // message.error(intl.get('license.operationFailed'));
        message.error({
          content: intl.get('license.operationFailed'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });

        return;
      }
      // 上传中的图谱不能运行
      if (curCode === 500065) {
        // message.error(intl.get('uploadService.runfailed'));
        message.error({
          content: intl.get('uploadService.runfailed'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
        return;
      }

      // curCause && message.error(curCause);
      curCause &&
        message.error({
          content: curCause,
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
      return;
    }

    if (current + 1 > 5) return;
    const currentStep = cacheStep.current !== null ? cacheStep.current : current + 1;
    switchFlow(currentStep);
    setParsingTreeChange([]);
    graphId && getGraph(graphId);
    cacheStep.current = null;
  };

  // 上一步
  const prev = () => {
    if (current - 1 < 0) return;
    const currentStep = current - 1;
    switchFlow(currentStep);
    setParsingTreeChange([]);
  };

  /**
   * 获取六个流程的数据, 用于保存
   */
  const getSavedBody = async () => {
    const step3Data = step3Ref.current?.getFlowData();
    // 更新流程四映射字段
    // 注意：ontoBody类型已经更改过
    const graph_otl = step3Data?.ontoBody || ontoData?.[0] || {};
    const body = {
      graph_id: parseInt(graphId),
      graph_baseInfo: basicData ? basicData : {},
      graph_ds: dataSourceData.map(value => value.id),
      graph_otl
    };
    if (current === 1) {
      // 流程二分两种情况
      // 1、此时只进入流程二，没有进过流程四，那么此时是获取不到流程四组件内部的映射数据
      // 2、进过流程四，此时处于流程二
      const graph_KMap = step4Ref.current?.getGraphKMapParam();
      body.graph_KMap = graph_KMap ?? knowMapData;
    }
    if (current === 2) {
      // 流程三会影响流程四
      const graph_KMap = await step3Ref.current?.updateFlow4GraphKMap(graph_otl);
      body.graph_KMap = graph_KMap;
    }
    if (current === 3) {
      // 流程四
      const graph_KMap = step4Ref.current?.getGraphKMapParam();
      body.graph_KMap = graph_KMap;
    }
    return body;
  };

  /**
   * 流程四上一步需要保存
   */
  const onPrevByExtract = async () => {
    const body = getSavedBody();
    const res = await serviceWorkflow.graphSaveNoCheck(body);
    res?.res && prev();
  };

  /**
   * 点击退出 或 退出弹窗的确认按钮
   */
  const onExitClick = () => {
    if (viewMode) {
      history.goBack();
      return;
    }

    if (current === 0 && !step1Ref.current.isModify()) {
      let graphIdFix = '';
      if (window.location.pathname.includes('edit')) {
        const id = getParam('id');
        graphIdFix = `&gid=${id}`;
      }
      history.push(`/knowledge/studio-network?id=${window.sessionStorage.getItem('selectedKnowledgeId') + graphIdFix}`);
      return;
    }

    // 已保存且无变更, 直接退出
    if (savedCache.current) {
      const body = getSavedBody();
      if (JSON.stringify(body) === savedCache.current) {
        return history.push(`/knowledge/studio-network?id=${window.sessionStorage.getItem('selectedKnowledgeId')}`);
      }
    }

    setQuitVisible(true);
  };

  // 放弃保存
  const handleCancel = () => {
    setQuitVisible(false);

    if (current === 0) return;

    Object.keys(apiService.sources).forEach(key => {
      if (key.includes('/api/builder/v1/ds/testconnect') || key.includes('/api/builder/v1/onto/auto/autogenschema')) {
        apiService.sources[key]('取消请求');
      }
    });

    // 删除新增的任务
    deleteTaskList();
    history.push(`/knowledge/studio-network?id=${window.sessionStorage.getItem('selectedKnowledgeId')}`);
  };

  /**
   * 确认保存退出
   * @param {boolean} isExist 是否退出
   * @param {boolean} messageVisible 是否显示保存成功的message信息
   */
  const handleSave = async (isExist = true, messageVisible = true) => {
    isExist &&
      Object.keys(apiService.sources).forEach(key => {
        if (key.includes('/api/builder/v1/ds/testconnect') || key.includes('/api/builder/v1/onto/auto/autogenschema')) {
          apiService.sources[key]('取消请求');
        }
      });

    setQuitVisible(false);

    if (current === 0) {
      history.push(`/knowledge/studio-network?id=${window.sessionStorage.getItem('selectedKnowledgeId')}`);
      return;
    }

    // 流程中新建本体保存并退出, 需要保存分组
    const step3Data = step3Ref.current?.getFlowData();
    if (current === 2 && step3Data?.groupBody) {
      servicesSubGraph.subgraphSave(graphId, step3Data.groupBody);
    }

    const body = await getSavedBody();
    !isExist && (savedCache.current = JSON.stringify(body)); // 若不退出, 缓存保存的数据
    const res = await serviceWorkflow.graphSaveNoCheck(body);

    if (res && isExist) {
      history.push(`/knowledge/studio-network?id=${window.sessionStorage.getItem('selectedKnowledgeId')}`);
    }

    if (!isExist) {
      if (res?.res) {
        getGraph(graphId);
        if (messageVisible) {
          // return message.success(intl.get('global.saveSuccess'));
          return message.success({
            content: intl.get('global.saveSuccess'),
            className: 'custom-class',
            style: {
              marginTop: '6vh'
            }
          });
        }
        return;
      }
      // res?.Description && message.error(res.Description);
      res?.Description &&
        message.error({
          content: res.Description,
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
    }
  };

  /**
   * @description 删除任务
   */
  const deleteTaskList = () => {
    if (ontoData[0] && (ontoData[0].id || ontoData[0].ontology_id)) {
      servicesCreateEntity.delAllEntityTask(ontoData[0].id);
    }
  };

  /**
   * 更新已使用的数据源
   * @param {number[]} ids
   */
  const updateUsedDs = ids => {
    const dsObj = dataSourceData.filter(d => ids.includes(d.id));
    setUseDs(dsObj);
  };

  const switchFlow = step => {
    setCurrent(step);
    sessionStore.set('graphFlowStep', step);
  };

  /**
   * 顶部步骤条切换事件
   */
  const onStepChange = async step => {
    if (viewMode) {
      switchFlow(step);
      return;
    }
    cacheStep.current = step;
    let validateSave = false;
    if (step > current) {
      // 说明是向后切换，需要调带检验的保存接口
      validateSave = true;
    }
    if (current === 0) {
      // 流程一界面  切换步骤，一定调用的是下一步的保存接口
      step1Ref.current.next();
    }
    if (current === 1) {
      // 流程二界面  切换步骤，一定调用的是下一步的保存接口
      step2Ref.current.next();
    }
    if (current === 2) {
      // 流程三界面  切换步骤
      if (validateSave) {
        step3Ref.current?.flowFooterNext();
      } else {
        await step3Ref.current?.flowFooterSave();
        switchFlow(step);
        cacheStep.current = null;
      }
    }
    if (current === 3) {
      step4Ref.current?.save();
      switchFlow(step);
      cacheStep.current = null;
    }
  };

  return (
    <div className="new-work-flow kw-flex-column" id="newWorkFlowScroll">
      <div className="work-flow-header">
        <TopSteps
          graphStepNum={graphStepNum}
          current={current}
          setCurrent={setCurrent}
          onExit={onExitClick}
          graphName={basicData.graph_Name}
          onStepChange={onStepChange}
          ontoData={ontoData}
        />
      </div>

      {/*{dataLoading ? (*/}
      {/*  <div className="workflow-spin">*/}
      {/*    <Spin indicator={antIconBig} />*/}
      {/*  </div>*/}
      {/*) : null}*/}
      <div className="work-flow-container kw-flex-item-full-height">
        {/* 默认切换步骤不卸载其他步骤的dom结构。 */}
        <div className={`hide space ${current === 0 && 'show'}`}>
          <Basic
            graphId={graphId}
            basicData={basicData}
            dataLoading={dataLoading}
            next={next}
            setBasicData={setBasicData}
            setGraphId={setGraphId}
            ref={step1Ref}
            setGraphStepNum={setGraphStepNum}
            setOntologyId={setOntologyId}
          />
        </div>
        <div className={`hide space ${current === 1 && 'show'}`}>
          <DataSourceBox
            flowCurrent={current}
            dataSourceData={dataSourceData}
            setDataSourceData={setDataSourceData}
            useDs={useDs}
            graphId={graphId}
            next={next}
            prev={prev}
            dataSourceRef={step2Ref}
            // ontoData={ontoData}
            // ontology_id={ontologyId}
            // setOntologyId={setOntologyId}
          />
        </div>
        <div className={`hide kw-border-t kw-h-100 ${current === 2 && 'show'}`}>
          <FlowCreateEntity
            knData={knData}
            next={next}
            prev={prev}
            useDs={useDs}
            dbType={dbType}
            setUseDs={setUseDs}
            ontoData={ontoData}
            setOntoData={setOntoData}
            current={current}
            graphId={graphId}
            childRef={step3Ref}
            ontologyId={ontologyId}
            osId={osId}
            onSave={(messageVisible = true) => handleSave(false, messageVisible)}
            defaultParsingRule={defaultParsingRule}
            setDefaultParsingRule={setDefaultParsingRule}
            sourceFileType={sourceFileType}
            setSourceFileType={setSourceFileType}
            parsingTreeChange={parsingTreeChange}
            setParsingTreeChange={setParsingTreeChange}
          />
        </div>
        <div className={`hide kw-border-t kw-h-100 ${current === 3 && 'show'}`}>
          <KnowledgeMap
            currentStep={current}
            onPrev={prev}
            footerRef={step4Ref}
            onSave={(messageVisible = true) => handleSave(false, messageVisible)}
            defaultParsingRule={defaultParsingRule}
            parsingSet={parsingSet}
            setParsingSet={setParsingSet}
            setParsingTreeChange={setParsingTreeChange}
            parsingTreeChange={parsingTreeChange}
          />
        </div>
      </div>

      <TipModal
        closable
        open={quitVisible}
        onClose={() => setQuitVisible(false)}
        onCancel={handleCancel}
        onOk={handleSave}
        title={intl.get('workflow.exitOperation')}
        content={current ? intl.get('workflow.exitText1') : intl.get('workflow.exitText')}
        cancelText={current ? intl.get('workflow.noSave') : intl.get('global.cancel')}
        okText={current ? intl.get('workflow.saveClose') : intl.get('global.ok')}
      />
    </div>
  );
};

export default Workflow;
