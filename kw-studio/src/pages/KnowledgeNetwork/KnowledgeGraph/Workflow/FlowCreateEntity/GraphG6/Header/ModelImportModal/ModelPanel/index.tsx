/**
 * 导入模型
 */
import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import intl from 'react-intl-universal';
import { Select, Empty, message } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import classnames from 'classnames';
import { EXTRACT_MODELS } from '@/enums';
import servicesCreateEntity from '@/services/createEntity';
import serviceStorageManagement from '@/services/storageManagement';
import HOOKS from '@/hooks';
import Format from '@/components/Format';
import { PreviewTable, PreviewCanvas, parseModelGraph, parseSpo } from '@/components/SourceImportComponent';
import { PreviewColumn } from '@/components/SourceImportComponent/types';
import { createModelGraph } from './assistant';
import kong from '@/assets/images/kong.svg';
import './style.less';

const { Option } = Select;

export interface ModelPanelProps {
  osId: number; // 图数据库绑定的 openserch id
  dbType: string; // 图数据库类型
}
type ViewType = 'table' | 'canvas' | 'json';

const ModelPanel: React.ForwardRefRenderFunction<unknown, ModelPanelProps> = (props, ref) => {
  const { dbType, osId } = props;
  const history = useHistory();
  const language = HOOKS.useLanguage();
  const [modelList, setModelList] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] }); // 图数据
  const [tableData, setTableData] = useState<PreviewColumn[]>([]); // 预览的表格数据
  const [viewType, setViewType] = useState<ViewType>('table'); // 视图类型

  useImperativeHandle(ref, () => ({
    getGraph: () => (selected ? createModelGraph(graphData, selected) : null)
  }));

  useEffect(() => {
    getAllModels();
  }, []);

  /**
   * 获取模型列表
   */
  const getAllModels = async () => {
    const { res } = (await servicesCreateEntity.fetchModelList()) || {};

    if (!res) return;
    const models = Object.entries(res);
    setModelList(models);
    onModelChange(models[0][0]);
  };

  /**
   * 选择模型
   * @param value 模型名称
   */
  const onModelChange = async (value: string) => {
    // 图谱绑定orientdb，选择文档知识模型，在没有配置opensearch的情况选择无效并提示
    if (value === EXTRACT_MODELS.asDoc && dbType === 'orientdb') {
      const hasConfig = await boolOpenSearch();
      if (!hasConfig) {
        return;
      }
    }

    setSelected(value);
    setViewType('canvas');
    const { res, Description } = (await servicesCreateEntity.getModelPreview(value)) || {};
    if (!res) {
      setTableData([]);
      setGraphData({ nodes: [], edges: [] });
      // return Description && message.error(Description);
      return (
        Description &&
        message.error({
          content: Description,
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        })
      );
    }
    const table = parseSpo(res.modelspo);
    setTableData(table);
    getModelGraph(value);
  };

  /**
   * 判断是否配置openSearch
   */
  const boolOpenSearch = async () => {
    try {
      const res = await serviceStorageManagement.graphDBGetById(osId);

      if (res?.res?.osId > 0) {
        return true;
      }
      message.error({
        content: (
          <div>
            {intl.get('global.openSearchNull')}
            <span
              style={{ cursor: 'pointer' }}
              className="kw-c-primary"
              onClick={() => history.push('/home/system-config')}
            >
              {intl.get('global.goNow')}
            </span>
          </div>
        ),
        onClick: () => {
          message?.destroy();
        },
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
      return false;
    } catch (error) {
      return false;
    }
  };

  /**
   * 获取模型图谱
   */
  const getModelGraph = async (model: string) => {
    const { res, Description } = (await servicesCreateEntity.unstructuredData({ model, file_list: [] })) || {};
    if (!res) {
      setGraphData({ nodes: [], edges: [] });
      // return Description && message.error(Description);
      return (
        Description &&
        message.error({
          content: Description,
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        })
      );
    }
    const graph = parseModelGraph(res, true);
    setGraphData(graph);
  };

  /**
   * 切换视图
   */
  const onViewChange = () => {
    const type = viewType === 'table' ? 'canvas' : 'table';
    setViewType(type);
  };

  return (
    <div className="flow-3-model-Panel kw-h-100 kw-pt-5">
      <div className="p-title kw-mb-5">
        <Format.Title level={3}>{intl.get('createEntity.modelImport')}</Format.Title>
      </div>

      <Select
        className="kw-w-100 kw-mb-5"
        placeholder={intl.get('createEntity.select')}
        getPopupContainer={triggerNode => triggerNode.parentElement}
        value={selected}
        onChange={onModelChange}
        notFoundContent={<Empty image={kong} description={intl.get('global.noData')} />}
      >
        {modelList.map(([key, value]) => {
          const showValue = language === 'en-US' ? key : value;
          return (
            <Option value={key} key={key}>
              {showValue}
            </Option>
          );
        })}
      </Select>

      <div className="kw-space-between kw-mb-2">
        <div className="kw-c-header">
          {intl.get('workflow.information.preview')}
          <span className="kw-ml-2 kw-c-subtext">{intl.get('workflow.information.showModel')}</span>
        </div>
        <div className="btn-wrapper kw-pointer" onClick={onViewChange}>
          <SwapOutlined className="kw-mr-2" />
          {intl.get('workflow.information.viewChange')}
        </div>
      </div>

      <div className="preview-box">
        <div className={classnames('p-table kw-w-100 kw-h-100', { 'hide-view': viewType !== 'table' })}>
          <PreviewTable showLess data={tableData} shouldCheck={false} />
        </div>
        <div className={classnames('p-canvas kw-w-100 kw-h-100', { 'hide-view': viewType !== 'canvas' })}>
          <PreviewCanvas graphData={graphData} />
        </div>
      </div>
    </div>
  );
};

export default forwardRef(ModelPanel);
