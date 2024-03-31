import React, { useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Divider, message, Dropdown, Menu, Tooltip } from 'antd';

import { getCorrectColor } from '@/utils/handleFunction';
import servicesCreateEntity from '@/services/createEntity';
import IconFont from '@/components/IconFont';

// import ExportModal from './ExportModal';
import EdgesModal from './EdgesModal';
import EntityImportModal from './EntityImportModal';
import ModelImportModal from './ModelImportModal';
import { uniqNodeId, uniqEdgeId } from '../assistant';
import { asError, ErrorShow, handAsData } from './assistFunction';

import { GraphData } from '../types/data';
import { GraphPattern, OperationKey } from '../types/keys';
import './style.less';

export interface HeaderProps {
  current: number;
  disabled?: boolean; // 是否禁用
  osId: number; // 图数据库绑定的 openserch id
  dbType: string; // 图数据库类型
  graphId: number; // 图谱id
  graphData: GraphData; // 图数据
  graphPattern: GraphPattern; // 图模式
  ontology_id: number; // 本体id
  ontologyId: number; // 本体id
  operationKey: OperationKey;
  onChangePattern: (mode: GraphPattern) => void; // 更改图模式回调
  onAddEdgesBatch: (data: any[]) => void; // 批量建边回调
  headerAddData: (data: GraphData, from?: 'sql' | 'entity' | 'model' | string) => void; // 导入数据回调
  onChangeOperationKey: (key: OperationKey) => void; // 操作回调
  setIsLockGroupListener: (bool: boolean) => void; // 锁定画布监听
  onAfterBuildTask?: () => void; // 创建预测任务之后的回调
  validateSelectItem?: () => Promise<boolean>; // 校验编辑的点
}

const Header = (props: HeaderProps) => {
  const { current, disabled, osId, dbType, graphId, graphData, graphPattern, ontology_id, ontologyId, operationKey } =
    props;
  const { onAddEdgesBatch, headerAddData, onChangeOperationKey, setIsLockGroupListener, onAfterBuildTask } = props;
  const selfProps = useRef<HeaderProps>(props);
  selfProps.current = props;
  const [isVisibleExport, setIsVisibleExport] = useState(false); // 一键导入弹窗
  const [isVisibleEdges, setIsVisibleEdges] = useState(false); // 批量建边弹窗
  const [entityImportVisible, setEntityImportVisible] = useState(false); // 批量导入实体弹窗
  // 快捷键对应的函数
  const shortcutFuncMap: Record<string, Function> = {
    // 创建关系类
    E: () => clickWrap(onAddNode)(),
    // 批量创建关系类
    shift_E: () => clickWrap(openEntityImportModal)(),
    // 创建关系类
    R: () => clickWrap(onAddEdge)(),
    // 批量创建关系类
    shift_R: () => clickWrap(openEdgesModal)(),
    // 一键导入
    shift_I: () => clickWrap(openExportModal)()
  };

  useEffect(() => {
    setIsLockGroupListener(isVisibleExport || isVisibleEdges || entityImportVisible);
  }, [isVisibleExport, isVisibleEdges, entityImportVisible]);

  useEffect(() => {
    current === 2 && window.addEventListener('keydown', shortcutListener);
    return () => window.removeEventListener('keydown', shortcutListener);
  }, [current, disabled]);

  /**
   * 快捷键事件监听
   * @param e
   */
  const shortcutListener = (e: KeyboardEvent) => {
    const { shiftKey, key, target } = e;
    // 忽略input等元素触发的的键盘事件
    if ((target as HTMLElement)?.tagName !== 'BODY') return;
    const upKey = key.toUpperCase();
    const curKey = shiftKey ? `shift_${upKey}` : upKey;
    shortcutFuncMap[curKey] && shortcutFuncMap[curKey]();
  };

  /**
   * 点击时判断是否禁用
   */
  const clickWrap =
    (func: Function) =>
    (...arg: any) =>
      !disabled && func?.(...arg);

  /**
   * 创建实体
   */
  const onAddNode = async () => {
    const isErr = await selfProps.current.validateSelectItem?.();
    if (isErr) return;
    selfProps.current.headerAddData({ nodes: [{ name: '', color: getCorrectColor('') }], edges: [] });
    graphPattern !== 'default' && selfProps.current.onChangePattern('default');
  };

  /**
   * 创建边
   */
  const onAddEdge = async () => {
    const isErr = await selfProps.current.validateSelectItem?.();
    if (isErr) return;
    selfProps.current.onChangePattern('addEdge');
  };

  const openEdgesModal = () => setIsVisibleEdges(true);
  const closeEdgesModal = () => setIsVisibleEdges(false);
  const openEntityImportModal = () => setEntityImportVisible(true);
  const openExportModal = () => setIsVisibleExport(true);
  const closeModal = () => {
    setIsVisibleExport(false);
    setEntityImportVisible(false);
  };

  /**
   * 确认导入实体
   */
  const onOkExportModal = async (data: any) => {
    if (data.type === 'entity' || data.type === 'model') {
      const { edge, entity } = data?.data;
      const nodes = _.map(entity, item => ({ ...item, uid: uniqNodeId() }));
      const nodesKV = _.keyBy(nodes, 'name');

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
      headerAddData({ nodes, edges }, data.type);
      closeModal();
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
          closeModal();
          operationKey === 'taskList' ? onAfterBuildTask?.() : onChangeOperationKey('taskList');
        }
      } else {
        // return message.error(intl.get('createEntity.noSelectData'));
        return message.error({
          content: intl.get('createEntity.noSelectData'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
      }
    }

    if (data.type === 'king') {
      if (data?.data?.length > 0) {
        const postData = {
          ds_id: data?.selectedValue?.id,
          file_list: data?.data,
          ontology_id: ontology_id || ontologyId,
          postfix: ''
        };
        const resStandData = await servicesCreateEntity.buildTask(postData);
        if (resStandData?.res) {
          closeModal();
          operationKey === 'taskList' ? onAfterBuildTask?.() : onChangeOperationKey('taskList');
        }
      } else {
        // return message.error(intl.get('createEntity.noSelectData'));
        return message.error({
          content: intl.get('createEntity.noSelectData'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
      }
    }

    if (data.type === 'as') {
      if (data.data && data.data.length > 0) {
        // as数据处理(标注抽取)
        // if (data.selectedValue.extract_type === 'labelExtraction') {
        //   const requestData = {
        //     data_source: data.selectedValue.data_source,
        //     ds_id: data.selectedValue.id.toString(),
        //     extract_type: 'labelExtraction',
        //     file_list: [{ docid: data.data[0][0].docid, type: data.data[0][0].type, name: data.data[0][0].name }],
        //     postfix: data.selectedValue.postfix
        //   };
        //   const resData = await servicesCreateEntity.submitExtractTask(requestData);
        //   asError(resData);
        //   if (resData && resData.res && resData.res.entity_list.length) {
        //     const asData = handAsData(resData.res, data.selectedValue);
        //     const nodes = _.map(asData.nodes, item => ({ ...item, uid: uniqNodeId() }));
        //     const nodesKV = _.keyBy(nodes, 'name');

        //     const edges = _.map(asData.edges, item => {
        //       const { name, colour, relations } = item;
        //       const startName = relations?.[0];
        //       const endName = relations?.[2];
        //       const startId = nodesKV?.[startName]?.uid;
        //       const endId = nodesKV?.[endName]?.uid;
        //       return {
        //         ...item,
        //         ...(item.data || {}),
        //         uid: uniqEdgeId(),
        //         name,
        //         startId,
        //         endId,
        //         source: startId,
        //         target: endId,
        //         startName,
        //         endName,
        //         color: colour
        //       };
        //     });
        //     headerAddData({ nodes, edges }, data.type);
        //     closeModal();
        //   }
        // }

        // as数据处理(标准抽取/标注抽取)
        if (
          data.selectedValue.extract_type === 'standardExtraction' ||
          data.selectedValue.extract_type === 'labelExtraction'
        ) {
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
            closeModal();
            operationKey === 'taskList' ? onAfterBuildTask?.() : onChangeOperationKey('taskList');
          }
        }
      } else {
        // message.error(intl.get('createEntity.noSelectData'));
        message.error({
          content: intl.get('createEntity.noSelectData'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
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
        closeModal();
        operationKey === 'taskList' ? onAfterBuildTask?.() : onChangeOperationKey('taskList');
      }
    }
  };

  return (
    <div className={classnames('graphG6HeaderRoot', { disabled })}>
      <div className="data-op-box">
        <div className="kw-align-center kw-h-100">
          {/* 创建点类 */}
          <Tooltip
            placement="bottom"
            title={
              <div className="kw-space-between">
                <span>{intl.get('createEntity.createEntityC')}</span>
                <span className="kw-ml-6">E</span>
              </div>
            }
          >
            <div className="operation" onClick={clickWrap(onAddNode)}>
              <IconFont type="icon-shitilei" />
            </div>
          </Tooltip>
          {/* 批量导入点类 */}
          <Tooltip
            placement="bottom"
            title={
              <div className="kw-space-between">
                <span>{intl.get('createEntity.importNodeBatch')}</span>
                <span className="kw-ml-6">shift + E</span>
              </div>
            }
          >
            <div className="operation" onClick={clickWrap(openEntityImportModal)}>
              <IconFont type="icon-piliangshiti" />
            </div>
          </Tooltip>
          <Divider type="vertical" />
          {/* 创建边类 */}
          <Tooltip
            placement="bottom"
            title={
              <div className="kw-space-between">
                <span>{intl.get('createEntity.createR')}</span>
                <span className="kw-ml-6">R</span>
              </div>
            }
          >
            <div
              className={classnames('operation', { operationSelected: graphPattern === 'addEdge' })}
              onClick={clickWrap(onAddEdge)}
            >
              <IconFont type="icon-relationship-class" />
            </div>
          </Tooltip>
          {/* 批量创建边类 */}
          <Tooltip
            placement="bottom"
            title={
              <div className="kw-space-between">
                <span>{intl.get('createEntity.aR')}</span>
                <span className="kw-ml-6">shift + R</span>
              </div>
            }
          >
            <div className="operation" onClick={clickWrap(openEdgesModal)}>
              <IconFont type="icon-piliangguanxi" />
            </div>
          </Tooltip>
          <Divider type="vertical" />
          <Tooltip
            placement="bottom"
            title={
              <div className="kw-space-between">
                <span>{intl.get('createEntity.clickI')}</span>
                {/* 把罗马数字 Ⅰ 假装为大写字母 I , 在网页上更容易分辨 */}
                <span className="kw-ml-6 kw-c-white">shift +Ⅰ</span>
              </div>
            }
          >
            <div className="operation" onClick={clickWrap(openExportModal)}>
              <IconFont type="icon-daoru" />
            </div>
          </Tooltip>
        </div>
      </div>

      <div className="info-box">
        <div className="kw-align-center kw-h-100">
          <Tooltip placement="bottom" title={intl.get('createEntity.taskList')}>
            <div className="operation" onClick={() => clickWrap(onChangeOperationKey)('taskList')}>
              <IconFont type="icon-tasklist" />
            </div>
          </Tooltip>
          <Divider type="vertical" />
          <Tooltip placement="bottom" title={intl.get('createEntity.summary')}>
            <div className="operation" onClick={() => clickWrap(onChangeOperationKey)('summaryInfo')}>
              <IconFont type="icon-iconzhengli_dangan" />
            </div>
          </Tooltip>
        </div>
      </div>

      {/* 批量添加关系类 */}
      <EdgesModal
        key={`edge${String(isVisibleEdges)}`}
        isVisibleEdges={isVisibleEdges}
        nodes={graphData?.nodes}
        edges={graphData?.edges}
        closeEdgesModal={closeEdgesModal}
        onAddEdgesBatch={onAddEdgesBatch}
      />

      {/* 批量导入实体弹窗 */}
      <EntityImportModal
        key={`entity${String(entityImportVisible)}`}
        visible={entityImportVisible}
        graphId={graphId}
        onOk={onOkExportModal}
        onCancel={closeModal}
      />

      {/* 一键导入弹窗 */}
      <ModelImportModal
        key={`model${String(isVisibleExport)}`}
        osId={osId}
        dbType={dbType}
        visible={isVisibleExport}
        onOk={onOkExportModal}
        onCancel={closeModal}
      />
    </div>
  );
};

export default Header;
