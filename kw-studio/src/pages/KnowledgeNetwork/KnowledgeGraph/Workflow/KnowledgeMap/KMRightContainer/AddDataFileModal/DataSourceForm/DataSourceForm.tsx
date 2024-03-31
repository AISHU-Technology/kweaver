import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import './style.less';
import { Empty, Form, Input, message, Select, Button, Tooltip } from 'antd';
import type { FormInstance } from 'antd';
import intl from 'react-intl-universal';
import kongImg from '@/assets/images/kong.svg';
import { SOURCE_IMG_MAP } from '../assistant';
import { DS_SOURCE, DS_TYPE, EXTRACT_TYPE } from '@/enums';
import { DsSourceItem } from '@/components/SourceImportComponent/types';
import { useKnowledgeMapContext } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';
import servicesCreateEntity from '@/services/createEntity';
import { DataFileType } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/types';
import { FileTreeRefProps } from '@/components/SourceImportComponent/FileTree';
import IconFont from '@/components/IconFont';
import DataFileList from './DataFileList/DataFileList';
import DataFileDirList, { DataFileDirListRefProps } from './DataFileDirList/DataFileDirList';
import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';
import { FileTree } from '@/components/SourceImportComponent';
import FileIcon from '@/components/FileIcon';
import DataListItemDisabled from './DataListItemDisabled/DataListItemDisabled';
import Format from '@/components/Format';

export interface DataSourceFormProps {
  editData: DataFileType[]; // 编辑的数据
  modelDataFile: DataFileType[]; // 编辑的模型数据
  onSelectFile: (files: any[], ds: DsSourceItem, arData?: any) => void; // 数据文件选中的值变化事件
  onSelectDs?: (ds: DsSourceItem) => void; // 数据源选中的值变化事件
  onSelectModel?: (model: string) => void; // 模型的选中事件
  initialDataBoardStatus?: () => void;
  partitionData?: any[]; // 分区数据
  setSelectFileType?: (type: string) => void;
  errorMap?: any;
}

export type DataSourceFormRefProps = {
  form: FormInstance;
};

const FormItem = Form.Item;

/**
 * 在字段本身的onChange以及通过form.setFieldsValue设置值得时候，都需要去调用字段对应的props中值变化事件
 * @param props
 * @constructor
 */
const DataSourceForm = forwardRef<DataSourceFormRefProps, DataSourceFormProps>((props, ref) => {
  const {
    knowledgeMapStore: { graphId, selectedModel }
  } = useKnowledgeMapContext();
  const {
    editData,
    modelDataFile,
    onSelectFile,
    onSelectDs,
    onSelectModel,
    initialDataBoardStatus,
    partitionData,
    setSelectFileType,
    errorMap
  } = props;

  const prefixClsLocale = 'workflow.knowledgeMap';
  const prefixCls = 'data-source-form';
  const [dataSourceOptions, setDataSourceOptions] = useState<Record<string, DsSourceItem[]>>({}); // 数据源名字段下拉框的所有候选项
  const [modelData, setModelData] = useState<Record<string, string>>({});
  const [currentSelectedDS, setCurrentSelectedDS] = useState<DsSourceItem>({} as DsSourceItem); // 当前选中的数据源完整数据结构
  const [dataFileListProps, setDataFileListProps] = useState({
    loading: false, // 数据源列表的loading状态
    dataFileList: [] // 当前选中的数据源下的所有数据文件
  });

  const dataFileTreeListRef = useRef<FileTreeRefProps | null>(null);
  const dataFileModelTreeListRef = useRef<FileTreeRefProps | null>(null);
  const dataFileDirListRef = useRef<DataFileDirListRefProps | null>(null);
  const [form] = Form.useForm();

  useImperativeHandle(ref, () => ({
    form
  }));

  const formItemDisabled = useMemo(() => {
    return editData.length > 0 && editData[0].extract_type !== EXTRACT_TYPE.MODEL;
  }, [editData]);

  const disabledTreeNodeKeys = useMemo(() => {
    const keys: string[] = [];
    editData.forEach(item => {
      item.files.forEach(file => {
        keys.push(file.file_source);
      });
    });
    return keys;
  }, [editData]);

  useEffect(() => {
    graphId && getDataSourceOptions();
  }, [graphId]);

  useEffect(() => {
    if (selectedModel.length > 0) {
      fetchModel();
    }
  }, [selectedModel]);

  /**
   * 监听选中的数据源去获取右侧面板的预览数据以及数据列表
   */
  useEffect(() => {
    if (currentSelectedDS?.id) {
      if (
        [DS_SOURCE.mysql, DS_SOURCE.hive, DS_SOURCE.clickhouse, DS_SOURCE.AnyRobot].includes(
          currentSelectedDS?.data_source
        ) &&
        editData.length === 0
      ) {
        getDataFileListByDataSource(currentSelectedDS);
      }
    }
  }, [currentSelectedDS, editData]);

  useDeepCompareEffect(() => {
    if (editData.length > 0 && Object.keys(dataSourceOptions).length > 0) {
      initialByEditData();
    }
  }, [editData, dataSourceOptions]);

  /**
   * 编辑时：通过编辑数据来初始化添加数据文件的弹框
   */
  const initialByEditData = () => {
    const selectedDS = dataSourceOptions[editData[0].extract_type].find(ds => ds.id === editData[0].ds_id)!;
    // 模型抽取
    if (editData[0].extract_type === EXTRACT_TYPE.MODEL) {
      // 编辑时，默认先用数据第一项
      initialModelByEditData(editData[0]);
      return;
    }
    let file: any = editData[0].files[0].file_name;
    // 对 RabbitMQ数据库 单独处理
    if ([DS_SOURCE.mq].includes(selectedDS.data_source)) {
      form.setFieldsValue({
        extract_type: editData[0].extract_type,
        ds_id: editData[0].ds_id,
        queue: file
      });
    } else {
      if ([DS_SOURCE.as].includes(selectedDS.data_source)) {
        if (selectedDS.dataType === DS_TYPE.STRUCTURED) {
          file = {
            label: file,
            key: editData[0].files[0].file_source,
            type: 'file'
          };
        }
      }
      form.setFieldsValue({
        extract_type: editData[0].extract_type,
        ds_id: editData[0].ds_id,
        file
      });
      onSelectFile([file], selectedDS);
    }
    setCurrentSelectedDS(selectedDS);
    onSelectDs?.(selectedDS);
  };

  /**
   * 初始化模型数据
   * @param data
   */
  const initialModelByEditData = (data: DataFileType) => {
    const selectedDS = dataSourceOptions[data.extract_type].find(ds => ds.id === data.ds_id)!;
    const files: any = data.files.map(item =>
      JSON.stringify({
        docid: item.file_source,
        name: item.file_name,
        path: item.file_path,
        type: item.file_type
      })
    );
    const model = data.extract_model!;
    form.setFieldsValue({
      model_name: model,
      ds_id: data.ds_id,
      extract_type: data.extract_type,
      file: files
    });
    setCurrentSelectedDS(selectedDS);
    onSelectModel?.(model);
    onSelectDs?.(selectedDS);
    // setTimeout(() => {
    //   onSelectFile(files, selectedDS);
    // }, 0);
  };

  /**
   * 通过选中的数据源去获取数据源下所有的数据表
   */
  const getDataFileListByDataSource = async (selectedDS: DsSourceItem) => {
    const postfix = '';
    setDataFileListProps(prevState => ({ ...prevState, loading: true }));
    const param = {
      ds_id: selectedDS.id,
      data_source: selectedDS?.data_source,
      postfix
    };
    const { res } = (await servicesCreateEntity.getDataList(param)) || {};
    const dataFileList = res?.output ?? [];

    // 如果选中的表在刷新后不存在，则恢复初始状态，否则继续保留刷新前的选中状态
    const selectedDataFile = form.getFieldValue('file');
    const target = dataFileList.some((item: any) => item === selectedDataFile);
    if (!target) {
      initialDataFileListStatus();
    }

    setDataFileListProps(prevState => ({
      ...prevState,
      dataFileList,
      loading: false
    }));
  };

  /**
   * 初始数据文件和右侧数据展示面板的列表状态
   */
  const initialDataFileListStatus = () => {
    initialDataBoardStatus?.();
    // 清除数据面板的数据以及数据文件字段的选中状态
    form.setFieldsValue({ file: '' });
  };

  /**
   * 获取模型下拉框的候选项
   */
  const fetchModel = async () => {
    const res = await servicesCreateEntity.fetchModelList();
    if (res && res.res) {
      setModelData(res.res);
    }
  };

  /**
   * 获取数据源名的Options,以及抽取方式
   */
  const getDataSourceOptions = async () => {
    const data = await servicesCreateEntity.getFlowSource({ id: graphId, type: 'unfilter' });
    if (data) {
      const { res, Description } = data;
      if (res) {
        const dataSourceRes = (res?.df ?? []).reduce((target: Record<string, DsSourceItem[]>, item: DsSourceItem) => {
          if (target[item.extract_type]) {
            target[item.extract_type].push(item);
          } else {
            target[item.extract_type] = [item];
          }
          return target;
        }, {} as Record<string, DsSourceItem[]>);
        setDataSourceOptions(dataSourceRes);
        if (editData.length === 0) {
          // 非编辑模式默认选中第一个
          let defaultSelectedExtractType = EXTRACT_TYPE.STANDARD;
          const model = selectedModel[0];
          if (!dataSourceRes[defaultSelectedExtractType]) {
            defaultSelectedExtractType = EXTRACT_TYPE.LABEL;
          }
          if (model) {
            // 说明是模型抽取
            defaultSelectedExtractType = EXTRACT_TYPE.MODEL;
            form.setFieldsValue({ model_name: model });
            onSelectModel?.(model);
          }
          if (dataSourceRes[defaultSelectedExtractType]) {
            const defaultSelectedDS = dataSourceRes[defaultSelectedExtractType][0];
            form.setFieldsValue({ ds_id: defaultSelectedDS?.id, extract_type: defaultSelectedExtractType });
            setCurrentSelectedDS(defaultSelectedDS);
            onSelectDs?.(defaultSelectedDS);
          }
        }
      } else {
        message.error({
          content: Description,
          className: 'custom-class',
          style: {
            padding: 0
          }
        });
      }
    }
  };

  /**
   * 刷新数据文件列表
   */
  const refreshDataFileList = () => {
    if (currentSelectedDS?.id) {
      getDataFileListByDataSource(currentSelectedDS);
    }
  };

  /**
   * 渲染数据文件的FormItem
   */
  const renderDataFileFormItem = () => {
    let editFileName = '';
    if (editData.length > 0) {
      editFileName = editData[0].files[0].file_name;
    }
    // as 结构化
    if (currentSelectedDS?.data_source === DS_SOURCE.as && currentSelectedDS?.dataType === DS_TYPE.STRUCTURED) {
      return (
        <FormItem
          name="file"
          className={`kw-mb-0 ${prefixCls}-list`}
          label={
            <div className="kw-space-between kw-w-100">
              <span>{intl.get('workflow.knowledgeMap.asStructuredLabel')}</span>
              {!formItemDisabled && (
                <Tooltip title={intl.get(`${prefixClsLocale}.refresh`)} placement="top">
                  <Format.Button
                    style={{ padding: 0, minWidth: 'unset', height: 'unset' }}
                    type="icon"
                    onClick={() => dataFileDirListRef.current?.refreshData()}
                  >
                    <IconFont type="icon-tongyishuaxin" />
                  </Format.Button>
                </Tooltip>
              )}
            </div>
          }
        >
          {editData.length > 0 ? (
            <DataListItemDisabled name={editFileName!} />
          ) : (
            <DataFileDirList
              onChange={file => {
                onSelectFile([file], currentSelectedDS);
              }}
              ref={dataFileDirListRef}
              selectedDataSource={currentSelectedDS}
              setSelectFileType={setSelectFileType}
              errors={errorMap}
            />
          )}
        </FormItem>
      );
    }

    // as 非结构化（模型抽取）
    const isModelExtract = form.getFieldValue('extract_type') === EXTRACT_TYPE.MODEL;
    if (isModelExtract) {
      return (
        <FormItem
          name="file"
          className={`kw-mb-0 ${prefixCls}-list`}
          label={
            <div className="kw-space-between kw-w-100">
              <span>{intl.get('workflow.information.tables')}</span>
              <Tooltip title={intl.get(`${prefixClsLocale}.refresh`)} placement="top">
                <Format.Button
                  style={{ padding: 0, minWidth: 'unset', height: 'unset' }}
                  type="icon"
                  onClick={() => {
                    dataFileModelTreeListRef.current?.refreshData();
                  }}
                >
                  <IconFont type="icon-tongyishuaxin" />
                </Format.Button>
              </Tooltip>
            </div>
          }
          valuePropName={'checkedKeys'}
        >
          <FileTree
            ref={dataFileModelTreeListRef}
            className="kw-border-form-item"
            source={currentSelectedDS} // 选中的数据源
            errors={{}} // 文件是否有错误， {文件id: 错误信息}的形式，用于文件尾部显示错误图标
            onChange={checkedKeys => {
              onSelectFile(checkedKeys, currentSelectedDS);
            }}
            disabledNodeKeys={disabledTreeNodeKeys}
          />
        </FormItem>
      );
    }

    // SQLserver、KingbaseES、postgreSQL
    if ([DS_SOURCE.sqlserver, DS_SOURCE.kingbasees, DS_SOURCE.postgresql].includes(currentSelectedDS?.data_source)) {
      if (editData.length > 0) {
        editFileName = editData[0].files[0].file_name.split('/').slice(-1)[0];
      }
      return (
        <FormItem
          name="file"
          className={`kw-mb-0 ${prefixCls}-list`}
          label={
            <div className="kw-space-between kw-w-100">
              <span>{intl.get('workflow.knowledgeMap.asStructuredLabel')}</span>
              {editData.length === 0 && (
                <Tooltip title={intl.get(`${prefixClsLocale}.refresh`)} placement="top">
                  <Format.Button
                    style={{ padding: 0, minWidth: 'unset', height: 'unset' }}
                    type="icon"
                    onClick={() => {
                      dataFileTreeListRef.current?.refreshData();
                    }}
                  >
                    <IconFont type="icon-tongyishuaxin" />
                  </Format.Button>
                </Tooltip>
              )}
            </div>
          }
          valuePropName={'selectedKey'}
          trigger={'onRowClick'}
        >
          {editData.length > 0 ? (
            <DataListItemDisabled name={editFileName!} />
          ) : (
            <FileTree
              ref={dataFileTreeListRef}
              className="kw-border-form-item"
              source={currentSelectedDS} // 选中的数据源
              errors={{}} // 文件是否有错误， {文件id: 错误信息}的形式，用于文件尾部显示错误图标
              multiple={false}
              onRowClick={file => {
                onSelectFile([file], currentSelectedDS);
              }}
            />
          )}
        </FormItem>
      );
    }

    // mysql  hive AnyRobot
    if (
      [DS_SOURCE.mysql, DS_SOURCE.hive, DS_SOURCE.clickhouse, DS_SOURCE.AnyRobot].includes(
        currentSelectedDS.data_source
      )
    ) {
      return (
        <FormItem
          name="file"
          className={`kw-mb-0 ${prefixCls}-list`}
          label={
            <div className="kw-space-between kw-w-100">
              <span>{intl.get('workflow.knowledgeMap.asStructuredLabel')}</span>
              {!formItemDisabled && (
                <Tooltip title={intl.get(`${prefixClsLocale}.refresh`)} placement="top">
                  <Format.Button type="icon" className="kw-text-btn" onClick={refreshDataFileList}>
                    <IconFont type="icon-tongyishuaxin" />
                  </Format.Button>
                </Tooltip>
              )}
            </div>
          }
        >
          {editData.length > 0 ? (
            <DataListItemDisabled name={editFileName!} selectedDS={currentSelectedDS} />
          ) : (
            <DataFileList
              onChange={(file: string | string[], arData?: any) => {
                onSelectFile([file], currentSelectedDS, arData);
              }}
              loading={dataFileListProps.loading}
              dataSource={dataFileListProps.dataFileList}
              partitionData={partitionData}
              selectedDS={currentSelectedDS}
              errors={errorMap}
            />
          )}
        </FormItem>
      );
    }
  };

  const modelOptions = useMemo(() => {
    return Object.keys(modelData).map(modelKey => ({ label: modelData[modelKey], value: modelKey }));
  }, [modelData]);

  const extractTypeOptions = useMemo(() => {
    let sourceData = [
      {
        label: intl.get('workflow.information.standardExtraction'),
        value: EXTRACT_TYPE.STANDARD,
        disabled: !dataSourceOptions.standardExtraction
      },
      {
        label: intl.get('workflow.information.labelExtraction'),
        value: EXTRACT_TYPE.LABEL,
        // disabled: !dataSourceOptions.labelExtraction,
        disabled: true
      },
      {
        label: intl.get('workflow.information.modelExtraction'),
        value: EXTRACT_TYPE.MODEL,
        disabled: !dataSourceOptions.modelExtraction
      }
    ];
    const model = selectedModel[0];
    if (!model) {
      if (currentSelectedDS.data_source === DS_SOURCE.as && currentSelectedDS.dataType === DS_TYPE.STRUCTURED) {
        sourceData = sourceData.filter(item => item.value !== EXTRACT_TYPE.MODEL);
      } else {
        sourceData = sourceData.filter(item => item.value === EXTRACT_TYPE.STANDARD);
      }
    } else {
      sourceData = sourceData.filter(item => item.value === EXTRACT_TYPE.MODEL);
    }
    return sourceData;
  }, [dataSourceOptions, selectedModel, currentSelectedDS]);

  return (
    <Form
      className={`${prefixCls} kw-h-100 kw-pl-6 kw-pr-6 kw-pt-5 kw-pb-5 kw-border-r kw-flex-column`}
      form={form}
      layout="vertical"
    >
      <FormItem className="kw-mb-4" name="extract_type" label={intl.get('workflow.information.extrMethod')}>
        <Select
          options={extractTypeOptions}
          onChange={value => {
            const selectedDS = dataSourceOptions[value] && dataSourceOptions[value][0];
            form.setFieldsValue({ ds_id: selectedDS?.id });
            setCurrentSelectedDS(selectedDS);
            initialDataFileListStatus();
            onSelectDs?.(selectedDS);
          }}
          disabled={form.getFieldValue('extract_type') === EXTRACT_TYPE.MODEL || formItemDisabled}
        />
      </FormItem>
      <FormItem
        noStyle
        shouldUpdate={(prevValues, currentValues) => prevValues.extract_type !== currentValues.extract_type}
      >
        {({ getFieldValue }) =>
          getFieldValue('extract_type') === EXTRACT_TYPE.MODEL && (
            <FormItem name="model_name" className="kw-mb-4" label={intl.get('workflow.information.selectModel')}>
              <Select
                onChange={value => {
                  onSelectModel?.(value);
                }}
                options={modelOptions}
                disabled
              />
            </FormItem>
          )
        }
      </FormItem>
      <FormItem
        noStyle
        shouldUpdate={(prevValues, currentValues) => prevValues.extract_type !== currentValues.extract_type}
      >
        {({ getFieldValue }) => (
          <FormItem className="kw-mb-4" name="ds_id" label={intl.get('workflow.information.dataName')}>
            <Select
              getPopupContainer={triggerNode => triggerNode.parentElement}
              notFoundContent={<Empty image={kongImg} description={intl.get('global.noData')} />}
              onChange={value => {
                const selectedDS = dataSourceOptions[getFieldValue('extract_type')].find(ds => ds.id === value);
                setCurrentSelectedDS(selectedDS!);
                onSelectDs?.(selectedDS!);
                if (getFieldValue('extract_type') === EXTRACT_TYPE.MODEL) {
                  // 对于模型抽取，编辑的时候要给选中的数据源下面的文件赋checkbox的值,该数据由editData与modelDataFile共同组成
                  const target = modelDataFile.find(item => item.ds_id === value);
                  const targetEditData = editData.find(item => item.ds_id === value);
                  let files: any = [];
                  if (target) {
                    const selectedFiles = target.files.map(item =>
                      JSON.stringify({
                        docid: item.file_source,
                        name: item.file_name,
                        path: item.file_path,
                        type: item.file_type
                      })
                    );
                    files = [...files, ...selectedFiles];
                  }
                  if (targetEditData) {
                    const selectedFiles = targetEditData.files.map(item =>
                      JSON.stringify({
                        docid: item.file_source,
                        name: item.file_name,
                        path: item.file_path,
                        type: item.file_type
                      })
                    );
                    files = [...files, ...selectedFiles];
                  }
                  form.setFieldsValue({
                    file: files
                  });
                  dataFileDirListRef.current?.refreshData();
                } else {
                  initialDataFileListStatus();
                }
              }}
              disabled={formItemDisabled}
            >
              {dataSourceOptions[getFieldValue('extract_type')]?.map((dsItem: any) => (
                <Select.Option key={dsItem.id} value={dsItem.id} label={dsItem.dsname}>
                  <div className="kw-flex">
                    <span className="kw-mr-2 kw-align-center">
                      <img className="source-icon" src={SOURCE_IMG_MAP[dsItem.data_source]} alt="KWeaver" />
                    </span>
                    <div className="kw-flex-item-full-width">
                      <div className="kw-c-header kw-ellipsis" title={dsItem.dsname}>
                        {dsItem.dsname}
                      </div>
                      <div className="kw-c-subtext kw-ellipsis">{dsItem.ds_path || '--'}</div>
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </FormItem>
        )}
      </FormItem>
      {[DS_SOURCE.mq].includes(currentSelectedDS?.data_source) ? (
        <FormItem
          initialValue={currentSelectedDS.queue}
          name="queue"
          className="kw-mb-4"
          label={intl.get(`${prefixClsLocale}.queueName`)}
        >
          <Input disabled />
        </FormItem>
      ) : (
        renderDataFileFormItem()
      )}
    </Form>
  );
});

export default DataSourceForm;
