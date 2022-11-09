/* eslint-disable max-lines */
import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, message, Select, TreeSelect, Empty, ConfigProvider } from 'antd';
import classNames from 'classnames';
import { LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import servicesCreateEntity from '@/services/createEntity';
import ScrollBar from '@/components/ScrollBar';
import { switchIcon, wrapperTitle } from '@/utils/handleFunction';
import { dataSourceShow, ExtractType, SourceType } from '../assistFunction';
import ShowTable from '../ShowTable';
import kong from '@/assets/images/kong.svg';
import './style.less';
import _ from 'lodash';

type AddData = {
  selectSource: Record<string, any>;
  asSelectValue: string[];
  dataSheetSelectValue: string[];
  fileData: any[];
};
interface SourceModalProps {
  visible: boolean;
  setVisible: Function;
  graphId: number;
  modelList: any[];
  anyDataLang?: string;
  total: number;
  onAdd: (data: AddData) => void;
}
const { Option } = Select;
const { SHOW_PARENT } = TreeSelect;
const MAX_COUNT = 100; // 至多100条抽取源
const MQ = 'rabbitmq';
const ERROR_CODES: Record<number, string> = {
  500001: 'createEntity.fileNoexist',
  500002: 'createEntity.sourceIncorrect',
  500006: 'createEntity.sourceNoexist',
  500009: 'createEntity.fileNoexist',
  500012: 'createEntity.tokenError',
  500013: 'createEntity.tokenError'
};

const ModalContent: React.FC<SourceModalProps> = props => {
  const { graphId, modelList, anyDataLang, total, setVisible, onAdd } = props;
  const [dataSource, setDataSource] = useState<any[]>([]); // 所有数据源
  const [isSelect, setIsSelect] = useState(true); // 未选择报错
  const [selectSource, setSelectSource] = useState<Record<string, any>>({}); // 当前选中的数据源 **
  const [dataSheet, setDataSheet] = useState<any[]>([]); // 当数据源来自数据库时, 下拉框显示的数据表
  const [dataSheetSelectValue, setDataSheetSelectValue] = useState<any[]>([]); // 数据表select显示的值 **
  const [fileData, setFileData] = useState<any[]>([]); // AnyShare 文档的树选择节点数据
  const [asSelectValue, setAsSelectValue] = useState<any[]>([]); // 选择AS文件时select框显示的值 **
  const [selectPostfix, setSelectPostfix] = useState<any>(undefined); // 选择的文件后缀
  const [previewSheet, setPreviewSheet] = useState<any[]>([]); // 预览区下拉选项
  const [preSelectValue, setPreSelectValue] = useState<string | undefined>(undefined); // 预览区Select显示的值
  const [viewType, setViewType] = useState(''); // 展示看板类型, json, non-json, dir
  const [previewData, setPreviewData] = useState<any>([]); // 预览数据
  const [preLoading, setPreLoading] = useState(false); // 预览区loading
  const [modalLoading, setModalLoading] = useState(false); // 只要加载数据就会触发的loading
  const [isOpen, setIsOpen] = useState(false); // 是否展开树选择器
  const [modalSelect, setModalSelect] = useState(modelList[0] ? modelList[0][0] : undefined); // 模型抽取，模型选择。
  const [sourceCount, setSourceCount] = useState(0); // 即将添加的抽取源计数

  // 初始化
  useEffect(() => {
    const getSource = async () => {
      setModalLoading(true);

      try {
        setModalLoading(true);
        const sourceRes = await servicesCreateEntity.getFlowSource({ id: graphId, type: 'unfilter' });
        setModalLoading(false);
        if (!sourceRes?.res?.df?.length) return;

        const ds = sourceRes.res.df;
        const source = { ...ds[0] };
        setDataSource(ds);

        const { id, data_source, dataType, extract_type, json_schema, queue } = source;
        const sheetParams = { ds_id: id, data_source, postfix: '' };

        if (data_source === 'as7') {
          sheetParams.postfix =
            dataType === SourceType.STRUCTURED ? (extract_type === ExtractType.LABEL ? 'json' : 'csv') : 'all';
          const asRes = await servicesCreateEntity.getDataList(sheetParams);

          if (asRes?.res) {
            const { output } = asRes.res;
            const _fileData = createTree(0, output, '', dataType);
            setFileData(_fileData);
            setDataSheet(output);
          }
          alertError(asRes);

          // 如果是模型抽取, 加载模型
          if (dataType === SourceType.UNSTRUCTURED && modelList.length) {
            source.extract_model = modelList[0][0];
            const modelRes = await servicesCreateEntity.getModelPreview(modelList[0][0]);

            if (modelRes?.res) {
              setViewType('model');
              setPreviewData(modelRes.res.modelspo);
            }
            alertError(modelRes);
          }
        }

        // 获取数据表
        if (['mysql', 'hive'].includes(data_source)) {
          const sheetRes = await servicesCreateEntity.getDataList(sheetParams);
          sheetRes?.res && setDataSheet(sheetRes.res.output);
        }

        // rabbitMQ预览json模板
        if (data_source === MQ) {
          setViewType('json');
          setPreviewData(json_schema);
          setDataSheetSelectValue([queue]);
        }

        setSelectPostfix(sheetParams.postfix);
        setSelectSource(source);
      } catch {
        setModalLoading(false);
      }
    };

    getSource();
    // eslint-disable-next-line
  }, [graphId, modelList]);

  /**
   * 点击确定，添加文件到抽取源
   */
  const handleAdd = () => {
    if (dataSheetSelectValue.length || asSelectValue.length) {
      if (sourceCount + total > 100) {
        message.error(intl.get('workflow.information.addMaxErr'));
        return false;
      }

      setIsSelect(true);
      onAdd({ selectSource, asSelectValue, dataSheetSelectValue, fileData });
    }
    setIsSelect(false);
  };

  /**
   * @description 切换数据源时, 清空select
   */
  const clearSelect = () => {
    setDataSheet([]); // 清除数据表
    setDataSheetSelectValue([]); // 清除选中的数据表
    setFileData([]); // 清除AS文件树节点
    setAsSelectValue([]); // 清除选中的AS文件
    setPreviewSheet([]); // 清除预览下拉选项
    setPreSelectValue(undefined); // 清空选中的预览
    setViewType('');
    setPreviewData([]); // 清空预览数据
    setPreLoading(false); // 取消loading
    setIsSelect(true); // 消除红框
    setModalSelect(modelList[0] ? modelList[0][0] : undefined); // 重置模型
    setSourceCount(0); // 清除计数
  };

  /**
   * 错误提示
   */
  const alertError = (res: any) => {
    if (!res?.Code) return;
    const { Code, Cause } = res;
    Code in ERROR_CODES ? message.error(intl.get(ERROR_CODES[Code])) : Cause && message.error(Cause);
  };

  /**
   * 下拉框空白
   */
  const customizeRenderEmpty = () => (
    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', textAlign: 'center', marginBottom: 30 }}>
      <Empty image={kong} description={intl.get('global.noData')} style={{ marginTop: 10 }} />
    </div>
  );

  /**
   * 获取选中的数据源的数据表或文件
   * @param ds_id 数据源id
   * @param data_source 数据源, sql 或 AnyShare
   * @param postfix 文件后缀，数据源为AnyShare才有的参数
   * @param dataType 结构化或非结构化
   */
  const getDataSheet = async (ds_id: number, data_source: string, postfix = '', dataType?: string) => {
    setSelectPostfix(postfix);
    const params = { ds_id, data_source, postfix };
    const res = await servicesCreateEntity.getDataList(params);

    if (res?.res) {
      const { output } = res.res;
      setDataSheet(output);

      if (postfix) {
        const files = createTree(0, output, '', dataType);
        setFileData(files);
      }
    }

    if (res?.Code) {
      setFileData([]);
      alertError(res);
    }
  };

  /**
   * 获取预览数据
   * @param id 数据源id
   * @param data_source 数据源, sql 或 AnyShare
   * @param name AnyShare为docid, 数据库为表名
   */
  const getPreviewSheet = async (id: number, data_source: string, name: string) => {
    try {
      const params = { id, data_source, name };
      setPreLoading(true);
      const res = await servicesCreateEntity.getOtherPreData(params);
      setPreLoading(false);

      if (res?.data) {
        setViewType(res.viewtype);
        setPreviewData(res.data);
        return;
      }

      if (res?.res) {
        setViewType('non-json');
        setPreviewData(res.res);
        return;
      }

      setViewType('');
      setPreviewData([]);
      alertError(res);
    } catch {
      setPreLoading(false);
    }
  };

  /**
   * 生成树节点
   * @param pId 该节点的父节点id
   * @param data 文件列表
   * @param path 文件路径
   * @param dataType 结构化或非结构化
   */
  const createTree = (pId: number, data: any[], path: string, dataType?: string) => {
    const tree: any[] = [];
    _.forEach(data, item => {
      const { name, type, docid } = item;
      const isCheckable =
        (type === 'file' && dataType === SourceType.STRUCTURED) || dataType === SourceType.UNSTRUCTURED;
      const file_path = pId === 0 ? name : `${path}/${name}`;
      const value = JSON.stringify({ docid, name, file_path, type });
      tree.push({
        title: (
          <div className="file-tree-row ad-flex">
            <div className="file-tree-type">{switchIcon(type, name, 16)}</div>
            <div className="file-name ad-ml-2">
              <span title={wrapperTitle(name)}>{name}</span>
            </div>
          </div>
        ),
        name,
        value,
        key: value,
        id: docid,
        pId,
        file_path,
        isLeaf: type === 'file',
        selectable: isCheckable,
        checkable: isCheckable
      });
    });

    return tree;
  };

  /**
   * 加载文件
   */
  const onLoadData = (treeNode: Record<string, any>, dataType: string) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async resolve => {
      const { id, file_path } = treeNode;
      const params = {
        docid: id,
        ds_id: selectSource.id,
        postfix: dataType === SourceType.STRUCTURED ? selectPostfix : 'all'
      };

      try {
        // 后台请求加载子文件
        const res = await servicesCreateEntity.getChildrenFile(params);

        if (res && res.res) {
          const { output } = res.res;
          const newData = [...fileData, ...createTree(id, output, file_path, dataType)];
          setFileData(newData);
          resolve(newData);
        }

        if (res && res.Code) {
          alertError(res);
          resolve([]);
        }
      } catch {
        resolve([]);
      }
    });
  };

  /**
   * 选择数据源的change事件
   * @param dsname 选中的数据源名
   */
  const onSelectDsChange = async (dsname: string) => {
    clearSelect(); // 清空原有数据
    const source = { ...(dataSource.find(d => d.dsname === dsname) || {}) };
    if (!source.id) {
      setSelectSource({});
      return;
    }
    setModalLoading(true);
    const { id, data_source, dataType, extract_type } = source;

    if (data_source === 'as' || data_source === 'as7') {
      // 获取AS文件
      if (dataType === SourceType.STRUCTURED) {
        await getDataSheet(id, data_source, extract_type === ExtractType.STANDARD ? 'csv' : 'json', dataType);
      } else {
        await getDataSheet(id, data_source, 'all', dataType);

        // 加载模型预览
        if (modelList.length) {
          source.extract_model = modelList[0][0];
          const res = await servicesCreateEntity.getModelPreview(modelList[0][0]);

          if (res?.res) {
            setViewType('model');
            setPreviewData(res.res.modelspo);
          }

          if (res?.Code) {
            setViewType('');
            setPreviewData([]);
          }
        }
      }
    } else {
      // 获取选中数据源的数据表
      await getDataSheet(id, data_source);
    }

    setSelectSource(source);
    setModalLoading(false);
  };

  /**
   * 选择数据表的change事件
   * @param values 多选选中的数据表
   */
  const onDataSheetChange = (values: any[]) => {
    setIsSelect(!!values.length);
    setDataSheetSelectValue(values);
    setPreviewSheet(values);
    setSourceCount(values.length);

    // 如果预览区有展示, 这里删除了, 则预览区的也要删除
    if (!values.includes(preSelectValue)) {
      setPreSelectValue(undefined);
      setViewType('');
      setPreviewData([]);
    }
  };

  /**
   * 预览区选择数据表的change事件
   * @param name 选中的数据表名称
   */
  const onPreviewSelectChange = (name: string) => {
    const { id, data_source } = selectSource;
    getPreviewSheet(id, data_source, name);
    setPreSelectValue(name);
  };

  /**
   * 数据源为AS时选择文件类型
   * @param postfix 文件后缀名
   */
  const onPostfixChange = async (postfix: string) => {
    const { id, data_source, dataType } = selectSource;

    // 标准抽取清空预览区、文件树
    setPreSelectValue(undefined);
    setViewType('');
    setPreviewData([]);
    setPreviewSheet([]);
    setAsSelectValue([]);
    setFileData([]);

    // 获取新的数据
    setModalLoading(true);
    await getDataSheet(id, data_source, postfix, dataType);
    setModalLoading(false);
  };

  /**
   * @description 数据源为AS时选择器改变的回调, 结构化不能选中文件夹
   * @param values 选中的选项列表
   */
  const onAsSelectChange = (values: any[]) => {
    let files: any[] = [];
    let preSheet: any[] = [];

    if (values.length) {
      setIsSelect(true);
      if (selectSource.extract_type === ExtractType.LABEL) {
        const { docid, name } = JSON.parse(values[values.length - 1]);
        files = [values[values.length - 1]];
        preSheet = [{ docid, name }];
      } else {
        _.forEach(values, (item, i) => {
          const { docid, name, type } = JSON.parse(item);
          preSheet = [...preSheet, { name, docid }];

          if (selectSource.extract_type === ExtractType.STANDARD && type !== 'file') {
            return;
          }

          files = [...files, values[i]];
        });
      }
    } else {
      setIsSelect(false);
    }

    setAsSelectValue(files);
    setSourceCount(files.length);
    selectSource.extract_type === ExtractType.LABEL && setIsOpen(false);

    // 非结构化预览区只显示模型
    if (selectSource.dataType === SourceType.UNSTRUCTURED) return;

    // 结构化, 如果预览区有展示, 这里删除了, 则预览区的也要删除
    setPreviewSheet(preSheet);
    const isDelete = !preSheet.find(item => item.docid === preSelectValue);

    if (isDelete) {
      setPreSelectValue(undefined);
      setViewType('');
      setPreviewData([]);
    }
  };

  /**
   * @description 模型抽取时选择模型得到回调
   * @param model 选中的模型
   */
  const onModelChange = async (model: string) => {
    setModalSelect(model);
    setSelectSource(pre => ({ ...pre, extract_model: model }));
    const res = await servicesCreateEntity.getModelPreview(model);

    if (res?.res) {
      setViewType('model');
      setPreviewData(res.res.modelspo);
      return;
    }

    setViewType('');
    setPreviewData([]);
  };

  return (
    <>
      <ScrollBar className="model-scroll" isshowx="false" color="rgb(184,184,184)">
        <div className="modal-content">
          <div className={classNames({ 'set-content-EN': anyDataLang === 'en-US' })}>
            <div className="select-file-row">
              <label className="modal-label" style={{ transform: 'translateY(2px)' }}>
                {intl.get('workflow.information.dataName')}
              </label>
              <ConfigProvider renderEmpty={customizeRenderEmpty}>
                <Select
                  showSearch
                  allowClear
                  className="select-file"
                  placeholder={intl.get('workflow.information.inputOrSelect')}
                  value={selectSource.dsname}
                  onChange={onSelectDsChange}
                  style={{ transform: 'translateY(2px)' }}
                  getPopupContainer={triggerNode => triggerNode.parentElement.parentElement}
                >
                  {_.map(dataSource, ({ dsname }) => (
                    <Option value={dsname} key={dsname}>
                      {dsname}
                    </Option>
                  ))}
                </Select>
              </ConfigProvider>
            </div>
            {!!selectSource.dsname && (
              <div>
                {/* 数据类型 */}
                {selectSource.data_source !== MQ && (
                  <div className="select-file-row">
                    <label className="modal-label">{intl.get('workflow.information.dataType')}</label>
                    <Input
                      className="modal-input"
                      disabled
                      value={
                        selectSource.dataType === SourceType.STRUCTURED
                          ? intl.get('workflow.information.structured')
                          : intl.get('workflow.information.unstructured')
                      }
                    />
                  </div>
                )}

                {/* 数据来源 */}
                <div className="select-file-row">
                  <label className="modal-label">{intl.get('workflow.information.dataSource')}</label>
                  <Input className="modal-input" disabled value={dataSourceShow(selectSource.data_source)} />
                </div>

                {/* as内容 */}
                {['as', 'as7'].includes(selectSource.data_source) && (
                  <div>
                    {/* as路径 */}
                    <div className="select-file-row">
                      <label className="modal-label">{intl.get('workflow.information.path')}</label>
                      <Input className="modal-input" disabled value={selectSource.ds_path} />
                    </div>

                    {/* as文件选择下拉 */}
                    <div className="select-file-row count-row" id="extract-model-tree">
                      <span className="extract-count">
                        <span className={classNames({ err: sourceCount + total > 100 })}>{sourceCount + total}</span>
                        &nbsp;/&nbsp;{MAX_COUNT}
                      </span>
                      <label className="modal-label">{intl.get('workflow.information.fileName')}</label>
                      <Input.Group compact className="select-file-tree">
                        {selectSource.dataType === SourceType.STRUCTURED && (
                          <Select
                            className="postfix-select"
                            value={selectPostfix}
                            disabled={selectSource.extract_type === ExtractType.LABEL}
                            onChange={onPostfixChange}
                            getPopupContainer={triggerNode => triggerNode.parentElement}
                          >
                            {selectSource.extract_type === ExtractType.STANDARD && <Option value="csv">csv</Option>}
                            <Option value="json">json</Option>
                          </Select>
                        )}
                        <ConfigProvider renderEmpty={customizeRenderEmpty}>
                          <TreeSelect
                            key={`${selectSource.id + selectPostfix}`}
                            className={classNames({
                              'structured-tree-select': selectSource.dataType === SourceType.STRUCTURED,
                              'un-structured-tree-select': selectSource.dataType !== SourceType.STRUCTURED,
                              'no-select': !isSelect || sourceCount + total > 100
                            })}
                            dropdownClassName={classNames({
                              'model-extract-drop': selectSource.extract_type === ExtractType.MODEL
                            })}
                            getPopupContainer={() => document.getElementById('extract-model-tree') || document.body}
                            listHeight={32 * 5}
                            placeholder={intl.get('workflow.information.pleaseSelect')}
                            treeDataSimpleMode
                            treeData={fileData}
                            showSearch={false}
                            treeCheckable
                            showCheckedStrategy={SHOW_PARENT}
                            value={asSelectValue}
                            loadData={treeNode => onLoadData(treeNode, selectSource.dataType)}
                            onChange={onAsSelectChange}
                            maxTagCount={2}
                            onDropdownVisibleChange={isDrop => {
                              if (selectSource.extract_type !== ExtractType.LABEL) return;
                              setIsOpen(isDrop);
                            }}
                            open={selectSource.extract_type === ExtractType.LABEL ? isOpen : undefined}
                          />
                        </ConfigProvider>
                      </Input.Group>
                    </div>
                  </div>
                )}

                {/* 数据库内容 */}
                {['hive', 'mysql'].includes(selectSource.data_source) && (
                  <div>
                    <div className="select-file-row">
                      <label className="modal-label">{intl.get('workflow.information.database')}</label>
                      <Input className="modal-input" disabled value={selectSource.ds_path} />
                    </div>
                    <div className="select-file-row count-row">
                      <span className="extract-count">
                        <span className={classNames({ err: sourceCount + total > 100 })}>{sourceCount + total}</span>
                        &nbsp;/&nbsp;{MAX_COUNT}
                      </span>
                      <label className="modal-label">{intl.get('workflow.information.tables')}</label>
                      <ConfigProvider renderEmpty={customizeRenderEmpty}>
                        <Select
                          className={classNames('data-sheet-tree', {
                            'no-select': !isSelect || sourceCount + total > 100
                          })}
                          listHeight={32 * 5}
                          placeholder={intl.get('workflow.information.inputOrSelect')}
                          getPopupContainer={triggerNode => triggerNode.parentElement}
                          mode="multiple"
                          maxTagCount={3}
                          maxTagTextLength={15}
                          value={dataSheetSelectValue}
                          onChange={onDataSheetChange}
                        >
                          {_.map(dataSheet, (item, index) => {
                            return (
                              <Option value={item} key={index}>
                                <span className="sheet-option">
                                  <span className="sheet-icon">{switchIcon('sheet', '', 16)} </span>
                                  <span className="sheet-name" title={wrapperTitle(item)}>
                                    {item}
                                  </span>
                                </span>
                              </Option>
                            );
                          })}
                        </Select>
                      </ConfigProvider>
                    </div>
                  </div>
                )}

                {/* rabbitmq队列名称 */}
                {selectSource.data_source === MQ && (
                  <div className="select-file-row">
                    <label className="modal-label">{intl.get('datamanagement.queue')}</label>
                    <Input className="modal-input" disabled value={selectSource.queue} />
                  </div>
                )}

                {/* 抽取方式 */}
                <div className="select-file-row">
                  <label className="modal-label">{intl.get('workflow.information.extrMethod')}</label>
                  <Input
                    className="modal-input"
                    disabled
                    value={
                      selectSource.extract_type === ExtractType.MODEL
                        ? intl.get('workflow.information.modelExtraction')
                        : selectSource.extract_type === ExtractType.STANDARD
                          ? intl.get('workflow.information.standardExtraction')
                          : intl.get('workflow.information.labelExtraction')
                    }
                  />
                </div>

                {/* 模型抽取时才出现的选项 */}
                {selectSource.extract_type === ExtractType.MODEL && (
                  <div>
                    <div className="select-file-row">
                      <label className="modal-label">{intl.get('workflow.information.selectModel')}</label>
                      <ConfigProvider renderEmpty={customizeRenderEmpty}>
                        <Select
                          key={`${`${selectSource.id}model`}`}
                          className="select-file"
                          placeholder={intl.get('workflow.information.pleaseSelect')}
                          defaultValue={modelList[0] ? modelList[0][0] : undefined}
                          value={modalSelect}
                          onChange={onModelChange}
                          getPopupContainer={triggerNode => triggerNode.parentElement}
                        >
                          {_.map(modelList, ([key, value]) => {
                            const showValue = anyDataLang === 'en-US' ? key : value;

                            return (
                              <Option key={key} value={key}>
                                {showValue}
                              </Option>
                            );
                          })}
                        </Select>
                      </ConfigProvider>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 预览区域 */}
          <div className="preview-box">
            <h3 className="preview-h">
              {intl.get('workflow.information.preview')}
              <span className="preview-span">
                {selectSource.extract_type === ExtractType.MODEL
                  ? intl.get('workflow.information.showModel')
                  : selectSource.data_source === MQ
                    ? intl.get('workflow.information.showSchema')
                    : intl.get('workflow.information.previewSome')}
              </span>
            </h3>
            <div
              className={classNames({
                'model-content': selectSource.extract_type === ExtractType.MODEL,
                'preview-content': selectSource.extract_type !== ExtractType.MODEL,
                'pre-mq': selectSource.data_source === MQ
              })}
              style={!selectSource.dsname ? { minHeight: 487 } : undefined}
            >
              {selectSource.dataType === SourceType.STRUCTURED && selectSource.data_source !== MQ && (
                <div className="select-data-box">
                  <ConfigProvider renderEmpty={customizeRenderEmpty}>
                    <Select
                      className="select-data"
                      getPopupContainer={triggerNode => triggerNode.parentElement}
                      onChange={onPreviewSelectChange}
                      placeholder={intl.get('workflow.information.pleaseSelect')}
                      value={preSelectValue}
                    >
                      {_.map(previewSheet, (item, index) =>
                        typeof item === 'string' ? (
                          <Option value={item} key={index}>
                            <span className="sheet-option">
                              <span className="sheet-icon">{switchIcon('sheet', '', 16)} </span>
                              <span className="sheet-name">{item}</span>
                            </span>
                          </Option>
                        ) : (
                          <Option value={item.docid} key={index}>
                            <div className="file-tree-row ad-flex">
                              <div className="file-tree-type">{switchIcon('file', item.name, 16)}</div>
                              <div className="file-name ad-ml-2">
                                <span className="word" title={wrapperTitle(item.name)}>
                                  {item.name}
                                </span>
                              </div>
                            </div>
                          </Option>
                        )
                      )}
                    </Select>
                  </ConfigProvider>
                </div>
              )}

              <ShowTable selfKey={'modal'} viewType={viewType} preData={previewData} area={'modal'} />
            </div>

            {preLoading && (
              <div className="extract-pre-loading">
                <LoadingOutlined className="icon" />
              </div>
            )}
          </div>

          {modalLoading && (
            <div className="extract-modal-loading">
              <LoadingOutlined className="icon" />
            </div>
          )}
        </div>
      </ScrollBar>
      <div className="footer-btn">
        <ConfigProvider key="entityInfo" autoInsertSpaceInButton={false}>
          <Button type="default" className="ds-btn" onClick={() => setVisible(false)}>
            {intl.get('global.cancel')}
          </Button>
          <Button type="primary" className="ds-btn" onClick={handleAdd}>
            {intl.get('global.ok')}
          </Button>
        </ConfigProvider>
      </div>
    </>
  );
};

const SourceModal: React.FC<SourceModalProps> = props => {
  const { visible, setVisible } = props;

  return (
    <Modal
      className="extract-source-modal"
      title={intl.get('workflow.information.details')}
      visible={visible}
      width={800}
      maskClosable={false}
      destroyOnClose
      footer={null}
      onCancel={() => setVisible(false)}
    >
      <ModalContent {...props} />
    </Modal>
  );
};

export default SourceModal;
