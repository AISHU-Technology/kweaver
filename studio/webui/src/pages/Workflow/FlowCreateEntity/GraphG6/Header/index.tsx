import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Divider, message } from 'antd';

import { getCorrectColor } from '@/utils/handleFunction';
import servicesCreateEntity from '@/services/createEntity';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';

import ExportModal from './ExportModal';
import EdgesModal from './EdgesModal';
import { uniqNodeId, uniqEdgeId } from '../assistant';
import { asError, ErrorShow, handAsData } from './assistFunction';

import { GraphData } from '../types/data';
import { GraphPattern, OperationKey } from '../types/keys';
import dianIcon from '@/assets/images/dian.svg';
import edgeIcon from '@/assets/images/edge.svg';
import daoruIcon from '@/assets/images/daoru.svg';
import guanxileiIcon from '@/assets/images/guanxilei.svg';
import './style.less';

export interface HeaderProps {
  disabled?: boolean; // 是否禁用
  osId: number; // 图数据库绑定的 openserch id
  dbType: string; // 图数据库类型
  graphId: number; // 图谱id
  graphData: GraphData; // 图数据
  graphName: string; // 图谱名称
  graphPattern: GraphPattern; // 图模式
  ontology_id: number; // 本体id
  ontologyId: number; // 本体id
  operationKey: OperationKey;
  onChangePattern: (mode: GraphPattern) => void; // 更改图模式回调
  onAddEdgesBatch: (data: any[]) => void; // 批量建边回调
  headerAddData: (data: { type: string; items: any[] }, from?: 'sql' | 'entity' | 'model' | string) => void; // 导入数据回调
  onChangeOperationKey: (key: OperationKey) => void; // 操作回调
  setIsLockGroupListener: (bool: boolean) => void; // 锁定画布监听
  onAfterBuildTask?: () => void; // 创建预测任务之后的回调
  validateSelectItem?: () => Promise<boolean>; // 校验编辑的点
}

const Header = (props: HeaderProps) => {
  const { disabled, osId, dbType, graphId, graphData, graphName, graphPattern, ontology_id, ontologyId, operationKey } =
    props;
  const {
    onChangePattern,
    onAddEdgesBatch,
    headerAddData,
    onChangeOperationKey,
    setIsLockGroupListener,
    onAfterBuildTask,
    validateSelectItem
  } = props;
  const [isVisibleExport, setIsVisibleExport] = useState(false);
  const [isVisibleEdges, setIsVisibleEdges] = useState(false);

  useEffect(() => {
    setIsLockGroupListener(isVisibleExport || isVisibleEdges);
  }, [isVisibleExport, isVisibleEdges]);

  const clickWrap =
    (func: Function) =>
    (...arg: any) =>
      !disabled && func?.(...arg);

  const onAddNode = async () => {
    const isErr = await validateSelectItem?.();
    if (isErr) return;
    headerAddData({ type: 'node', items: [{ name: '', color: getCorrectColor('') }] });
    graphPattern !== 'default' && onChangePattern('default');
  };

  const onAddEdge = async () => {
    const isErr = await validateSelectItem?.();
    if (isErr) return;
    onChangePattern('addEdge');
  };

  const openExportModal = () => setIsVisibleExport(true);
  const closeExportModal = () => setIsVisibleExport(false);
  const onOkExportModal = async (data: any) => {
    if (data.type === 'entity' || data.type === 'model') {
      const { edge, entity } = data?.data;
      const nodes = _.map(entity, item => ({ ...item, uid: uniqNodeId() }));
      const nodesKV = _.keyBy(nodes, 'name');
      Promise.resolve().then(() => {
        headerAddData({ type: 'node', items: nodes }, data.type);
      });

      Promise.resolve().then(() => {
        const edges = _.map(edge, item => {
          const { name, colour, relations } = item;
          const startName = relations?.[0];
          const endName = relations?.[2];
          const startId = nodesKV?.[startName]?.uid;
          const endId = nodesKV?.[endName]?.uid;
          return {
            ...item,
            ...(item.data || {}),
            uid: uniqEdgeId(),
            name,
            startId,
            endId,
            source: startId,
            target: endId,
            startName,
            endName,
            color: colour
          };
        });
        headerAddData({ type: 'edge', items: edges }, data.type);
      });
      closeExportModal();
    }
    if (data.type === 'sql') {
      if (data?.data?.length > 0) {
        const postData = {
          ds_id: data?.selectedValue?.id,
          file_list: data?.data,
          ontology_id: ontology_id || ontologyId,
          postfix: ''
        };
        const resStandData = await servicesCreateEntity.buildTask(postData);
        if (resStandData?.res) {
          closeExportModal();
          operationKey === 'taskList' ? onAfterBuildTask?.() : onChangeOperationKey('taskList');
        }
      } else {
        return message.error(intl.get('createEntity.noSelectData'));
      }
    }

    if (data.type === 'as') {
      if (data.data && data.data.length > 0) {
        // as数据处理(标注抽取)
        if (data.selectedValue.extract_type === 'labelExtraction') {
          const requestData = {
            data_source: data.selectedValue.data_source,
            ds_id: data.selectedValue.id.toString(),
            extract_type: 'labelExtraction',
            file_list: [{ docid: data.data[0][0].docid, type: data.data[0][0].type, name: data.data[0][0].name }],
            postfix: data.selectedValue.postfix
          };
          const resData = await servicesCreateEntity.getFileGraphData(requestData);
          asError(resData);
          if (resData && resData.res && resData.res.entity_list.length) {
            const asData = handAsData(resData.res, data.selectedValue);
            const nodes = _.map(asData.nodes, item => ({ ...item, uid: uniqNodeId() }));
            const nodesKV = _.keyBy(nodes, 'name');
            Promise.resolve().then(() => {
              headerAddData({ type: 'node', items: nodes }, data.type);
            });
            Promise.resolve().then(() => {
              const edges = _.map(asData.edges, item => {
                const { name, colour, relations } = item;
                const startName = relations?.[0];
                const endName = relations?.[2];
                const startId = nodesKV?.[startName]?.uid;
                const endId = nodesKV?.[endName]?.uid;
                return {
                  ...item,
                  ...(item.data || {}),
                  uid: uniqEdgeId(),
                  name,
                  startId,
                  endId,
                  source: startId,
                  target: endId,
                  startName,
                  endName,
                  color: colour
                };
              });
              headerAddData({ type: 'edge', items: edges }, data.type);
            });
            closeExportModal();
          }
        }

        // as数据处理(标准抽取)
        if (data.selectedValue.extract_type === 'standardExtraction') {
          const file_list = data.data.map((item: any) => {
            return item[0];
          });

          const requestData = {
            ds_id: data.selectedValue.id,
            file_list,
            ontology_id: ontology_id || ontologyId,
            postfix: data.selectedValue.postfix
          };

          const resStandData = await servicesCreateEntity.buildTask(requestData);
          ErrorShow(resStandData);
          if (resStandData && resStandData.res) {
            closeExportModal();
            operationKey === 'taskList' ? onAfterBuildTask?.() : onChangeOperationKey('taskList');
          }
        }
      } else {
        message.error(intl.get('createEntity.noSelectData'));
        return;
      }
    }

    if (data.type === 'rabbitmq') {
      // 数据表预测添加任务处理
      const requestData = {
        ds_id: data.data.id,
        file_list: [data.data.queue],
        ontology_id: ontology_id || ontologyId,
        postfix: ''
      };
      const resStandData = await servicesCreateEntity.buildTask(requestData);
      ErrorShow(resStandData);

      if (resStandData && resStandData.res) {
        closeExportModal();
        operationKey === 'taskList' ? onAfterBuildTask?.() : onChangeOperationKey('taskList');
      }
    }
  };

  const openEdgesModal = () => setIsVisibleEdges(true);
  const closeEdgesModal = () => setIsVisibleEdges(false);

  return (
    <div className={classnames('graphG6HeaderRoot', { disabled })}>
      <div className="ad-ellipsis" style={{ width: 130 }} title={graphName}>
        {graphName}
      </div>
      <div className="ad-center ad-h-100">
        {/* 添加点 */}
        <div className="operation" onClick={clickWrap(onAddNode)}>
          <img className="operationImg" src={dianIcon} alt="ad" />
          <Format.Text level={1}>{intl.get('createEntity.createEntityC')}</Format.Text>
        </div>
        {/* 添加边 */}
        <div
          className={classnames('operation', { operationSelected: graphPattern === 'addEdge' })}
          onClick={clickWrap(onAddEdge)}
        >
          <img className="operationImg" src={edgeIcon} alt="ad" />
          <Format.Text level={1}>{intl.get('createEntity.createR')}</Format.Text>
        </div>
        <Divider type="vertical" style={{ height: 42, color: '#f0f0f0' }} />
        {/* 一键导入 */}
        <div className="operation" onClick={clickWrap(openExportModal)}>
          <img className="operationImg" src={daoruIcon} alt="ad" />
          <Format.Text level={1}>{intl.get('createEntity.clickI')}</Format.Text>
        </div>
        {/* 批量关系类 */}
        <div className="operation" onClick={clickWrap(openEdgesModal)}>
          <img className="operationImg" src={guanxileiIcon} alt="ad" />
          <Format.Text level={1}>{intl.get('createEntity.bulikR')}</Format.Text>
        </div>
      </div>

      <div className="ad-center ad-h-100">
        {/* 任务列表 */}
        <div className="operation" onClick={() => clickWrap(onChangeOperationKey)('taskList')}>
          <IconFont type="icon-renwuliebiao" style={{ fontSize: 18 }} />
          <Format.Text level={1}>{intl.get('createEntity.taskList')}</Format.Text>
        </div>

        <Divider type="vertical" style={{ height: 42, color: '#f0f0f0' }} />
        {/* 汇总信息 */}
        <div className="operation" onClick={() => clickWrap(onChangeOperationKey)('summaryInfo')}>
          <IconFont type="icon-huizongxinxi" style={{ fontSize: 18 }} />
          <Format.Text level={1}>{intl.get('createEntity.summary')}</Format.Text>
        </div>
      </div>

      {/* 一键导入弹层 */}
      <ExportModal
        osId={osId}
        dbType={dbType}
        graphId={graphId}
        isVisible={isVisibleExport}
        onOk={onOkExportModal}
        onClose={closeExportModal}
      />

      {/* 批量添加关系类 */}
      <EdgesModal
        key={String(isVisibleEdges)}
        isVisibleEdges={isVisibleEdges}
        nodes={graphData?.nodes}
        edges={graphData?.edges}
        closeEdgesModal={closeEdgesModal}
        onAddEdgesBatch={onAddEdgesBatch}
      />
    </div>
  );
};

export default Header;
