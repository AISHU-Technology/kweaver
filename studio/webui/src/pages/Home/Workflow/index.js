import React, { useState, useEffect, useRef } from 'react';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Button, Spin, message, Modal } from 'antd';
import { LeftOutlined, LoadingOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import apiService from '@/utils/axios-http';
import servicesCreateEntity from '@/services/createEntity';
import serviceWorkflow from '@/services/workflow';

import IconFont from '@/components/IconFont';
import { getParam } from '@/utils/handleFunction';

import TopSteps from './TopSteps';
import Basic from './Basic';
import InfoExtr from './InfoExtr';
import DataSourceBox from './DataSource/index';
import FlowCreateEntity from './FlowCreateEntity';
import NewKnowledgeMap from './NewKnowledgeMap';
import Mix from './Mix';
import { graphTipModal } from './GraphTipModal';

import './style.less';

const antIconBig = <LoadingOutlined className="load-icon" spin />;

const Workflow = props => {
  const history = useHistory(); // 路由
  const step1Ref = useRef(); // 绑定流程一组件实例
  const step2Ref = useRef(); // 绑定流程二组件实例
  const step3Ref = useRef(); // 绑定流程三组件实例
  const step4Ref = useRef(); // 绑定流程四组件实例
  const step5Ref = useRef(); // 绑定流程五组件实例
  const step6Ref = useRef(); // 绑定流程六组件实例
  const [current, setCurrent] = useState(0); // 步骤
  const [dbType, setDbType] = useState('');
  const [basicData, setBasicData] = useState({}); // 基本信息
  const [dataSourceData, setDataSourceData] = useState([]); // 数据源
  const [useDs, setUseDs] = useState([]); // 被使用的数据源
  const [ontoData, setOntoData] = useState([]); // 本体
  const [infoExtrData, setInfoExtrData] = useState([]); // 抽取
  const [knowMapData, setKnowMapData] = useState([]); // 映射
  const [conflation, setConflation] = useState([]); // 融合
  const [graphId, setGraphId] = useState(''); // 知识网络ID
  const [graphStatus, setGraphStatus] = useState(''); // 图谱状态
  const [quitVisible, setQuitVisible] = useState(false); // 控制退出弹框
  const [dataLoading, setDataLoading] = useState(false); // 流程一加载loading

  useEffect(() => {
    if (history?.location?.pathname === '/home/workflow/create') {
      document.title = `${intl.get('workflow.newGraph')}_KWeaver`;
    }
    if (history?.location?.pathname === '/home/workflow/edit') {
      document.title = `${intl.get('workflow.editGraph')}_KWeaver`;
    }
  }, []);

  // 初始进入, 把body的滚动条隐藏
  // 取出id
  useEffect(() => {
    const id = parseInt(getParam('id'));

    if (id) {
      getGraph(id);
    }

    document.body.classList.add('hidden-scroll');
    return () => document.body.classList.remove('hidden-scroll');
  }, []);

  // 根据ID获取数据
  const getGraph = async id => {
    setDataLoading(true);
    const res = await serviceWorkflow.graphGet(id);
    setDataLoading(false);

    if (res && res.res) {
      res.res.graph_baseInfo && setBasicData(res.res.graph_baseInfo[0]); // 获取基本信息的数据
      res.res.graph_ds && setDataSourceData(res.res.graph_ds); // ds
      res.res.graph_used_ds && setUseDs(res.res.graph_used_ds); // 被使用的ds
      res.res.graph_otl && setOntoData(res.res.graph_otl);
      res.res.graph_InfoExt && setInfoExtrData(res.res.graph_InfoExt);
      res.res.graph_KMap && setKnowMapData(res.res.graph_KMap);
      res.res.graph_KMerge && setConflation(res.res.graph_KMerge);
      res.res.graph_status && setGraphStatus(res.res.graph_status);
      setGraphId(id);
    }

    if (res?.Code) {
      switch (true) {
        case res.Code === 500001 && res.Cause.includes('not exist'):
          graphTipModal.open(intl.get('graphList.hasBeenDel')); // 图谱不存在
          break;
        case res.Code === 'Studio.SoftAuth.UnknownServiceRecordError':
          graphTipModal.open(intl.get('graphList.authErr')); // 权限错误 500403
          break;
        default:
          res.Cause && message.error(res.Cause);
      }
    }
  };

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
      if ((curCode === 500001 && curCause && curCause.includes('not exist')) || curCode === 500357) {
        graphTipModal.open(intl.get('graphList.hasBeenDel'));
        return;
      }

      // 知识量已超过量级限制
      if (curCode === 500055) {
        message.error(intl.get('graphList.errorByCapacity'));
        return;
      }

      curCause && message.error(curCause);
      return;
    }

    if (current + 1 > 5) return;

    setCurrent(current + 1);
  };

  const prev = () => {
    if (current - 1 < 0) return;

    setCurrent(current - 1);
  };

  /**
   * 点击退出 或 退出弹窗的确认按钮
   */
  const onExit = () => {
    if (current === 0 && !step1Ref.current.isModify()) {
      if (window.location.pathname.includes('edit')) {
        const id = parseInt(getParam('id'));
        history.push(`/knowledge/network?id=${window.sessionStorage.getItem('selectedKnowledgeId')}&editId=${id}`);
        return;
      }

      history.push(`/knowledge/network?id=${window.sessionStorage.getItem('selectedKnowledgeId')}`);
      return;
    }

    setQuitVisible(true);
  };

  /**
   * 放弃保存
   */
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
    history.push(`/knowledge/network?id=${window.sessionStorage.getItem('selectedKnowledgeId')}`);
  };

  /**
   * 确认保存
   */
  const handleSave = async () => {
    Object.keys(apiService.sources).forEach(key => {
      if (key.includes('/api/builder/v1/ds/testconnect') || key.includes('/api/builder/v1/onto/auto/autogenschema')) {
        apiService.sources[key]('取消请求');
      }
    });

    setQuitVisible(false);

    if (current === 0) {
      history.push(`/knowledge/network?id=${window.sessionStorage.getItem('selectedKnowledgeId')}`);

      return;
    }

    const step3Data = step3Ref.current?.getFlowData();
    const step4Data = step4Ref.current?.getFlowData();
    const step5Data = step5Ref.current?.getFlowData();
    const step6Data = step6Ref.current?.getFlowData();

    // 流程中新建本体保存并退出,如果输入了本体名称或描述，如果正确，就创建本体
    if (current === 2 && step3Ref.current.state.editEntityModalRef) {
      step3Ref.current.state.editEntityModalRef.saveAndQuit();
    }

    const body = {
      graph_id: parseInt(graphId),
      graph_baseInfo: basicData ? [basicData] : [],
      graph_ds: dataSourceData.map(value => value.id),
      graph_otl: step3Data.length ? step3Data : ontoData,
      graph_InfoExt: step4Data,
      graph_KMap: step5Data.length ? step5Data : knowMapData,
      graph_KMerge: step6Data.length ? step6Data : conflation
    };

    const res = await serviceWorkflow.graphSaveNoCheck(body);

    if (res) {
      history.push(`/knowledge/network?id=${window.sessionStorage.getItem('selectedKnowledgeId')}`);
    }
  };

  /**
   * 删除任务
   */
  const deleteTaskList = () => {
    if (ontoData[0] && (ontoData[0].id || ontoData[0].ontology_id)) {
      servicesCreateEntity.delAllEntityTask(ontoData[0].id);
    }
  };

  return (
    <div className="new-work-flow" id="newWorkFlowScroll">
      <div className="work-flow-header">
        <TopSteps current={current} />

        <div className="back-btn">
          <Button className="ant-btn-default bt" onClick={onExit}>
            <LeftOutlined />
            <span className="word">{intl.get('workflow.exit')}</span>
          </Button>
        </div>

        <div className="network-info">
          <IconFont type="icon-graph" className="icon" />
        </div>

        <div className="network-tent">
          <div className="title">{intl.get('workflow.nameC')}</div>
          <div className="name">{basicData && basicData.graph_Name ? basicData.graph_Name : '-'}</div>
          <div className="type">● {graphStatus ? [intl.get('workflow.eidt')] : [intl.get('workflow.create')]}</div>
        </div>
      </div>

      {dataLoading ? (
        <div className="workflow-spin">
          <Spin indicator={antIconBig} />
        </div>
      ) : null}

      <div className="work-flow-container">
        <div className={`hide space center ${current === 0 && 'show'}`}>
          <Basic
            graphId={graphId}
            basicData={basicData}
            graphStatus={graphStatus}
            dataLoading={dataLoading}
            next={next}
            setDbType={setDbType}
            setBasicData={setBasicData}
            setGraphId={setGraphId}
            ref={step1Ref}
          />
        </div>
        <div className={`hide space center ${current === 1 && 'show'}`}>
          <DataSourceBox
            dataSourceData={dataSourceData}
            setDataSourceData={setDataSourceData}
            useDs={useDs}
            graphId={graphId}
            next={next}
            prev={prev}
            dataSourceRef={step2Ref}
          />
        </div>
        <div className={`hide ${current === 2 && 'show'}`}>
          <FlowCreateEntity
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
            setQuitVisible={setQuitVisible}
          />
        </div>
        <div className={`hide space center ${current === 3 && 'show'}`}>
          <InfoExtr
            next={next}
            prev={prev}
            graphId={graphId}
            current={current}
            useDs={useDs}
            setUseDs={setUseDs}
            dataSourceData={dataSourceData}
            ontoData={ontoData}
            infoExtrData={infoExtrData}
            setInfoExtrData={setInfoExtrData}
            ref={step4Ref}
          />
        </div>
        <div className={`hide space ${current === 4 && 'show center'}`}>
          <NewKnowledgeMap
            next={next}
            prev={prev}
            current={current}
            ontoData={ontoData}
            graphId={graphId}
            infoExtrData={infoExtrData}
            knowMapData={knowMapData}
            setKnowMapData={setKnowMapData}
            ref={step5Ref}
          />
        </div>
        <div className={`hide space center ${current === 5 && 'show'}`}>
          <Mix
            graphId={graphId}
            graphName={basicData.graph_Name}
            current={current}
            dataSourceData={dataSourceData}
            ontoData={ontoData}
            infoExtrData={infoExtrData}
            conflation={conflation}
            history={history}
            prev={prev}
            next={next}
            setConflation={setConflation}
            ref={step6Ref}
          />
        </div>
      </div>

      <Modal
        visible={quitVisible}
        onCancel={() => setQuitVisible(false)}
        wrapClassName="workflow-exit-modal"
        focusTriggerAfterClose={false}
        destroyOnClose={true}
        maskClosable={false}
        width="432px"
        footer={null}
      >
        <div className="workflow-modal-title">
          <ExclamationCircleFilled className="title-icon" />
          <span className="title-text">{intl.get('workflow.exitOperation')}</span>
        </div>
        <div className="workflow-modal-body">
          {current ? intl.get('workflow.exitText1') : intl.get('workflow.exitText')}
        </div>

        <div className="workflow-modal-footer">
          <Button className={`ant-btn-default cancel btn ${current && 'big'}`} onClick={handleCancel}>
            {current ? intl.get('workflow.noSave') : intl.get('workflow.cancel')}
          </Button>
          <Button type="primary" className={`ok btn ${current && 'big'}`} onClick={handleSave}>
            {current ? intl.get('workflow.saveClose') : intl.get('workflow.ok')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Workflow;
