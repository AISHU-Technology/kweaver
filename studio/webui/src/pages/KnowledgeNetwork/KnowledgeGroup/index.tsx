import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { useHistory } from 'react-router-dom';

import { getParam } from '@/utils/handleFunction';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

import LeftSpace from './LeftSpace';
import NetworkContent from './NetworkContent';
import ModalExport from './ModalExport';
import ModalImport from './ModalImport';
import ModalFeedback from './ModalFeedback';

const KnowledgeGroup = (props: any) => {
  const history = useHistory();
  const { kgData } = props;

  const [loading, setLoading] = useState<any>(false);
  const [isRefreshLeftList, setIsRefreshLeftList] = useState<any>(false);
  const [graphList, setGraphList] = useState<any>([]);
  const [graphListCount, setGraphListCount] = useState<any>(0);
  const [selectedGraph, setSelectedGraph] = useState<any>('');

  const [isVisibleImport, setIsVisibleImport] = useState<any>(false);
  const [modalFeedbackData, setModalFeedbackData] = useState<any>({});
  const [isVisibleExport, setIsVisibleExport] = useState<any>(false);

  useEffect(() => {
    const page = parseInt(getParam('page')) || 1;
    getGraphList({ page });
  }, [isRefreshLeftList, JSON.stringify(kgData)]);

  const onRefreshLeftSpace = () => {
    setSelectedGraph('');
    setIsRefreshLeftList(!isRefreshLeftList);
  };

  const getGraphList = async ({ page = 1, size = 20, order = 'desc', name = '', rule = 'update' }) => {
    if (!kgData?.id) return;

    setLoading(true);
    const data = { knw_id: kgData.id, page, size, order, name, rule };
    try {
      const res = await servicesKnowledgeNetwork.graphGetByKnw(data);
      setLoading(false);

      if (!res?.res) return;
      setGraphList(res.res.df);
      setGraphListCount(res.res.count);

      if (selectedGraph) {
        const graph = graphList.find((item: any) => item.kgconfid === selectedGraph?.kgconfid);
        graph && _setSelectedGraph(graph[0]);
        return;
      }

      if (window.location.search.split('&').length > 1) {
        return initFromOtherRouter(res.res.df);
      }
      setSelectedGraph(res.res.df[0] || '');
    } catch (error) {
      setLoading(false);
    }
  };

  /**
   * 从其他页面跳转进入并选中图谱
   */
  const initFromOtherRouter = (graphs: any[]) => {
    const { gid, cid } = getParam(['gid', 'cid']);
    if (!gid && !cid) return;

    const graphId = parseInt(gid || cid) || 0;
    const item = graphs.find((item: any) => item[gid ? 'id' : 'kgconfid'] === graphId);
    item && _setSelectedGraph(item);
  };

  const _setSelectedGraph = (data: any) => {
    const { pathname, search } = window.location;
    setSelectedGraph(data);
    if (search.split('&').length > 1) history.push(`${pathname}?id=${kgData?.id}`);
  };

  const openModalImport = () => setIsVisibleImport(true);
  const closeModalImport = () => setIsVisibleImport(false);
  const onOkModalImport = (data: any) => {
    setIsVisibleImport(false);
    setModalFeedbackData(data);
  };

  const openModalExport = () => setIsVisibleExport(true);
  const closeModalExport = () => setIsVisibleExport(false);

  /**
   * 关闭反馈弹窗
   */
  const closeModalFeedback = () => {
    setSelectedGraph('');
    setModalFeedbackData({});
    setIsRefreshLeftList(!isRefreshLeftList);
  };

  const isVisibleModalFeedback = !_.isEmpty(modalFeedbackData);

  return (
    <React.Fragment>
      <LeftSpace
        key={`${kgData.id}-${isRefreshLeftList}`}
        graphList={graphList}
        graphListCount={graphListCount}
        selectedGraph={selectedGraph}
        setSelectedGraph={_setSelectedGraph}
        getGraphList={getGraphList}
        selectedKnowledge={kgData}
        openModalImport={openModalImport}
        openModalExport={openModalExport}
      />
      <NetworkContent
        key={selectedGraph?.id}
        selectedKnowledge={kgData}
        graphListCount={graphListCount}
        selectedGraph={selectedGraph}
        setSelectedGraph={_setSelectedGraph}
        onRefreshLeftSpace={onRefreshLeftSpace}
        loading={loading}
        openModalImport={openModalImport}
      />
      <ModalImport
        isVisible={isVisibleImport}
        knowledge={kgData}
        isVisibleModalFeedback={isVisibleModalFeedback}
        onOk={onOkModalImport}
        onClose={closeModalImport}
        closeModalFeedback={closeModalFeedback}
      />
      <ModalExport isVisible={isVisibleExport} knowledge={kgData} onClose={closeModalExport} />
      <ModalFeedback isVisible={isVisibleModalFeedback} data={modalFeedbackData} onCancel={closeModalFeedback} />
    </React.Fragment>
  );
};

export default KnowledgeGroup;
