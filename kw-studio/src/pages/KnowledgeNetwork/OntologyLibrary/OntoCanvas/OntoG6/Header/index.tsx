/* eslint-disable max-lines */
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Divider, message, Dropdown, Menu, Tooltip, Popover } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { OntoCanvasG6Ref } from '../OntoCanvasG6';
import ModelSetting from './ModelSetting';

import IconFont from '@/components/IconFont';
import { getCorrectColor } from '@/utils/handleFunction';
import servicesCreateEntity from '@/services/createEntity';

import OntoEdgesModal from './EdgeModal';
import OntoEntityImportModal from './EntityImportModal';
import OntoModelImportModal from './ModelImportModal';
import { uniqNodeId, uniqEdgeId, initGraphByEdit } from '../assistant';
import { ErrorShow } from './assistFunction';
import { constructGraphData } from '@/components/SourceImportComponent';
import { ItemUpdate } from '../types/update';

import './style.less';
import { DS_SOURCE } from '@/enums';
import { useLocation } from 'react-router-dom';
import HELPER from '@/utils/helper';
import ContainerIsVisible from '@/components/ContainerIsVisible';

// 图模式
export type GraphPattern = 'default' | 'addEdge' | 'brushSelect';

// 右侧面板key
export type OperationKey = 'summaryInfo' | 'taskList' | 'saveToOnto' | '';

// 图数据
export type GraphData = {
  nodes: Record<string, any>[];
  edges: Record<string, any>[];
};

// 本体信息
export type InitOntoData = {
  ontology_id: number;
  used_task: any[];
  ontology_name: string;
  ontology_des: string;
};

// 单个分组数据
export type GraphGroupItem = {
  id: number;
  name: string;
  isUngrouped?: boolean;
  entity_num: number;
  edge_num: number;
  entity: Record<string, any>[];
  edge: Record<string, any>[];
};

// 框选数据
export type BrushData = GraphData & {
  targetGroup?: GraphGroupItem; // 目标分组
  highlight?: string[]; // 指定高亮, 不指定则默认全部高亮
  notRedraw?: boolean; // 仅更新数据, 不触发画布绘制
};

export interface OntoHeaderRef {
  onChangeZoom: Function;
  centerCanvasView: Function;
  position: Function;
}

export interface HeaderProps {
  knData: Record<string, any>;
  current: number;
  disabled?: boolean; // 是否禁用
  osId: number; // 图数据库绑定的 openserch id
  dbType: string; // 图数据库类型
  graphId: number; // 图谱id
  graphData: GraphData; // 图数据
  graphPattern: GraphPattern; // 图模式
  ontology_id: number; // 本体id - 导入数据
  ontologyId: number; // 本体id - 流程传入
  draftOntoId: number; // 本体id - 新建本体库
  operationKey: OperationKey;
  ontoLibType: string;
  onChangePattern: (mode: GraphPattern) => void; // 更改图模式回调
  onAddEdgesBatch: (data: any[]) => void; // 批量建边回调
  detailUpdateData: (data: ItemUpdate) => void; // 批量建边更改画布内的复用边
  headerAddData: (data: GraphData, from?: 'sql' | 'entity' | 'model' | string) => void; // 导入数据回调
  onChangeOperationKey: (key: OperationKey) => void; // 操作回调
  setIsLockGroupListener: (bool: boolean) => void; // 锁定画布监听
  onAfterBuildTask?: () => void; // 创建预测任务之后的回调
  validateSelectItem?: () => Promise<boolean>; // 校验编辑的点
  onAddDataFile: any; // 选中数据的回调
  setParsingFileSet: (data: any) => void;
  defaultParsingRule: any;
  setDefaultParsingRule: (data: any) => void;
  sourceFileType: any;
  setSourceFileType: (data: any) => void;
  parsingTreeChange: any;
  setParsingTreeChange: (data: any) => void;
  setShowRightMenu: Function; // 是否显示侧边栏
  canvasRef: React.RefObject<OntoCanvasG6Ref>;
  canvasConfigChanged: Function;
  canvasConfig: Record<string, any>;
  arFileSave: Record<any, any>;
  setArFileSave: (data: any) => void;
  checkVectorServiceStatus?: () => any;
}

const Header: React.ForwardRefRenderFunction<OntoHeaderRef, HeaderProps> = (props, ref) => {
  // const Header = (props: HeaderProps) => {
  const {
    current,
    disabled,
    osId,
    dbType,
    graphId,
    graphData,
    graphPattern,
    ontology_id,
    ontologyId,
    operationKey,
    knData,
    draftOntoId,
    ontoLibType,
    onAddDataFile,
    setParsingFileSet,
    defaultParsingRule,
    setDefaultParsingRule,
    sourceFileType,
    setSourceFileType,
    parsingTreeChange,
    setParsingTreeChange,
    setShowRightMenu,
    canvasRef,
    canvasConfigChanged,
    canvasConfig,
    arFileSave,
    setArFileSave,
    checkVectorServiceStatus
  } = props;
  const {
    onAddEdgesBatch,
    detailUpdateData,
    headerAddData,
    onChangeOperationKey,
    setIsLockGroupListener,
    onAfterBuildTask
  } = props;
  useImperativeHandle(ref, () => ({
    onChangeZoom,
    centerCanvasView,
    position
  }));
  const selfProps = useRef<HeaderProps>(props);
  selfProps.current = props;
  const closeParsingRef = useRef<any>(null);
  const [isVisibleExport, setIsVisibleExport] = useState(false); // 一键导入弹窗
  const [isVisibleEdges, setIsVisibleEdges] = useState(false); // 批量建边弹窗
  const [entityImportVisible, setEntityImportVisible] = useState(false); // 批量导入实体弹窗
  const [zoomNum, setZoomNum] = useState(1);
  const location = useLocation<any>();
  const viewMode = location.state?.mode === 'view'; // 是否处于查看模式
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
    current === 2 && !viewMode && window.addEventListener('keydown', shortcutListener);
    current === 2 && !viewMode && window.addEventListener('wheel', getCanvasZoom);
    return () => {
      window.removeEventListener('keydown', shortcutListener);
      window.removeEventListener('wheel', getCanvasZoom);
    };
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

  const getCanvasZoom = () => {
    const cavasZoom = canvasRef.current?.graph?.getZoom();
    setZoomNum(cavasZoom!);
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
    // if (isErr) return; Bug-422842 即使有错误信息也能切换面板
    setShowRightMenu(true);
    selfProps.current.headerAddData({ nodes: [{ isCreate: true, name: '', color: getCorrectColor('') }], edges: [] });
    graphPattern !== 'default' && selfProps.current.onChangePattern('default');
    // 延时操作确保实体类已经创建成功并选中，来确保position的正确性
    setTimeout(() => {
      onChangeZoom('100');
      position();
      canvasRef.current!.isCopyBehaviorNew.current = true;
    }, 500);
  };

  /**
   * 创建边
   */
  const onAddEdge = async () => {
    const isErr = await selfProps.current.validateSelectItem?.();
    // if (isErr) return; Bug-422842 即使有错误信息也能切换面板
    selfProps.current.onChangePattern('addEdge');
  };

  const openEdgesModal = () => setIsVisibleEdges(true);
  const closeEdgesModal = () => setIsVisibleEdges(false);
  const openEntityImportModal = () => setEntityImportVisible(true);
  const openExportModal = () => setIsVisibleExport(true);
  const closeModal = () => {
    setIsVisibleExport(false);
    setEntityImportVisible(false);
    setParsingTreeChange([]);
    setArFileSave([]);
    closeParsingRef?.current?.onDefaultRequestId();
  };

  /**
   * 确认导入实体
   */
  const onOkExportModal = async (data: any, type?: any) => {
    if (data.type === 'entity' || data.type === 'model') {
      const processedData = initGraphByEdit(data?.data);
      headerAddData(processedData, data.type);
      closeModal();
      return;
    }
    const dataFile = generateFlow4MapDataFile(data, type);
    onAddDataFile(dataFile); // 将选中的数据文件回调出去
    if (data.type === 'sql') {
      if (data?.data?.length > 0) {
        const postData = {
          ds_id: data?.selectedValue?.id,
          file_list: data?.data,
          ontology_id: draftOntoId || ontology_id || ontologyId,
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

    if (['king', 'AnyRobot'].includes(data.type)) {
      if (data?.data?.length > 0) {
        const postData = {
          ds_id: data?.selectedValue?.id,
          file_list: data?.data,
          ontology_id: draftOntoId || ontology_id || ontologyId,
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
            ontology_id: draftOntoId || ontology_id || ontologyId,
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
        ontology_id: draftOntoId || ontology_id || ontologyId,
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

  /**
   * 根据导入的数据文件生成流程四需要的数据文件格式
   */
  const generateFlow4MapDataFile = (data: any, type?: any) => {
    const files = data.data; // 选中的数据文件
    const ds = data.selectedValue; // 选中的数据源
    const dataFileBaseProps: any = {
      ds_id: ds.id,
      data_source: ds.data_source,
      ds_path: ds.ds_path,
      extract_type: ds.extract_type,
      extract_rules: [], // 抽取规则由异步任务预测结果而生成（接口是gettaskinfo）
      x: 0,
      y: 0
    };
    if (DS_SOURCE.hive === ds.data_source) {
      dataFileBaseProps.partition_usage = false;
      dataFileBaseProps.partition_infos = {};
    }
    let dataFile: any = [];
    // mysql  hive 数据源走这里
    if (data.type === 'sql' || data.type === 'king') {
      dataFile = files.map((file: any) => ({
        ...dataFileBaseProps,
        files: [
          {
            file_name: file,
            file_path: ds.ds_path,
            file_source: file
          }
        ]
      }));
    }
    if (data.type === 'AnyRobot') {
      dataFile = files.map((file: any) => ({
        ...dataFileBaseProps,
        files: [
          {
            file_name: file?.name,
            file_path: '',
            file_source: file?.id,
            start_time: Number(file?.start_time),
            end_time: Number(file?.end_time)
          }
        ]
      }));
    }
    if (data.type === 'as') {
      if (type === 'csv') {
        dataFile = files.map((file: any) => ({
          ...dataFileBaseProps,
          files: [
            {
              file_name: file[0].name,
              file_path: ds.ds_path,
              file_source: file[0].docid,
              delimiter: file[0].delimiter,
              quotechar: file[0].quotechar,
              escapechar: file[0].escapechar
            }
          ]
        }));
      } else {
        dataFile = files.map((file: any) => ({
          ...dataFileBaseProps,
          files: [
            {
              file_name: file[0].name,
              file_path: ds.ds_path,
              file_source: file[0].docid
            }
          ]
        }));
      }
    }
    if (data.type === 'rabbitmq') {
      dataFile = [
        {
          ...dataFileBaseProps,
          files: [
            {
              file_name: ds.queue, // 队列名称
              file_path: ds.ds_path,
              file_source: ds.queue // 队列名称
            }
          ]
        }
      ];
    }
    return dataFile;
  };

  const onChangeZoom = (type: string) => {
    if (type === '100') {
      setZoomNum(1);
      canvasRef.current?.graph?.zoomTo(1);
      canvasRef.current?.graph?.fitCenter();
    }
    if (type === '-') {
      if (zoomNum === 0.05) return;
      const toRatio = Math.max(zoomNum - 0.05, 0.05);
      setZoomNum(toRatio);
      canvasRef.current?.graph?.zoomTo(toRatio);
      canvasRef.current?.graph?.fitCenter();
    }
    if (type === '+') {
      if (zoomNum === 4) return;
      const toRatio = Math.min(zoomNum + 0.05, 4);
      setZoomNum(toRatio);
      canvasRef.current?.graph?.zoomTo(toRatio);
      canvasRef.current?.graph?.fitCenter();
    }
  };

  const position = () => {
    const allEdges = canvasRef.current?.graph?.getEdges();
    const allNodes = canvasRef.current?.graph?.getNodes();
    const nodes: any = _.filter(allNodes, node => node._cfg?.states?.includes('selected'));
    const edges: any = _.filter(allEdges, edge => edge._cfg?.states?.includes('_active'));
    if (!nodes?.length && !edges?.length) {
      canvasRef.current?.graph?.fitView(0, { onlyOutOfViewPort: true, direction: 'y' });
    } else {
      canvasRef.current?.graph?.focusItems([...nodes, ...edges]);
    }
    // if (nodes?.length === 1) {
    //   canvasRef.current?.graph?.focusItem(nodes[0]);
    // } else if (edges?.length === 1) {
    //   canvasRef.current?.graph?.focusItem(edges[0]);
    // } else {
    //   canvasRef.current?.graph?.fitView(0, { onlyOutOfViewPort: true, direction: 'y' });
    // }
    getCanvasZoom();
  };

  const fitCanvasView = () => {
    canvasRef.current?.graph?.fitView(0);
    getCanvasZoom();
  };

  const centerCanvasView = () => {
    canvasRef.current?.graph?.fitView(0, { onlyOutOfViewPort: true, direction: 'x' });
    getCanvasZoom();
  };

  return (
    <div className={classnames('ontoG6HeaderRoot', { disabled })}>
      <div className="data-op-box" style={{ display: ontoLibType === 'view' || viewMode ? 'none' : '' }}>
        <div className="kw-align-center kw-h-100">
          {/* 创建点类 */}
          <Tooltip
            placement="bottomLeft"
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
            placement="bottomLeft"
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

      <div className="graph-op-box">
        <div className="kw-align-center kw-h-100">
          <Tooltip
            placement="bottom"
            title={
              <div className="kw-space-between">
                <span>{intl.get('ontoLib.zoomIn')}</span>
              </div>
            }
          >
            {/* <div className="operation" onClick={() => clickWrap(onChangeZoom)('-')}> */}
            <div
              className={zoomNum === 0.05 ? 'operation-other-disabled' : 'operation-other'}
              onClick={() => onChangeZoom('-')}
            >
              <MinusOutlined />
            </div>
          </Tooltip>
          <Tooltip
            placement="bottom"
            title={
              <div className="kw-space-between">
                <span>{intl.get('ontoLib.resetZoom')}</span>
              </div>
            }
          >
            {/* <div className="operation-percent" onClick={() => clickWrap(onChangeZoom)('100')}> */}
            <div className="operation-percent-other" onClick={() => onChangeZoom('100')}>
              {(zoomNum * 100).toFixed()}%
            </div>
          </Tooltip>
          <Tooltip
            placement="bottom"
            title={
              <div className="kw-space-between">
                <span>{intl.get('ontoLib.zoomOut')}</span>
              </div>
            }
          >
            {/* <div className="operation" onClick={() => clickWrap(onChangeZoom)('+')}> */}
            <div
              className={zoomNum === 4 ? 'operation-other-disabled' : 'operation-other'}
              onClick={() => onChangeZoom('+')}
            >
              <PlusOutlined />
            </div>
          </Tooltip>
          <Divider type="vertical" />
          <Tooltip
            placement="bottom"
            title={
              <div className="kw-space-between">
                <span>{intl.get('ontoLib.resetPosition')}</span>
              </div>
            }
          >
            {/* <div className="operation" onClick={clickWrap(position)}> */}
            <div className="operation-other" onClick={position}>
              <IconFont type="icon-dingwei1" />
            </div>
          </Tooltip>
          <Tooltip
            placement="bottom"
            title={
              <div className="kw-space-between">
                <span>{intl.get('ontoLib.adaptive')}</span>
              </div>
            }
          >
            {/* <div className="operation" onClick={clickWrap(fitCanvasView)}> */}
            <div className="operation-other" onClick={fitCanvasView}>
              <IconFont type="icon-fenxi" />
            </div>
          </Tooltip>
          <Tooltip
            placement="bottom"
            title={
              <div className="kw-space-between">
                <span>{intl.get('ontoLib.centerView')}</span>
              </div>
            }
          >
            {/* <div className="operation" onClick={clickWrap(centerCanvasView)}> */}
            <div className="operation-other" onClick={centerCanvasView}>
              <IconFont type="icon-mubiao" />
            </div>
          </Tooltip>
        </div>
      </div>

      <div className="info-box">
        <div className="kw-align-center kw-h-100">
          <Tooltip placement="bottom" title={intl.get('createEntity.taskList')}>
            <div
              className="operation"
              style={{ display: ontoLibType === 'view' ? 'none' : '' }}
              onClick={() => clickWrap(onChangeOperationKey)('taskList')}
            >
              <IconFont type="icon-tasklist" />
            </div>
          </Tooltip>
          <Tooltip placement="bottom" title={intl.get('createEntity.summary')}>
            {/* <div className="operation" onClick={() => clickWrap(onChangeOperationKey)('summaryInfo')}> */}
            <div className="operation-other" onClick={() => onChangeOperationKey('summaryInfo')}>
              <IconFont type="icon-iconzhengli_dangan" />
            </div>
          </Tooltip>
          {ontoLibType !== '' && <Divider type="vertical" />}
          {ontoLibType !== '' && (
            <Tooltip placement="bottom" title={intl.get('ontoLib.graphSetting')}>
              <Popover
                overlayClassName="graphHeaderOperationItem"
                trigger="click"
                placement="bottomRight"
                content={<ModelSetting graphConfig={canvasConfig} onChangeData={canvasConfigChanged} />}
                getPopupContainer={triggerNode => triggerNode?.parentElement || document.body}
              >
                <div className="operation-other">
                  <IconFont type="icon-setting" />
                </div>
              </Popover>
            </Tooltip>
          )}
          {ontoLibType === '' && !viewMode && (
            <div className="kw-align-center kw-h-100">
              <Divider type="vertical" />
              <Tooltip placement="bottomRight" title={intl.get('ontoLib.saveTo')}>
                <div className="operation" onClick={() => clickWrap(onChangeOperationKey)('saveToOnto')}>
                  <IconFont type="icon-baocun" />
                </div>
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      {/* 批量添加关系类 */}
      <OntoEdgesModal
        key={`edge${String(isVisibleEdges)}`}
        isVisibleEdges={isVisibleEdges}
        nodes={graphData?.nodes}
        edges={graphData?.edges}
        closeEdgesModal={closeEdgesModal}
        onAddEdgesBatch={onAddEdgesBatch}
        detailUpdateData={detailUpdateData}
      />

      {/* 批量导入实体弹窗 */}
      <OntoEntityImportModal
        ref={closeParsingRef}
        knDataId={knData.id || window.sessionStorage.getItem('selectedKnowledgeId')}
        key={`entity${String(entityImportVisible)}`}
        visible={entityImportVisible}
        graphId={graphId}
        onOk={onOkExportModal}
        onCancel={closeModal}
        ontoLibType={ontoLibType}
        setParsingFileSet={setParsingFileSet}
        defaultParsingRule={defaultParsingRule}
        setDefaultParsingRule={setDefaultParsingRule}
        sourceFileType={sourceFileType}
        setSourceFileType={setSourceFileType}
        parsingTreeChange={parsingTreeChange}
        setParsingTreeChange={setParsingTreeChange}
        setArFileSave={setArFileSave}
        arFileSave={arFileSave}
      />

      {/* 一键导入弹窗 */}
      <OntoModelImportModal
        knData={knData}
        key={`model${String(isVisibleExport)}`}
        osId={osId}
        dbType={dbType}
        visible={isVisibleExport}
        onOk={onOkExportModal}
        onCancel={closeModal}
        checkVectorServiceStatus={checkVectorServiceStatus}
      />
    </div>
  );
};

// export default Header;
export default forwardRef(Header);
