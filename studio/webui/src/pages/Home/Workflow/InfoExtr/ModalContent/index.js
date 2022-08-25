/* eslint-disable */
/**
 * 选择数据源弹窗内容
 * @author Jason.ji
 * @version 1.0
 * @date 2020/9/21
 */

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import intl from 'react-intl-universal';
import { Input, message, Select, TreeSelect, Empty, ConfigProvider } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import servicesCreateEntity from '@/services/createEntity';

import ScrollBar from '@/components/ScrollBar';
import { switchIcon, wrapperTitle } from '@/utils/handleFunction';

import ShowTable from '../ShowTable';
import { dataSourceShow } from '../assistFunction';

import kong from '@/assets/images/kong.svg';
import './style.less';

const { Option } = Select;
const { SHOW_PARENT } = TreeSelect;
const STRUCTURED = 'structured'; // 结构化
const UNSTRUCTURED = 'unstructured'; // 非结构化
const STANDARD_EXTRACTION = 'standardExtraction'; // 标准抽取
const MODEL_EXTRACTION = 'modelExtraction'; // 模型抽取
const LABEL_EXTRACTION = 'labelExtraction'; // 标注抽取
const MAX_COUNT = 100; // 至多100条抽取源
const MQ = 'rabbitmq';

const ModalContent = (props, ref) => {
  const { graphId, modelList, anyDataLang, total } = props;
  const [dataSource, setDataSource] = useState([]); // 所有数据源
  const [isSelect, setIsSelect] = useState(true); // 未选择报错
  const [selectSource, setSelectSource] = useState([]); // 当前选中的数据源 **
  const [dsSelectValue, setDsSelectValue] = useState(undefined); // 数据源select显示的值
  const [dataSheet, setDataSheet] = useState([]); // 当数据源来自数据库时, 下拉框显示的数据表
  const [dataSheetSelectValue, setDataSheetSelectValue] = useState([]); // 数据表select显示的值 **
  const [fileData, setFileData] = useState([]); // AnyShare 文档的树选择节点数据
  const [asSelectValue, setAsSelectValue] = useState([]); // 选择AS文件时select框显示的值 **
  const [selectPostfix, setSelectPostfix] = useState(undefined); // 选择的文件后缀
  const [previewSheet, setPreviewSheet] = useState([]); // 预览区下拉选项
  const [preSelectValue, setPreSelectValue] = useState(undefined); // 预览区Select显示的值
  const [viewType, setViewType] = useState(''); // 展示看板类型, json, non-json, dir
  const [previewData, setPreviewData] = useState([]); // 预览数据
  const [preLoading, setPreLoading] = useState(false); // 预览区loading
  const [modalLoading, setModalLoading] = useState(false); // 只要加载数据就会触发的loading
  const [isOpen, setIsOpen] = useState(false); // 是否展开树选择器
  const [modalSelect, setModalSelect] = useState(modelList[0] ? modelList[0][0] : undefined); // 模型抽取，模型选择。
  const [sourceCount, setSourceCount] = useState(0); // 即将添加的抽取源计数

  // 绑定ref, 抛出父组件能调用的方法
  useImperativeHandle(ref, () => ({
    addFile
  }));

  // 页面挂载时加载数据源
  useEffect(() => {
    const getSource = async () => {
      setModalLoading(true);
      const sourceRes = await servicesCreateEntity.getFlowSource({ id: graphId, type: 'unfilter' });
      if (sourceRes && sourceRes.res) {
        let ds = [];
        ds = sourceRes.res.df;
        setDataSource(ds);

        // 设置选中第一个数据
        if (ds.length > 0) {
          const { dsname, id, data_source, dataType, extract_type, json_schema, queue } = ds[0];

          setDsSelectValue(dsname);

          let sheetParams = {
            ds_id: id,
            data_source: data_source,
            postfix: ''
          };

          if (data_source === 'as' || data_source === 'as7') {
            // 获取AS文件
            sheetParams.postfix =
              dataType === STRUCTURED ? (extract_type === LABEL_EXTRACTION ? 'json' : 'csv') : 'all';

            const asRes = await servicesCreateEntity.getDataList(sheetParams);

            if (asRes && asRes.res) {
              const { output } = asRes.res;
              let _fileData = createTree(0, output, '', dataType);
              setFileData(_fileData);
              setDataSheet(output);
            }

            if (asRes && asRes.Code) {
              if ([500012, 500013].includes(asRes.Code)) message.error(intl.get('workflow.information.as7BeOver'));
            }

            // 如果是模型抽取, 加载模型
            if (dataType === UNSTRUCTURED && modelList.length > 0) {
              ds[0].extract_model = modelList[0][0];
              const modelRes = await servicesCreateEntity.getModelPreview(modelList[0][0]);
              if (modelRes && modelRes.res) {
                setViewType('model');
                setPreviewData(modelRes.res.modelspo);
              }

              if (modelRes && [500012, 500013].includes(modelRes.Code)) {
                message.error(intl.get('workflow.information.as7BeOver'));
              }
            }
          }

          // 获取数据表
          if (['mysql', 'hive'].includes(data_source)) {
            const sheetRes = await servicesCreateEntity.getDataList(sheetParams);
            sheetRes && sheetRes.res && setDataSheet(sheetRes.res.output);
          }

          // rabbitMQ预览json模板
          if (data_source === MQ) {
            setViewType('json');
            setPreviewData(json_schema);
            setDataSheetSelectValue([queue]);
          }

          setSelectPostfix(sheetParams.postfix);
          setSelectSource(ds[0]);
        }
      }

      setModalLoading(false);
    };

    getSource();

    // eslint-disable-next-line
  }, [graphId, modelList]);

  /**
   * @description 添加文件到数据源
   */
  const addFile = () => {
    // 当选择了数据表或文件
    if (dataSheetSelectValue.length !== 0 || asSelectValue.length !== 0) {
      if (sourceCount + total > 100) {
        message.error(intl.get('workflow.information.addMaxErr'));
        return false;
      }

      setIsSelect(true);
      return { selectSource, asSelectValue, dataSheetSelectValue, fileData };
    } else {
      setIsSelect(false);
      return false; // 未选择无法添加
    }
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
   * @description 自定义结果空白页
   */
  const customizeRenderEmpty = () => (
    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', textAlign: 'center', marginBottom: 30 }}>
      <Empty image={kong} description={[intl.get('createEntity.noData')]} style={{ marginTop: 10 }} />
    </div>
  );

  /**
   * @description 获取选中的数据源的数据表或文件
   * @param {number} ds_id 数据源id
   * @param {string} data_source 数据源, sql 或 AnyShare
   * @param {string} postfix 文件后缀，数据源为AnyShare才有的参数
   * @param {string} dataType 结构化或非结构化
   */
  const getDataSheet = async (ds_id, data_source, postfix = '', dataType) => {
    const params = {
      ds_id,
      data_source,
      postfix
    };

    const res = await servicesCreateEntity.getDataList(params);

    if (postfix && postfix !== 'all') setSelectPostfix(postfix);

    if (res && res.res) {
      const { output } = res.res;

      // 选择的时AS, 获取到文件时同时渲染文件树
      if (postfix) {
        let _fileData = createTree(0, output, '', dataType);
        setFileData(_fileData);
      }

      setDataSheet(output);
    }

    if (res && res.Code) {
      setFileData([]);
      if ([500012, 500013].includes(res.Code)) {
        message.error(intl.get('workflow.information.as7BeOver'));
      }
    }
  };

  /**
   * @description 获取预览数据
   * @param {number} id 数据源id
   * @param {string} data_source 数据源, sql 或 AnyShare
   * @param {string} name AnyShare为docid, 数据库为表名
   */
  const getPreviewSheet = async (id, data_source, name) => {
    const params = {
      id,
      data_source,
      name
    };

    setPreLoading(true);
    const res = await servicesCreateEntity.getOtherPreData(params);

    if (res && (res.data || res.res)) {
      setPreLoading(false);
      if (data_source === 'as' || data_source === 'as7') {
        setViewType(res.viewtype);
        setPreviewData(res.data);
      } else {
        setViewType('non-json');
        setPreviewData(res.res);
      }
    }

    if (res && res.Code) {
      if (res.Code === 500001) {
        message.error(intl.get('createEntity.fileNoexist'));
      }

      if (res.Code === 500002) {
        message.error(intl.get('createEntity.sourceIncorrect'));
      }

      if (res.Code === 500006) {
        message.error(intl.get('createEntity.sourceNoexist'));
      }

      if (res.Code === 500009) {
        message.error(intl.get('createEntity.fileNoExist'));
      }

      if (res.Code === 500013) {
        message.error(intl.get('createEntity.tokenError'));

        return;
      }

      setViewType('');
      setPreviewData([]);
      setPreLoading(false);
    }
  };

  /**
   * @description 生成树节点
   * @param {number} parentId 该节点的父节点id
   * @param {Array} data 文件列表
   * @param {string} typeSelect 节点类型
   * @param {string} dataType 结构化或非结构化
   */
  const createTree = (pId, data, path, dataType) => {
    let tree = [];
    let eachData = {};

    if (data && data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        const { name, type, docid } = data[i];

        let isCheckable = (type === 'file' && dataType === STRUCTURED) || dataType === UNSTRUCTURED;
        let isSelect = (type === 'file' && dataType === STRUCTURED) || dataType === UNSTRUCTURED;
        let file_path = pId === 0 ? name : `${path}/${name}`;

        eachData = {
          title: (
            <div className="anyshare-filetree-row">
              <div className="anyshare-filetree-type">{switchIcon(type, name, 16)}</div>
              <div className="file-name">
                <span title={wrapperTitle(name)}>{name}</span>
              </div>
            </div>
          ),
          name: name,
          value: JSON.stringify({
            docid,
            name,
            file_path,
            type
          }),
          key: JSON.stringify({
            docid,
            name,
            file_path,
            type
          }),
          id: docid,
          isLeaf: type === 'file',
          pId,
          selectable: isSelect,
          checkable: isCheckable,
          file_path
        };

        tree = [...tree, eachData];
      }
    }

    return tree;
  };

  /**
   * @description 异步加载节点
   */
  const onLoadData = (treeNode, dataType) => {
    return new Promise(async resolve => {
      const { id, file_path } = treeNode;
      const params = {
        docid: id,
        ds_id: selectSource.id,
        postfix: dataType === STRUCTURED ? selectPostfix : 'all'
      };

      // 后台请求加载子节点
      const res = await servicesCreateEntity.getChildrenFile(params);

      if (res && res.res) {
        const { output } = res.res;
        let newData = [...fileData, ...createTree(id, output, file_path, dataType)];
        setFileData(newData);
        resolve(newData);
      }

      if (res && res.Code) {
        [500012, 500013].includes(res.Code) && message.error(intl.get('workflow.information.as7BeOver'));
        resolve([]);
      }
    });
  };

  /**
   * @description 选择数据源的change事件
   * @param {string} dsname 选中的数据源名
   */
  const onSelectDsChange = async dsname => {
    setDsSelectValue(dsname);
    clearSelect(); // 清空原有数据
    const ds = [...dataSource];
    let index = ds.findIndex(item => item.dsname === dsname);

    if (index === -1) return;

    setModalLoading(true);

    const { id, data_source, dataType, extract_type } = ds[index];

    if (data_source === 'as' || data_source === 'as7') {
      // 获取AS文件
      if (dataType === STRUCTURED) {
        await getDataSheet(id, data_source, extract_type === STANDARD_EXTRACTION ? 'csv' : 'json', dataType);
      } else {
        await getDataSheet(id, data_source, 'all', dataType);

        // 加载模型预览
        if (modelList.length > 0) {
          ds[index].extract_model = modelList[0][0];
          const res = await servicesCreateEntity.getModelPreview(modelList[0][0]);

          if (res && res.res) {
            setViewType('model');
            setPreviewData(res.res.modelspo);
          }

          if (res && res.Code) {
            setViewType('');
            setPreviewData([]);
          }
        }
      }
    } else {
      // 获取选中数据源的数据表
      await getDataSheet(id, data_source);
    }

    setSelectSource(ds[index]);

    setTimeout(() => {
      setModalLoading(false);
    }, 0);
  };

  /**
   * @description 选择数据表的change事件
   * @param {Array} values 数组, 多选选中的数据表的索引列表
   */
  const onDataSheetChange = values => {
    if (values.length === 0) {
      setIsSelect(false);
    } else {
      setIsSelect(true);
    }
    setDataSheetSelectValue(values);
    setPreviewSheet(values);
    setSourceCount(values.length);

    // 如果预览区有展示, 这里删除了, 则预览区的也要删除
    if (values.indexOf(preSelectValue) === -1) {
      setPreSelectValue(undefined);
      setViewType('');
      setPreviewData([]);
    }
  };

  /**
   * @description 预览区选择数据表的change事件
   * @param {string} name 选中的数据表名称
   */
  const onPreviewSelectChange = name => {
    const { id, data_source } = selectSource;

    // 获取数据
    getPreviewSheet(id, data_source, name);

    // 设置选择器的值
    setPreSelectValue(name);
  };

  /**
   * @description 数据源为AS时选择文件类型
   * @param {string} postfix 文件后缀名
   */
  const onPostfixChange = async postfix => {
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
   * @param {Array} values 选中的选项列表
   */
  const onAsSelectChange = values => {
    let files = [];
    let preSheet = [];

    if (values.length > 0) {
      setIsSelect(true);
      if (selectSource.extract_type === LABEL_EXTRACTION) {
        const { docid, name } = JSON.parse(values[values.length - 1]);
        files = [values[values.length - 1]];
        preSheet = [{ docid, name }];
      } else {
        values.forEach((item, i) => {
          const { docid, name, type } = JSON.parse(item);
          preSheet = [...preSheet, { name, docid }];

          if (selectSource.extract_type === STANDARD_EXTRACTION && type !== 'file') {
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
    selectSource.extract_type === 'labelExtraction' && setIsOpen(false);

    // 非结构化预览区只显示模型
    if (selectSource.dataType && selectSource.dataType === UNSTRUCTURED) return;

    // 结构化, 如果预览区有展示, 这里删除了, 则预览区的也要删除
    setPreviewSheet(preSheet);
    let isDelete = preSheet.findIndex(item => item.docid === preSelectValue) === -1;

    if (isDelete) {
      setPreSelectValue(undefined);
      setViewType('');
      setPreviewData([]);
    }
  };

  /**
   * @description 模型抽取时选择模型得到回调
   * @param {string} model 选中的模型
   */
  const onModelChange = async model => {
    setModalSelect(model);

    let source = JSON.parse(JSON.stringify(selectSource));
    source.extract_model = model;
    setSelectSource(source);

    // 加载模型预览
    const res = await servicesCreateEntity.getModelPreview(model);

    if (res && res.res) {
      setViewType('model');
      setPreviewData(res.res.modelspo);
    }

    if (res && res.Code) {
      setViewType('');
      setPreviewData([]);
    }
  };

  return (
    <ScrollBar className="model-scroll" isshowx="false" color="rgb(184,184,184)">
      <div className="modal-content">
        <div className={anyDataLang === 'en-US' ? 'set-content-EN' : 'set-content'}>
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
                value={dsSelectValue}
                onChange={onSelectDsChange}
                style={{ transform: 'translateY(2px)' }}
                getPopupContainer={triggerNode => triggerNode.parentElement.parentElement}
              >
                {dataSource && dataSource instanceof Array
                  ? dataSource.map((item, index) => {
                      return (
                        <Option value={item.dsname} key={index}>
                          {item.dsname}
                        </Option>
                      );
                    })
                  : null}
              </Select>
            </ConfigProvider>
          </div>
          {selectSource.length === 0 ? null : (
            <div>
              {/* 数据类型 */}
              {selectSource.data_source !== MQ && (
                <div className="select-file-row">
                  <label className="modal-label">{intl.get('workflow.information.dataType')}</label>
                  <Input
                    className="modal-input"
                    disabled
                    value={
                      selectSource.dataType === STRUCTURED
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
                      <span className={sourceCount + total > 100 ? 'err' : ''}>{sourceCount + total}</span>
                      &nbsp;/&nbsp;{MAX_COUNT}
                    </span>
                    <label className="modal-label">{intl.get('workflow.information.fileName')}</label>
                    <Input.Group compact className="select-file-tree">
                      {selectSource.dataType === STRUCTURED ? (
                        <Select
                          className="postfix-select"
                          value={selectPostfix}
                          disabled={selectSource.extract_type === LABEL_EXTRACTION}
                          onChange={onPostfixChange}
                          getPopupContainer={triggerNode => triggerNode.parentElement}
                        >
                          {selectSource.extract_type === STANDARD_EXTRACTION && <Option value="csv">csv</Option>}
                          <Option value="json">json</Option>
                        </Select>
                      ) : null}
                      <ConfigProvider renderEmpty={customizeRenderEmpty}>
                        <TreeSelect
                          key={`${selectSource.id + selectPostfix}`}
                          className={`
                                ${
                                  selectSource.dataType === STRUCTURED
                                    ? 'structured-tree-select'
                                    : 'un-structured-tree-select'
                                } 
                                ${!isSelect || sourceCount + total > 100 ? 'no-select' : ''}
                              `}
                          dropdownClassName={selectSource.extract_type === MODEL_EXTRACTION ? 'model-extract-drop' : ''}
                          getPopupContainer={() => document.getElementById('extract-model-tree')}
                          listHeight={32 * 5} // 1条选项heigh=32px, 最多显示5条
                          placeholder={intl.get('workflow.information.pleaseSelect')}
                          treeDataSimpleMode
                          treeData={fileData}
                          showSearch={false}
                          treeCheckable={true}
                          showCheckedStrategy={SHOW_PARENT}
                          value={asSelectValue}
                          loadData={treeNode => onLoadData(treeNode, selectSource.dataType)}
                          onChange={onAsSelectChange}
                          maxTagCount={2}
                          onDropdownVisibleChange={isDrop => {
                            if (isDrop) {
                              selectSource.extract_type === LABEL_EXTRACTION && setIsOpen(true);
                            } else {
                              selectSource.extract_type === LABEL_EXTRACTION && setIsOpen(false);
                            }
                          }}
                          open={selectSource.extract_type === LABEL_EXTRACTION ? isOpen : undefined}
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
                      <span className={sourceCount + total > 100 ? 'err' : ''}>{sourceCount + total}</span>
                      &nbsp;/&nbsp;{MAX_COUNT}
                    </span>
                    <label className="modal-label">{intl.get('workflow.information.tables')}</label>
                    <ConfigProvider renderEmpty={customizeRenderEmpty}>
                      <Select
                        className={`data-sheet-tree ${!isSelect || sourceCount + total > 100 ? 'no-select' : ''}`}
                        listHeight={32 * 5} // 5条
                        placeholder={intl.get('workflow.information.inputOrSelect')}
                        getPopupContainer={triggerNode => triggerNode.parentElement}
                        mode="multiple"
                        maxTagCount={3}
                        maxTagTextLength={15}
                        value={dataSheetSelectValue}
                        onChange={onDataSheetChange}
                      >
                        {dataSheet && dataSheet instanceof Array
                          ? dataSheet.map((item, index) => {
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
                            })
                          : null}
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
                    selectSource.extract_type === MODEL_EXTRACTION
                      ? intl.get('workflow.information.modelExtraction')
                      : selectSource.extract_type === STANDARD_EXTRACTION
                      ? intl.get('workflow.information.standardExtraction')
                      : intl.get('workflow.information.labelExtraction')
                  }
                />
              </div>

              {/* 模型抽取时才出现的选项 */}
              {selectSource.extract_type === MODEL_EXTRACTION && (
                <div>
                  <div className="select-file-row">
                    <label className="modal-label">{intl.get('workflow.information.selectModel')}</label>
                    <ConfigProvider renderEmpty={customizeRenderEmpty}>
                      <Select
                        key={`${selectSource.id + 'model'}`}
                        className="select-file"
                        placeholder={intl.get('workflow.information.pleaseSelect')}
                        defaultValue={modelList[0] ? modelList[0][0] : undefined}
                        value={modalSelect}
                        onChange={onModelChange}
                        getPopupContainer={triggerNode => triggerNode.parentElement}
                      >
                        {modelList instanceof Array
                          ? modelList.map(([key, value]) => {
                              const showValue = anyDataLang === 'en-US' ? key : value;

                              return (
                                <Option key={key} value={key}>
                                  {showValue}
                                </Option>
                              );
                            })
                          : null}
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
              {selectSource.extract_type === MODEL_EXTRACTION
                ? intl.get('workflow.information.showModel')
                : selectSource.data_source === MQ
                ? intl.get('workflow.information.showSchema')
                : intl.get('workflow.information.previewSome')}
            </span>
          </h3>
          <div
            className={`${selectSource.extract_type === MODEL_EXTRACTION ? 'model-content' : 'preview-content'} ${
              selectSource.data_source === MQ ? 'pre-mq' : ''
            }`}
            style={selectSource.length === 0 ? { minHeight: 485 } : null}
          >
            {selectSource.dataType === STRUCTURED && selectSource.data_source !== MQ && (
              <div className="select-data-box">
                <ConfigProvider renderEmpty={customizeRenderEmpty}>
                  <Select
                    className="select-data"
                    getPopupContainer={triggerNode => triggerNode.parentElement}
                    onChange={onPreviewSelectChange}
                    placeholder={intl.get('workflow.information.pleaseSelect')}
                    value={preSelectValue}
                  >
                    {previewSheet instanceof Array
                      ? previewSheet.map((item, index) => {
                          let option =
                            typeof item === 'string' ? (
                              <Option value={item} key={index}>
                                <span className="sheet-option">
                                  <span className="sheet-icon">{switchIcon('sheet', '', 16)} </span>
                                  <span className="sheet-name">{item}</span>
                                </span>
                              </Option>
                            ) : (
                              <Option value={item.docid} key={index}>
                                <div className="anyshare-filetree-row">
                                  <div className="anyshare-filetree-type">{switchIcon('file', item.name, 16)}</div>
                                  <div className="file-name">
                                    <span className="word" title={wrapperTitle(item.name)}>
                                      {item.name}
                                    </span>
                                  </div>
                                </div>
                              </Option>
                            );

                          return option;
                        })
                      : null}
                  </Select>
                </ConfigProvider>
              </div>
            )}

            <ShowTable
              selfKey={'modal'}
              viewType={viewType}
              preData={previewData}
              // 显示区域, 弹窗区'modal'或工作流区'work'
              area={'modal'}
            />
          </div>

          {preLoading ? (
            <div className="extract-pre-loading">
              <LoadingOutlined className="icon" />
            </div>
          ) : null}
        </div>

        {modalLoading ? (
          <div className="extract-modal-loading">
            <LoadingOutlined className="icon" />
          </div>
        ) : null}
      </div>
    </ScrollBar>
  );
};

export default forwardRef(ModalContent);
