import React, { useEffect, useState, useRef } from 'react';
import { message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { useHistory, useLocation } from 'react-router-dom';

import { knowModalFunc } from '@/components/TipModal';
import HELPER from '@/utils/helper';
import { getParam, sessionStore } from '@/utils/handleFunction';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

import LeftSpace from './LeftSpace';
import GraphContent from './GraphContent';
import ModalExport from './ModalExport';
import ModalFeedback from './ModalFeedback';
import ImportModal from './ImportModal';

const initTab = () => {
  const tab = getParam('tab');
  return ['detail', 'task', 'canvas'].includes(tab) ? tab : 'detail';
};
const KnowledgeGraph = (props: any) => {
  const history = useHistory();
  const location = useLocation();
  const { knData, onGraphBuildFinish } = props;
  const tabRef = useRef<any>(null);
  const [collapsed, setCollapsed] = useState(sessionStore.get('graphListCollapse') === '1');
  const [authKnowledgeData, setAuthKnowledgeData] = useState<any>(null);
  const [loading, setLoading] = useState<any>(false);
  const [isRefreshLeftList, setIsRefreshLeftList] = useState<any>(false);
  const [graphList, setGraphList] = useState<any>([]);
  const [selectedGraph, setSelectedGraph] = useState<any>('');

  const [isVisibleImport, setIsVisibleImport] = useState<any>(false); // 导入弹窗
  const [modalFeedbackData, setModalFeedbackData] = useState<any>({}); // 上传文件后的数据解析
  const [isVisibleExport, setIsVisibleExport] = useState<any>(false);
  const [fileData, setFileData] = useState<any>([]); // 上传的文件
  const [btnContent, setBtnContent] = useState(false); // 上传按钮文字显示
  const [fileReName, setFileReName] = useState(''); // 图谱名称
  const [step, setStep] = useState(0); // 0-导入 1-数据源映射
  const [tabsKey, setTabsKey] = useState(() => initTab());

  useEffect(() => {
    const page = parseInt(getParam('page')) || 1;
    getGraphList({ page });
  }, [isRefreshLeftList, JSON.stringify(knData)]);

  const onRefreshLeftSpace = () => {
    setSelectedGraph('');
    setIsRefreshLeftList(!isRefreshLeftList);
  };

  const getGraphList = async (
    { page = 1, size = 1000, order = 'desc', name = '', rule = 'create' },
    isSelectedFirst?: boolean
  ) => {
    if (!knData?.id) return;

    setLoading(true);
    const data = { knw_id: knData.id, page, size, order, name, rule };
    try {
      const result = (await servicesKnowledgeNetwork.graphGetByKnw(data)) || {};
      setLoading(false);

      const list = result?.res?.df || [];
      setGraphList(list);

      if (!result?.res) return;

      const selectedFirst = () => {
        setSelectedGraph(list?.[0] || '');
        if (_.isEmpty(list)) return;
        let search: any = getParam() || {};
        search.gid = list?.[0]?.id;
        search.gcid = list?.[0]?.id;
        search.tab = 'detail';
        search = HELPER.formatQueryString(search);
        if (getParam('from') === 'import') {
          const graph = list?.find((item: any) => item?.id === Number(getParam('gid'))) || list?.[0];
          setSelectedGraph(graph);
          const urlParams = new URLSearchParams(location.search);
          urlParams.delete('from');
          return history.replace({ pathname: location.pathname, search: urlParams.toString() });
        }

        history.replace({ pathname: location.pathname, search });
      };
      if (isSelectedFirst) {
        selectedFirst();
      } else {
        const search: any = getParam() || {};
        if (search?.gid) {
          // 流程六返回时携带的时 confId
          const isConfig = search.isConfig === 'true';
          const key = 'id';
          const graph = list?.find((item: any) => item?.[key] === Number(search.gid)) || list?.[0];
          setSelectedGraph(graph || list?.[0]);

          search.gid = graph.id;
          search.gcid = graph.id;
          if (isConfig) delete search.isConfig;
          const _search = HELPER.formatQueryString(search);

          if (getParam('from') === 'import') {
            const graph = list?.find((item: any) => item?.id === Number(getParam('gid'))) || list?.[0];
            setSelectedGraph(graph);
            const urlParams = new URLSearchParams(location.search);
            urlParams.delete('from');
            return history.replace({ pathname: location.pathname, search: urlParams.toString() });
          }
          history.replace({ pathname: location.pathname, search: _search });
        } else {
          selectedFirst();
        }
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const _setSelectedGraph = (data: any, a?: any) => {
    setSelectedGraph(data);
    let search: any = _.pick(getParam() || {}, 'id');
    search.gid = data?.id;
    search.gcid = data?.id;
    search.tab = 'detail';
    search = HELPER.formatQueryString(search);

    history.push({ pathname: location.pathname, search });
  };

  // 导入弹窗操作
  const openModalImport = () => setIsVisibleImport(true);

  /**
   * 关闭导入弹窗
   * @param isShow true-弹出数据源匹配 false-不弹出
   */
  const closeModal = (isShow = false, isEmptySource = false) => {
    // setIsVisibleImport(false);
    setBtnContent(false);
    if (isShow) {
      onOkModalImport(isEmptySource);

      return;
    }
    onHandleMatchModal();
  };

  /**
   * 关闭数据源匹配弹窗
   */
  const onHandleMatchModal = () => {
    setIsVisibleImport(false);
    setModalFeedbackData({});
    setFileData([]);
  };
  /**
   * 打开数据源匹配弹窗
   */
  const onOkModalImport = (isEmptySource = false) => {
    // 没有选择数据的情况
    if (isEmptySource) {
      const title = intl.get('knowledge.noOriginal');
      const content = intl.get('knowledge.notFound');
      setIsVisibleImport(false);
      knowModalFunc.open({
        title,
        content,
        onOk: () => {
          onImport();
        }
      });
      return;
    }
    onNext();
    // setIsVisibleSource(true);
  };

  /**
   * 导入
   */
  const onImport = () => {
    const graphIds = _.map(modalFeedbackData?.[0]?.ds_basic_infos, (item: any) => item?.id);
    const sourceMapping = _.reduce(
      graphIds,
      (pre: any, key: any) => {
        pre[key] = key;
        return pre;
      },
      {}
    );

    const data = { knw_id: knData?.id, file: fileData, ds_id_map: JSON.stringify(sourceMapping), rename: fileReName };
    servicesKnowledgeNetwork.graphInput(data).then(result => {
      if (result?.type === 'success') {
        message.success(intl.get('knowledge.importSuccess'));
        onTabSkip('detail');
        closeModalFeedback(true);
      }
      if (result?.type === 'fail') {
        message.error(result?.message);
      }
    });
  };

  /**
   * 任务列表跳转
   */
  const onTabSkip = (value: string) => {
    setTabsKey(value);
  };

  // 导出操作
  const openModalExport = () => setIsVisibleExport(true);
  const closeModalExport = () => setIsVisibleExport(false);

  /**
   * 关闭反馈弹窗
   */
  const closeModalFeedback = (isSelectedFirst?: boolean) => {
    setSelectedGraph('');
    setModalFeedbackData({});
    const page = parseInt(getParam('page')) || 1;
    getGraphList({ page }, isSelectedFirst);
  };

  // 导入详情（成功|失败）
  // const isVisibleModalFeedback = !_.isEmpty(modalFeedbackData);

  const onNext = () => {
    setStep(1);
  };

  const onPrev = () => {
    setStep(0);
  };

  return (
    <div className="kw-flex kw-h-100">
      <LeftSpace
        key={`${knData.id}-${isRefreshLeftList}`}
        graphList={graphList}
        selectedGraph={selectedGraph}
        setSelectedGraph={_setSelectedGraph}
        getGraphList={getGraphList}
        selectedKnowledge={knData}
        openModalImport={openModalImport}
        openModalExport={openModalExport}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <GraphContent
        key={selectedGraph?.id}
        selectedKnowledge={knData}
        selectedGraph={selectedGraph}
        setSelectedGraph={_setSelectedGraph}
        onRefreshLeftSpace={onRefreshLeftSpace}
        loading={loading}
        openAuthPage={() => setAuthKnowledgeData(selectedGraph)}
        openModalImport={openModalImport}
        tabsKey={tabsKey}
        setTabsKey={setTabsKey}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onGraphBuildFinish={onGraphBuildFinish}
      />
      <ImportModal
        visible={isVisibleImport}
        step={step}
        knowledge={knData}
        modalFeedbackData={modalFeedbackData}
        setModalFeedbackData={setModalFeedbackData}
        onClose={closeModal}
        fileData={fileData}
        setFileData={setFileData}
        btnContent={btnContent}
        setBtnContent={setBtnContent}
        setFileReName={setFileReName}
        fileReName={fileReName}
        onNext={onNext}
        onHandleClose={onHandleMatchModal}
        knData={knData}
        closeModalFeedback={closeModalFeedback}
        setIsVisibleImport={setIsVisibleImport}
        onPrev={onPrev}
        setStep={setStep}
        onTabSkip={onTabSkip}
      />
      <ModalExport isVisible={isVisibleExport} knowledge={knData} onClose={closeModalExport} />
    </div>
  );
};

export default KnowledgeGraph;
