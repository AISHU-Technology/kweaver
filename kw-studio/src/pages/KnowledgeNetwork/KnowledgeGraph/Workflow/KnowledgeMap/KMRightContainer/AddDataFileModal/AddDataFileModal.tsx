/* eslint-disable max-lines */

import React, { useState, useRef, useReducer, useEffect } from 'react';
import { message, Modal } from 'antd';
import { SplitBox } from '@antv/x6-react-components';
import intl from 'react-intl-universal';
import TemplateModal from '@/components/TemplateModal';
import './style.less';
import { useKnowledgeMapContext } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';
import { DsSourceItem } from '@/components/SourceImportComponent/types';
import servicesCreateEntity from '@/services/createEntity';

import DataBoard, { DataBoardProps, DataBoardType } from './DataBoard/DataBoard';

import { DS_SOURCE, DS_TYPE, EXTRACT_TYPE } from '@/enums';
import { FileTree, parseModelGraph, parseSpo, parseToTable } from '@/components/SourceImportComponent';
import {
  convertToRules,
  convertToRulesForModel
} from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/assistant';
import { getPostfix } from '@/utils/handleFunction';
import {
  DataFileType,
  FileType,
  G6EdgeData,
  G6NodeData
} from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/types';
import _ from 'lodash';
import DataSourceForm, { DataSourceFormRefProps } from './DataSourceForm/DataSourceForm';
import TipModal from '@/components/TipModal';

export interface AddDataFileModalProps {
  onCancel: () => void;
  editData: DataFileType[]; // 编辑的数据
  isAutoMapPropsSignRef: React.MutableRefObject<boolean>; // 是否进行自动属性映射标识
  x6ContainerRef?: React.MutableRefObject<any>;
  defaultParsingRule: any; // 流程三设置的默认解析规则
  parsingSet: any; // 选择的文件的解析规则
  setParsingSet: (data: any) => void;
  setSelectFileType: (data: any) => void;
  selectFileType: any; // 选择的文件类型 csv | json
  parsingTreeChange: any; // 快速选择文件时，实时保存的解析规则数据
  setParsingTreeChange: (data: any) => void;
  currentParse: any;
  setCurrentParse: (data: any) => void;
  arFileSave: any;
  setArFileSave: (data: any) => void;
}

export type ExtractRuleProps = {
  is_model: 'from_model' | 'not_model' | string; // 是否是模型
  entity_type: string; // 抽取对象
  property: {
    property_field: string; // 抽取对象属性名(去除特殊字符)
    column_name: string; // 抽取对象属性原始名称, 用于显示
    property_func: string; // 抽取规则, 目前仅 'All'
  };
};

export type ParsingTypeProps = {
  delimiter: string;
  quotechar: string;
  escapechar: string;
};

const initState = {
  delimiter: ',',
  quotechar: '"',
  escapechar: '"'
};

const reducer = (state: ParsingTypeProps, action: Partial<ParsingTypeProps>) => ({ ...state, ...action });

/**
 * 添加数据文件的弹框
 * @param props
 * @constructor
 */
const AddDataFileModal: React.FC<AddDataFileModalProps> = props => {
  const prefixClsLocale = 'workflow.knowledgeMap';
  const {
    onCancel,
    editData,
    isAutoMapPropsSignRef,
    x6ContainerRef,
    defaultParsingRule,
    parsingSet,
    setParsingSet,
    selectFileType,
    setSelectFileType,
    parsingTreeChange,
    setParsingTreeChange,
    currentParse,
    setCurrentParse,
    arFileSave,
    setArFileSave
  } = props;
  const {
    knowledgeMapStore: { graphId, graphKMap, selectedG6Edge, selectedG6Node, graphG6Data, selectedModel },
    setKnowledgeMapStore
  } = useKnowledgeMapContext();
  const [tipsModalVisible, setTipsModalVisible] = useState<boolean>(false);
  const [dataBoardProps, setDataBoardProps] = useState<DataBoardProps>({
    loading: false,
    data: {},
    error: '',
    type: 'table',
    tableHeaderCheckedKey: [],
    dataFile: {},
    file: {},
    partitionData: {} // 分区数据 (key就是分区字段，value就是分区变量)
  });
  const [parsingChange, setParsingChange] = useState({ delimiter: '', quotechar: '', escapechar: '' }); // 解析规则(某一文件具体)
  const [requestId, setRequestId] = useState(0); // 请求次数
  const requestIdRef = useRef<any>({ id: 0 });
  const [parsingState, dispatchState] = useReducer(reducer, initState); // 文件解析规则
  const selectedDataFile = useRef<any>(null); // 记录选中的数据文件的完整信息
  const allExtractRuleForSelectedDataFile = useRef<ExtractRuleProps[]>([]);
  const dataSourceFormRef = useRef<DataSourceFormRefProps | null>(null); // Form 表单实例
  const currentSelectedDS = useRef<DsSourceItem>(); // 当前选中的数据源
  const resetExtractRule = useRef<boolean>(false);
  const changeExtractRule = useRef<boolean>(false);
  const errorMap = useRef<any>({ errors: {} });
  const arDataRef = useRef<any>();

  const [modelDataFile, setModelDataFile] = useState<DataFileType[]>([]); // 储存模型关联的数据文件

  // useEffect(() => {
  //   if (editData.length > 0 && editData[0].extract_type === EXTRACT_TYPE.MODEL) {
  //     // setModelDataFile([...editData]);
  //   }
  // }, []);

  /**
   * 获取通过选中的数据源
   * @param selectedDS
   */
  const getRabbitMQBoardDataByDataSource = async (selectedDS: DsSourceItem) => {
    setDataBoardProps(prevState => ({ ...prevState, loading: true }));
    const { rules, error }: any = await getExtractRule(selectedDS.queue, '', selectedDS);
    allExtractRuleForSelectedDataFile.current = rules;
    let tableHeaderCheckedKey = allExtractRuleForSelectedDataFile.current.map(item => item.property.property_field);
    // 编辑数据的时候，使用正在编辑数据文件身上的抽取规则
    if (editData.length > 0) {
      tableHeaderCheckedKey = editData[0].extract_rules[0].property.map(item => item.property_field);
    }

    setDataBoardProps(prevState => ({
      ...prevState,
      loading: false,
      data: selectedDS.json_schema,
      error,
      type: 'json',
      tableHeaderCheckedKey
    }));
  };

  /**
   * 获取board数据通过选中的数据源和模型
   */
  const getBoardDataByModel = async (model: string) => {
    setDataBoardProps(prevState => ({ ...prevState, loading: true }));

    let graphData: any = { nodes: [], edges: [] };
    let tableData: any = [];
    let error = '';
    const modelGraphData = (await servicesCreateEntity.unstructuredData({ model, file_list: [] })) || {};
    if (modelGraphData.res) {
      graphData = parseModelGraph(modelGraphData.res);
    }
    if (modelGraphData.Description) {
      error = modelGraphData.Description;
    }
    const { res, Description } = (await servicesCreateEntity.getModelPreview(model)) || {};
    if (Description) {
      error = Description;
    }
    if (res) {
      tableData = parseSpo(res.modelspo);
    }

    setDataBoardProps(prevState => ({
      ...prevState,
      loading: false,
      data: {
        tableData,
        graphData
      },
      error,
      type: 'canvas'
    }));
  };

  /**
   * 对于mysql,hive, as结构化，SQLserver、KingbaseES、postgreSQL  这种类型的数据。通过文件直接获取数据
   * @param file
   */
  const getBoardDataBySelectedDataFile = async (
    file: any,
    postfix = '',
    dataSource: DsSourceItem,
    asFileName = '',
    parsing?: any,
    isUpdate?: any,
    isRun?: any, // 避免函数还未运行完，就再次调用
    arData?: any
    // eslint-disable-next-line max-params
  ) => {
    setDataBoardProps(prevState => ({ ...prevState, loading: true }));

    const dataFile: any = {
      file_name: dataSource.data_source === 'AnyRobot' ? arDataRef?.current?.name : asFileName || file,
      partition_usage: false,
      partition_infos: {}, // 分区信息
      data_source: dataSource.data_source,
      extract_type: dataSource.extract_type,
      ds_id: dataSource.id
    };

    const dataResult: any = await getDataByFile(file, dataSource, parsing, isUpdate);
    if (dataResult.error || dataResult.tables.length === 0) {
      setDataBoardProps(prevState => ({
        ...prevState,
        loading: false,
        error: dataResult.error,
        data: dataResult.tables,
        dataFile,
        type: 'table'
      }));
      return dataResult.error;
    }

    const ruleResult: any = await getExtractRule(file, postfix, dataSource, parsing, arData);
    if (ruleResult.error) {
      setDataBoardProps(prevState => ({
        ...prevState,
        loading: false,
        error: ruleResult.error,
        dataFile,
        type: 'table'
      }));
      return ruleResult.error;
    }
    allExtractRuleForSelectedDataFile.current = ruleResult.rules; // 储存接口返回的所有的抽取规则
    let tableHeaderCheckedKey = allExtractRuleForSelectedDataFile.current.map(item => item.property.property_field);
    // if (resetExtractRule.current) {
    if (isRun) {
      // 编辑进入，但未更改解析规则时
      if (editData.length > 0 && !changeExtractRule.current) {
        const oldRuleFiled = editData[0].extract_rules[0].property.map(item => item.property_field);
        tableHeaderCheckedKey = tableHeaderCheckedKey.filter((key: any) => oldRuleFiled.includes(key));
      }
    } else {
      tableHeaderCheckedKey = tableHeaderCheckedKey.filter((key: any) =>
        dataBoardProps.tableHeaderCheckedKey!.includes(key)
      );
    }

    // resetExtractRule.current = false;
    changeExtractRule.current = false;
    const partitionData: any = {};
    if (dataSource.data_source === DS_SOURCE.hive) {
      if (editData.length > 0) {
        dataFile.partition_usage = editData[0].partition_usage!; // 是否开启分区
        dataFile.partition_infos = editData[0].partition_infos!; // 分区信息
        if (editData[0].partition_usage!) {
          partitionData.isOpen = editData[0].partition_usage!;
          partitionData.table_name = file;
          partitionData.value = editData[0].partition_infos!;
        }
      }
    }
    setDataBoardProps(prevState => ({
      ...prevState,
      loading: false,
      data: dataResult.tables,
      error: dataResult.error || ruleResult.error,
      type: 'table',
      // tableHeaderCheckedKey: Array.from(new Set([...prevState.tableHeaderCheckedKey!, ...tableHeaderCheckedKey])),
      tableHeaderCheckedKey,
      dataFile,
      partitionData
    }));
  };

  /**
   * 获取样本数据
   * @param file
   */
  const getDataByFile = (file: any, dataSource: any, parsing?: any, isUpdate?: any, arData?: any) => {
    if (isUpdate) {
      // 编辑进入时 不是编辑时
      if (_.isEmpty(editData)) {
        const { delimiter, quotechar, escapechar } = defaultParsingRule;
        const filterData = _.filter(_.cloneDeep(parsingTreeChange), (item: any) => item?.key === file);
        dispatchState(_.isEmpty(filterData) ? { delimiter, quotechar, escapechar } : { ...filterData?.[0]?.parsing });
      } else {
        // 不为空 和升级上来的数据没有解析规则
        const isParsing = editData[0]?.files?.[0]?.delimiter;
        if (isParsing) {
          const { delimiter, quotechar, escapechar } = editData[0]?.files?.[0];
          dispatchState({ delimiter, quotechar, escapechar });
        } else {
          const { delimiter, quotechar, escapechar } = defaultParsingRule;
          dispatchState({ delimiter, quotechar, escapechar });
        }
      }
    }

    const form = dataSourceFormRef.current?.form;
    const formValues = form?.getFieldsValue();
    return new Promise(resolve => {
      let params: any = {};
      params = {
        id: String(formValues.ds_id),
        data_source: dataSource.data_source,
        name: file
      };
      if (
        ['as', 'as7'].includes(dataSource?.data_source) &&
        dataSource?.dataType === 'structured' &&
        selectFileType === 'csv' &&
        String(selectedDataFile?.current[0]?.label?.split('.')?.[1]) === 'csv'
      ) {
        const parseRules = parsing?.[0]?.parsing;
        params = {
          ...params,
          delimiter: parseRules?.delimiter,
          quotechar: parseRules?.quotechar,
          escapechar: parseRules?.escapechar,
          request_id: String(requestIdRef?.current?.id)
        };
      }

      if (dataSource?.data_source === 'AnyRobot') {
        params = onReduceAccordToName(params, arData);
      }
      servicesCreateEntity.getOtherPreData(params).then(({ res, ErrorCode, ErrorDetails }) => {
        let tables: any = [];
        let error = '';
        let newErrorMap: any = {};
        if (
          ['as', 'as7'].includes(dataSource?.data_source) &&
          dataSource?.dataType === 'structured' &&
          selectFileType === 'csv' &&
          String(selectedDataFile?.current[0]?.label?.split('.')?.[1]) === 'csv' &&
          res &&
          String(requestIdRef?.current?.id) === res?.request_id
        ) {
          tables = parseToTable(res);
          newErrorMap = onErrorHandle(file);
        } else if (res) {
          if (dataSource?.data_source === 'AnyRobot' && params?.start_time) {
            onErrorHandle(arDataRef?.current?.name);
          } else {
            onErrorHandle(file);
          }
          tables = parseToTable(res);
        }

        if (ErrorCode) {
          newErrorMap = { ...errorMap?.current?.errors, [arDataRef?.current?.name || file]: ErrorDetails };
          // newErrorMap = { ...errorMap?.current?.errors, [file]: ErrorDetails };
          errorMap.current.errors = newErrorMap;
          error = ErrorDetails;
          if (
            !['as', 'as7'].includes(dataSource?.data_source) &&
            dataSource?.dataType !== 'structured' &&
            selectFileType !== 'csv' &&
            String(selectedDataFile?.current[0]?.label?.split('.')?.[1]) !== 'csv'
          ) {
            ErrorDetails &&
              message.error({
                content: ErrorDetails,
                className: 'custom-class',
                style: {
                  padding: 0
                }
              });
          }
        }
        // errorMap.current.errors = newErrorMap;
        resolve({ tables, error });
      });
    });
  };

  /**
   * 错误处理
   */
  const onErrorHandle = (file: any) => {
    let newErrorMap: any = {};
    const cloneErrorMap = _.cloneDeep(errorMap?.current?.errors);
    let filterData: any = {};
    _.filter(cloneErrorMap, (item: any, index: any) => {
      if (index !== file) {
        filterData = { ...filterData, [index]: item };
      }
    });
    newErrorMap = _.isEmpty(filterData) ? {} : filterData;
    errorMap.current.errors = newErrorMap;
    return newErrorMap;
  };

  /**
   * 类型为AnyRobot，以文件名为key进行reduce
   */
  const onReduceAccordToName = (params: any, data: any, type?: any) => {
    const isExit = arFileSave[arDataRef.current?.name];
    let newParams: any = {};
    // 存在返回之前的
    if (!_.isEmpty(editData) && _.isEmpty(isExit)) {
      if (type === 'extract') {
        newParams = {
          ...params,
          start_time: Number(editData[0]?.files?.[0]?.start_time),
          end_time: Number(editData[0]?.files?.[0]?.end_time),
          view_name: editData[0]?.files?.[0]?.file_name,
          file: editData[0]?.files?.[0]?.file_source
        };
      } else {
        newParams = {
          ...params,
          start_time: Number(editData[0]?.files?.[0]?.start_time),
          end_time: Number(editData[0]?.files?.[0]?.end_time),
          name: editData[0]?.files?.[0]?.file_source
        };
        onHandleFormat();
      }
    } else {
      if (type === 'extract') {
        if (!_.isEmpty(arFileSave[arDataRef.current?.name]) && !arFileSave[arDataRef.current?.name]?.start_time) {
          newParams = { ...params, view_name: arDataRef.current?.name, file: arDataRef.current?.id };
        } else {
          newParams = {
            ...params,
            start_time: Number(arFileSave[arDataRef.current?.name]?.start_time),
            end_time: Number(arFileSave[arDataRef.current?.name]?.end_time),
            view_name: arDataRef.current?.name,
            file: arDataRef.current?.id
          };
        }
      } else {
        if (!_.isEmpty(arFileSave[arDataRef.current?.name])) {
          if (arFileSave[arDataRef.current?.name]?.start_time) {
            newParams = { ...params, ...arFileSave[arDataRef.current?.name] };
          } else {
            newParams = { ...params, name: arDataRef.current?.id };
          }
        } else {
          newParams = { ...params, name: arDataRef.current?.id };
          onAddTime(params, arFileSave, data);
        }
      }
    }
    return newParams;
  };

  /**
   * 添加时间
   */
  const onAddTime = (params: any, arFileSave: any, data: any) => {
    const cloneParams = _.cloneDeep(params);
    cloneParams.start_time = 0;
    cloneParams.end_time = 0;
    arFileSave[arDataRef.current.name] = cloneParams;
    if (!arFileSave[arDataRef.current.name]) {
      arFileSave[arDataRef.current.name] = cloneParams;
      setArFileSave(arFileSave);
    }
  };

  const onHandleFormat = () => {
    const filesEdit = editData[0]?.files;
    const reduceData = _.reduce(
      _.cloneDeep(filesEdit),
      (pre: any, key: any) => {
        pre[key.file_name] = {
          name: key.file_source,
          data_source: 'AnyRobot',
          start_time: Number(key.start_time) || 0,
          end_time: Number(key.end_time) || 0
        };
        return pre;
      },
      {}
    );
    setArFileSave(reduceData);
  };

  /**
   * 预览数据表解析规则传参处理
   */
  const onDataFileSelect = (files: any[], ds: DsSourceItem, arData?: any) => {
    const cloneData = _.cloneDeep(parsingTreeChange);
    const { delimiter, quotechar, escapechar } = defaultParsingRule;
    if (['as7', 'as'].includes(ds.data_source) && ds?.dataType === 'structured' && selectFileType === 'csv') {
      const clickFileParse = _.filter(cloneData, (item: any) => {
        return item?.key === files?.[0]?.key;
      });
      if (_.isEmpty(clickFileParse)) {
        onPreviewParamHandle(files, ds, [{ key: files?.[0]?.key, parsing: { delimiter, quotechar, escapechar } }]);
      } else {
        onPreviewParamHandle(files, ds, [...clickFileParse]);
      }
    } else if (ds.data_source === 'AnyRobot') {
      onPreviewParamHandle(files, ds, [], arData);
    } else {
      onPreviewParamHandle(files, ds);
    }
  };

  /**
   * 获取抽取规则
   * @param file
   * @param postfix 文件后缀名
   */
  const getExtractRule = (file: string, postfix = '', dataSource: DsSourceItem, parsing?: any, arData?: any) => {
    return new Promise(resolve => {
      const form = dataSourceFormRef.current?.form;
      const formValues = form?.getFieldsValue();
      const selectFileParsing = _.filter(
        _.isEmpty(parsing) ? parsingTreeChange : parsing,
        (item: any) => item?.key === file
      );
      const newSelectFileParsing = _.isEmpty(selectFileParsing) ? [{ parsing: defaultParsingRule }] : selectFileParsing;
      let params: any = {
        graph_id: graphId,
        ds_id: String(formValues?.ds_id),
        data_source: dataSource?.data_source,
        file,
        extract_type: formValues?.extract_type,
        postfix
      };
      if (postfix === 'csv') {
        params = { ...params, ...newSelectFileParsing?.[0]?.parsing };
      }
      if (dataSource.data_source === 'AnyRobot') {
        params = onReduceAccordToName(params, arData, 'extract');
      }

      servicesCreateEntity.submitExtractTask(params).then(({ res, Description }) => {
        let rules: any = [];
        let error = '';
        if (res) {
          rules = convertToRules(
            res,
            dataSource.data_source === 'AnyRobot' ? arDataRef?.current?.name : file,
            formValues.extract_type
          );
          // rules = convertToRules(res, file, formValues.extract_type);
        } else {
          error = Description;
          Description &&
            message.error({
              content: Description,
              className: 'custom-class',
              style: {
                padding: 0
              }
            });
        }
        resolve({ rules, error });
      });
    });
  };

  //  ------------------ 各种类型数据库获取右侧预览数据的方法结束 ------------------

  /**
   * 表头值变化事件变化事件
   * @param extractRules
   */
  const onTableHeaderCheckboxChange = (keys: string[]) => {
    if (!keys.length) {
      return message.error({
        content: intl.get('workflow.information.leastRule'),
        className: 'custom-class',
        style: {
          padding: 0
        }
      });
    }
    setDataBoardProps(prevState => ({
      ...prevState,
      tableHeaderCheckedKey: keys
    }));
  };

  /**
   * 分区字段值变化事件
   */
  const onPartitionChange = (partitionData: Record<string, any>) => {
    setDataBoardProps(prevState => ({
      ...prevState,
      partitionData,
      dataFile: {
        ...prevState.dataFile,
        partition_usage: partitionData.isOpen,
        partition_infos: partitionData.value
      }
    }));
  };

  /**
   * 获取模型的抽取规则
   * @param model
   */
  const getModelExtractRule = async (model: string) => {
    const params = { model, file_list: [] };
    const { res, Description } = (await servicesCreateEntity.unstructuredData(params)) || {};
    let rules: any = [];
    let error = {};
    if (res) {
      const extract_rules = convertToRulesForModel(res);
      rules = [...rules, ...extract_rules];
      const rulesObj: any = {};
      rules.forEach((rule: any) => {
        if (rulesObj[rule.entity_type]) {
          rulesObj[rule.entity_type].push({
            column_name: rule.property.column_name,
            property_field: rule.property.property_field
          });
        } else {
          rulesObj[rule.entity_type] = [
            {
              column_name: rule.property.column_name,
              property_field: rule.property.property_field
            }
          ];
        }
      });
      rules = Object.keys(rulesObj).map(entity_type => ({
        entity_type,
        property: rulesObj[entity_type]
      }));
    } else {
      error = Description;
      Description &&
        message.error({
          content: Description,
          className: 'custom-class',
          style: {
            padding: 0
          }
        });
    }
    return { rules, error };
  };

  /**
   * 模型抽取的确定按钮的点击事件
   */
  const handleModelOk = async () => {
    const form = dataSourceFormRef.current?.form;
    const formValues = form?.getFieldsValue();
    const extract_model = formValues.model_name;
    // 获取模型的所有抽取规则
    const { rules } = await getModelExtractRule(extract_model);

    // 根据图谱中模型的实体类，关系类的数量去生成与之匹配的抽取规则
    const ruleEntityTypes = rules.map((item: any) => item.entity_type);
    const allClass = [...graphG6Data.nodes!, ...graphG6Data.edges!].filter(
      (item: G6NodeData | G6EdgeData) => item._sourceData.model === formValues.model_name
    );
    const allClassNames = allClass.map((item: G6NodeData | G6EdgeData) => item._sourceData.name);
    const deleteNames = _.difference(ruleEntityTypes, allClassNames);
    const newRules = rules.filter((item: any) => !deleteNames.includes(item.entity_type));

    // modelDataFile 是每次打开弹框临时存储选中的文件
    // 要用modelDataFile与编辑数据editData身上的文件进行比对  融合成最终的模型绑定的文件

    const cloneDeepEditData = _.cloneDeep(editData);
    modelDataFile.forEach(item => {
      const target = cloneDeepEditData.find(editDataItem => editDataItem.ds_id === item.ds_id);
      if (target) {
        target.files = _.uniqBy([...target.files, ...item.files], 'file_source');
      } else {
        cloneDeepEditData.push(item);
      }
    });
    // return;
    const file = cloneDeepEditData.map((item: any) => ({
      ...item,
      extract_rules: newRules
    }));
    setKnowledgeMapStore(preStore => ({
      ...preStore,
      currentDataFile: file
    }));
    onCancel && onCancel();
    onCancelParsing();
  };

  /**
   * 解析规则变化重新调预览接口
   */
  const onParsingChange = (type: string, value: string) => {
    const key = dataBoardProps?.file?.key;
    setRequestId(requestId + 1);
    requestIdRef.current.id += 1;
    switch (type) {
      case 'delimiter':
        dispatchState({ ...parsingState, delimiter: value });
        onSaveParsing(key, { ...parsingState, delimiter: value });

        break;
      case 'quotechar':
        dispatchState({ ...parsingState, quotechar: value });
        onSaveParsing(key, { ...parsingState, quotechar: value });
        break;
      case 'escapechar':
        dispatchState({ ...parsingState, escapechar: value });
        onSaveParsing(key, { ...parsingState, escapechar: value });
        break;
      default:
        break;
    }
  };

  /**
   * 解析规则实时保存
   */
  const onSaveParsing = (name: any, data: any) => {
    // 解析规则和文件一一对应
    resetExtractRule.current = true;
    if (editData.length > 0) {
      changeExtractRule.current = true;
    } else {
      changeExtractRule.current = false;
    }

    const file = dataBoardProps?.file;
    const key = dataBoardProps?.file?.key;
    const fileName = dataBoardProps?.dataFile?.file_name;
    const { delimiter, quotechar, escapechar } = data;

    let cloneParsingData: any = _.cloneDeep(parsingTreeChange);
    const keyAll = _.map(cloneParsingData, (item: any) => item?.key) || [];
    // 新增(1.新建时第一个更改的值 2.某一个编辑时更改)
    if (!keyAll.includes(name)) {
      cloneParsingData = [
        ...cloneParsingData,
        {
          key: name,
          parsing: {
            delimiter,
            quotechar,
            escapechar
          }
        }
      ];
      setParsingTreeChange(cloneParsingData);
      setCurrentParse(cloneParsingData);
      const filterFile = _.filter(_.cloneDeep(cloneParsingData), (item: any) => item?.key === name);
      getBoardDataBySelectedDataFile(key, 'csv', file, fileName, filterFile, false, true);
      return;
    }
    const newParsingFileSet = _.map(cloneParsingData, (item: any) => {
      // 更改
      if (item?.key === name) {
        item.parsing = { delimiter, quotechar, escapechar };
        return item;
      }
      return item;
    });

    setParsingTreeChange(newParsingFileSet);
    setCurrentParse(newParsingFileSet);
    const filterFile = _.filter(_.cloneDeep(newParsingFileSet), (item: any) => item?.key === name);
    getBoardDataBySelectedDataFile(key, 'csv', file, fileName, filterFile, false, true);
  };

  /**
   * 确定按钮的点击事件
   */
  const handleOk = () => {
    const { tableHeaderCheckedKey, dataFile } = dataBoardProps;
    const form = dataSourceFormRef.current?.form;
    const formValues = form?.getFieldsValue();
    const isAs = currentSelectedDS.current!.data_source.includes(DS_SOURCE.as); // 是不是AS数据库
    const isRabbitMQ = currentSelectedDS.current!.data_source.includes(DS_SOURCE.mq); // 是不是RabbitMQ数据库
    const isHive = currentSelectedDS.current!.data_source.includes(DS_SOURCE.hive); // 是不是hive数据库
    const isAnyRobot = currentSelectedDS.current!.data_source.includes(DS_SOURCE.AnyRobot); // 是不是AnyRobot数据库

    const extractRule = allExtractRuleForSelectedDataFile.current.filter(item =>
      tableHeaderCheckedKey?.includes(item.property.property_field)
    );
    // 默认是mysql hive格式

    let filesObj: FileType = {
      file_name: formValues.file,
      file_path: currentSelectedDS.current!.ds_path,
      file_source: formValues.file
    };

    if (isAs) {
      filesObj.file_name = formValues.file.label;
      filesObj.file_source = formValues.file.key;
      if (
        ['as', 'as7'].includes(dataBoardProps?.file?.data_source) &&
        dataBoardProps?.file?.dataType === 'structured' &&
        selectFileType === 'csv' &&
        String(selectedDataFile?.current[0]?.label?.split('.')?.[1]) === 'csv'
      ) {
        const parsingFile = onHandleSelected(filesObj);
        if (_.isEmpty(parsingFile)) return;
        filesObj.delimiter = parsingFile?.[0]?.parsing?.delimiter;
        filesObj.quotechar = parsingFile?.[0]?.parsing?.quotechar;
        filesObj.escapechar = parsingFile?.[0]?.parsing?.escapechar;
      }
    }
    if (isRabbitMQ) {
      filesObj.file_name = formValues.queue;
      filesObj.file_source = formValues.queue;
    }
    if (isAnyRobot) {
      const receiveParam = onAssignToTime(dataFile);
      if (_.isEmpty(receiveParam)) {
        return;
      }
      filesObj = receiveParam;
    }

    const isErrorTip = onSelectedErrorTip(filesObj?.file_name, filesObj);
    if (_.isEmpty(isErrorTip)) return;
    // 获取entity_type
    let entity_type = _.uniqueId(`${extractRule[0]?.entity_type}_`);
    if (editData.length === 0) {
      // 处理同名文件
      const existEntityType = graphKMap!.files.map(item => item.extract_rules[0].entity_type);
      if (existEntityType.includes(entity_type)) {
        // 判断新添加的数据文件是不是已经被添加过了
        entity_type = _.uniqueId(`${entity_type}_`);
      }
    } else {
      entity_type = editData[0].extract_rules[0].entity_type;
    }
    // 重新组合接口需要的抽取规则数据格式
    const extractRulesProperty = extractRule.map(item => ({
      column_name: item.property.column_name,
      property_field: item.property.property_field
    }));

    const file: DataFileType = {
      ds_id: formValues.ds_id,
      data_source: currentSelectedDS.current!.data_source,
      ds_path: currentSelectedDS.current!.ds_path,
      extract_type: formValues.extract_type,
      extract_rules: [
        {
          entity_type,
          property: extractRulesProperty
        }
      ],
      files: [filesObj],
      x: 0,
      y: 0
    };
    // hive 数据源分区属性
    if (isHive) {
      file.partition_usage = dataFile?.partition_usage;
      file.partition_infos = dataFile?.partition_infos;
    }

    if (isAnyRobot) {
      file.files = [
        {
          file_name: editData[0]?.files?.[0]?.file_name || dataFile?.file_name,
          file_path: '',
          file_source: filesObj?.name,
          start_time: Number(filesObj?.start_time),
          end_time: Number(filesObj?.end_time)
        }
      ];
    }
    if (editData.length > 0) {
      // 编辑模式下将graphKMap中的files中的数据替换掉
      const graphKMapFiles = _.cloneDeep(graphKMap?.files);
      const fileIndex = graphKMapFiles?.findIndex(item => item.extract_rules[0].entity_type === entity_type);
      if (fileIndex !== undefined && fileIndex !== -1) {
        graphKMapFiles?.splice(fileIndex, 1, file);
      }
      setKnowledgeMapStore(preStore => ({
        ...preStore,
        graphKMap: {
          ...preStore.graphKMap,
          files: graphKMapFiles
        }
      }));
    }

    // 非编辑模式下，点击确定按钮之后需要进行自动属性映射
    if (editData.length === 0) {
      isAutoMapPropsSignRef.current = true;
    }

    setKnowledgeMapStore(preStore => ({
      ...preStore,
      currentDataFile: [file],
      firstAddFile: editData.length === 0
    }));
    onCancel && onCancel();
    onCancelParsing();
  };

  /**
   * 类型为AnyRobot时参数处理
   */
  const onAssignToTime = (filesObj: any, type?: string) => {
    if (currentSelectedDS.current?.data_source !== DS_SOURCE.AnyRobot) return {};
    let params: any = {};
    const filesEdit = editData[0]?.files;
    const nameIndex = editData[0]?.files?.[0]?.file_name || filesObj?.file_name;
    const currentSelectedFile = arFileSave[nameIndex];
    // 编辑状态更改数据配置
    if (!_.isEmpty(filesEdit) && _.isEmpty(currentSelectedFile)) {
      params = {
        start_time: Number(filesEdit?.[0]?.start_time),
        end_time: Number(filesEdit?.[0]?.end_time),
        name: filesEdit?.[0]?.file_source,
        data_source: 'AnyRobot',
        ds_id: editData[0]?.ds_id
      };
    }

    if (!_.isEmpty(currentSelectedFile) && !currentSelectedFile?.start_time && type !== 'refresh') {
      message.error(intl.get('workflow.information.pleaseSelectTime'));
      const newErrorMap = {
        ...errorMap?.current?.errors,
        [arDataRef.current.name]: intl.get('workflow.information.pleaseSelectTime')
      };
      errorMap.current.errors = newErrorMap;
      setTipsModalVisible(false);
      return {};
    }

    if (!_.isEmpty(params)) return;
    params = currentSelectedFile;
    params = onSelectedErrorTip(nameIndex, params);
    return params;
  };

  /**
   * 选择文件是否存在错误
   */
  const onSelectedErrorTip = (nameIndex: any, params: any) => {
    let paramsClone = _.cloneDeep(params);
    _.map(_.cloneDeep(errorMap.current.errors), (item: any, index: any) => {
      if ([nameIndex].includes(index)) {
        paramsClone = {};
      }
    });
    if (_.isEmpty(paramsClone)) {
      message.error(intl.get('workflow.information.errorTip'));
      setTipsModalVisible(false);
      return {};
    }
    return paramsClone;
  };

  /**
   * 确认后处理解析规则
   */
  const onHandleSelected = (data: any) => {
    const filesEdit = editData[0]?.files?.[0];
    const isParsing = filesEdit?.delimiter;
    let newParsing: any = [];
    const { delimiter, quotechar, escapechar } = defaultParsingRule;
    const cloneData = _.cloneDeep(parsingTreeChange);
    const fileData = _.cloneDeep(data);
    const fileSource = fileData?.file_source;
    newParsing = _.filter(cloneData, (item: any) => fileSource === item?.key) || [];
    let isSelectedFileError: any = false;

    if (errorMap?.current?.errors[fileSource]) {
      isSelectedFileError = true;
    }

    if (isSelectedFileError) {
      message.error(intl.get('workflow.information.errorTip'));
      return {};
    }
    if (_.isEmpty(newParsing) && !isParsing) {
      newParsing.push({ key: fileSource, parsing: { delimiter, quotechar, escapechar } });
    } else if (_.isEmpty(newParsing) && isParsing) {
      newParsing = [
        {
          key: filesEdit?.file_source,
          parsing: {
            delimiter: filesEdit?.delimiter,
            quotechar: filesEdit?.quotechar,
            escapechar: filesEdit?.escapechar
          }
        }
      ];
    }
    setParsingSet([...parsingSet, ...newParsing]);
    return newParsing;
  };

  /**
   * 解析规则失去焦点时，空输入框恢复默认解析规则且可编辑
   */
  const onBlur = () => {
    requestIdRef.current.id = 0;
    // resetExtractRule.current = true;

    const key = dataBoardProps?.file?.key;
    const file = dataBoardProps?.file;
    const fileName = dataBoardProps?.dataFile?.file_name;
    const { delimiter, quotechar, escapechar } = defaultParsingRule;
    const cloneData = _.cloneDeep(parsingTreeChange);
    const filterData = _.map(cloneData, (item: any) => {
      if (item?.key === key) {
        if (!item.parsing.delimiter) {
          item.parsing.delimiter = delimiter;
          dispatchState({ ...parsingState, delimiter });
          getBoardDataBySelectedDataFile(
            key,
            'csv',
            file,
            fileName,
            [{ key, parsing: { ...parsingState, delimiter } }],
            false,
            true
          );
        }
        if (!item.parsing.quotechar) {
          item.parsing.quotechar = quotechar;
          dispatchState({ ...parsingState, quotechar });
          getBoardDataBySelectedDataFile(
            key,
            'csv',
            file,
            fileName,
            [{ key, parsing: { ...parsingState, quotechar } }],
            false,
            true
          );
        }
        if (!item.parsing.escapechar) {
          item.parsing.escapechar = escapechar;
          dispatchState({ ...parsingState, escapechar });
          getBoardDataBySelectedDataFile(
            key,
            'csv',
            file,
            fileName,
            [{ key, parsing: { ...parsingState, escapechar } }],
            false,
            true
          );
        }
        return item;
      }
      return item;
    });

    setParsingTreeChange(filterData);
    setCurrentParse(filterData);
  };

  /**
   * 数据源的选中事件
   */
  const onSelectDs = (ds: DsSourceItem) => {
    if (_.isEmpty(editData)) {
      arDataRef.current = {};
      errorMap.current.errors = {};
      setArFileSave({});
      setParsingTreeChange([]);
      setCurrentParse([]);
      setSelectFileType('csv');
      requestIdRef.current.id = 0;
    }

    currentSelectedDS.current = ds;
    if ([DS_SOURCE.mq].includes(ds.data_source)) {
      getRabbitMQBoardDataByDataSource(ds);
    }
  };

  /**
   * 数据文件被选中事件 (模型抽取  文件的复选框的change也会执行此事件)
   */
  const onPreviewParamHandle = (files: any[], ds: DsSourceItem, parsing?: any, arData?: any) => {
    let filterData: any = [];
    resetExtractRule.current = true; // 切换选中的数据文件，需要重置为接口返回的全部抽取规则
    currentSelectedDS.current = ds;
    setDataBoardProps(prevState => ({
      ...prevState,
      file: { ...ds, ...files?.[0] }
    }));

    if (ds.extract_type === EXTRACT_TYPE.MODEL) {
      // 说明是模型抽取
      const targetFiles = files.map((item: any) => JSON.parse(item));
      generateModelDataFile(targetFiles);
      return;
    }

    selectedDataFile.current = files;
    if (
      ['as', 'as7'].includes(ds.data_source) &&
      selectFileType === 'csv' &&
      ds.dataType === DS_TYPE.STRUCTURED &&
      String(selectedDataFile?.current[0]?.label?.split('.')?.[1]) === 'csv'
    ) {
      filterData = onHandleParsingShow(files);
    }
    if ([DS_SOURCE.as].includes(ds.data_source)) {
      if (ds.dataType === DS_TYPE.STRUCTURED) {
        const file = files[0];
        const postfix = getPostfix(file.label);
        getBoardDataBySelectedDataFile(
          file.key,
          postfix,
          ds,
          file.label,
          _.isEmpty(filterData) ? parsing : filterData,
          true,
          true
        );
        return;
      }
    }
    arDataRef.current = arData || { name: files[0], id: editData[0]?.files?.[0]?.file_source };
    getBoardDataBySelectedDataFile(files[0], '', ds, '', [], false, true, arData);
  };

  /**
   * 生成模型的数据文件（模型可以同时映射多个数据源，故在选中复选框的时候  就要把当前数据源以及数据源文件记录下来）
   * data 是选中的非结构化数据文件
   */
  const generateModelDataFile = (data: any[]) => {
    const form = dataSourceFormRef.current?.form;
    const formValues = form?.getFieldsValue();
    const extract_model = formValues.model_name;

    // 组合文件数据
    const files = data.map((item: any) => ({
      file_name: item.name,
      file_path: item.path,
      file_source: item.docid,
      file_type: item.type
    }));

    const file: DataFileType = {
      ds_id: formValues.ds_id,
      data_source: currentSelectedDS.current!.data_source,
      ds_path: currentSelectedDS.current!.ds_path,
      extract_type: formValues.extract_type,
      extract_rules: [],
      files,
      x: 0,
      y: 0,
      extract_model
    };

    if (modelDataFile.length > 0) {
      const cloneModelDataFile = _.cloneDeep(modelDataFile);
      const targetIndex = cloneModelDataFile.findIndex((item: DataFileType) => item.ds_id === file.ds_id);
      if (targetIndex !== -1) {
        const mergeFiles = _.uniqBy(files, 'file_source');
        file.files = filterFileChildren(mergeFiles);
        cloneModelDataFile.splice(targetIndex, 1, file);
      } else {
        cloneModelDataFile.push(file);
      }
      setModelDataFile(cloneModelDataFile);
    } else {
      setModelDataFile([file]);
    }
  };

  const filterFileChildren = (data: FileType[]) => {
    const deleteKeys: string[] = [];
    data.forEach(item => {
      data.forEach(file => {
        if (file.file_source.includes(item.file_source) && file.file_source !== item.file_source) {
          deleteKeys.push(file.file_source);
        }
      });
    });
    return data.filter(item => !deleteKeys.includes(item.file_source));
  };

  /**
   * 模型的选中事件
   * @param model
   */
  const onSelectModel = (model: string) => {
    getBoardDataByModel(model);
  };

  const initialDataBoardStatus = () => {
    setDataBoardProps(prevState => ({
      loading: false,
      data: [],
      error: '',
      type: 'table',
      tableHeaderCheckedKey: [],
      dataFile: {},
      partitionData: {}
    }));
  };

  /**
   * 编辑进入时解析规则参数判断
   */
  const onHandleParsingShow = (files: any) => {
    let filterData: any = [];
    let newParsingArr: any = [];
    const cloneData = _.cloneDeep(parsingTreeChange);
    const { delimiter, quotechar, escapechar } = defaultParsingRule;
    const isParsing = editData[0]?.files?.[0]?.delimiter;
    // editData里面有解析规则
    if (isParsing && _.isEmpty(cloneData)) {
      filterData = [
        {
          key: editData[0]?.files?.[0]?.file_source,
          parsing: {
            delimiter: editData[0]?.files?.[0]?.delimiter,
            quotechar: editData[0]?.files?.[0]?.quotechar,
            escapechar: editData[0]?.files?.[0]?.escapechar
          }
        }
      ];
    } else {
      const newParsing = _.map(cloneData, (item: any) => item?.key) || [];
      if (_.isEmpty(newParsing)) {
        newParsingArr = [...cloneData, { key: files?.[0]?.key, parsing: { delimiter, quotechar, escapechar } }];
      } else {
        _.map(cloneData, (item: any) => {
          if (!newParsing.includes(item?.key)) {
            newParsingArr = [...newParsingArr, { key: files?.[0]?.key, parsing: { delimiter, quotechar, escapechar } }];
          } else {
            newParsingArr = [...newParsingArr, item];
          }
        });
      }
      const cloneParseArr = _.cloneDeep(newParsingArr);
      filterData = _.filter(cloneParseArr, (item: any) => item?.key === files?.key);
      setParsingTreeChange(newParsingArr);
    }
    return filterData;
  };

  /**
   * 右侧面板刷新按钮
   */
  const onRefreshData = async () => {
    const ds = currentSelectedDS.current!;
    if ([DS_SOURCE.as].includes(ds.data_source)) {
      if (currentSelectedDS.current?.dataType === DS_TYPE.STRUCTURED) {
        // 刷新数据
        const file = selectedDataFile.current[0];
        const postfix = getPostfix(file.label);
        let error: any = '';
        // 编辑进入和快速进入文件格式都应是csv
        if (
          ['as', 'as7'].includes(ds.data_source) &&
          selectFileType === 'csv' &&
          String(file?.label?.split?.('.')?.[1]) === 'csv'
        ) {
          const parsing = onHandleParsingShow(file);
          error = await getBoardDataBySelectedDataFile(
            file.key,
            postfix,
            currentSelectedDS.current!,
            file.label,
            parsing,
            false,
            true
          );
        } else {
          error = await getBoardDataBySelectedDataFile(file.key, postfix, currentSelectedDS.current!, file.label);
        }

        if (!error) {
          // message.success(intl.get(`${prefixClsLocale}.syncDataSuccessTips`));
          message.success({
            content: intl.get(`${prefixClsLocale}.syncDataSuccessTips`),
            className: 'custom-class',
            style: {
              marginTop: '6vh'
            }
          });
        }
        return;
      }
    }
    if ([DS_SOURCE.AnyRobot].includes(ds.data_source)) {
      const file = selectedDataFile.current[0];
      const { dataFile } = dataBoardProps;
      const params = onAssignToTime(dataFile, 'refresh');
      const error = await getBoardDataBySelectedDataFile(params, '', currentSelectedDS.current!);
      if (!error) {
        // message.success(intl.get(`${prefixClsLocale}.syncDataSuccessTips`));
        message.success({
          content: intl.get(`${prefixClsLocale}.syncDataSuccessTips`),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
      }
      return;
    }
    const file = selectedDataFile.current[0];
    const error = await getBoardDataBySelectedDataFile(file, '', currentSelectedDS.current!);
    if (!error) {
      // message.success(intl.get(`${prefixClsLocale}.syncDataSuccessTips`));
      message.success({
        content: intl.get(`${prefixClsLocale}.syncDataSuccessTips`),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }
  };

  const modalOkBtn = () => {
    const form = dataSourceFormRef.current?.form;
    const formValues = form?.getFieldsValue();
    const isModelExtract = formValues.extract_type === EXTRACT_TYPE.MODEL; // 是不是模型抽取
    if (isModelExtract) {
      handleModelOk();
    } else {
      handleOk();
    }
  };

  /**
   * 关闭弹窗取消保存的解析规则相关数据
   */
  const onCancelParsing = () => {
    errorMap.current.errors = {};
    setParsingTreeChange([]);
    setCurrentParse([]);
    requestIdRef.current.id = 0;
    arDataRef.current = {};
    setArFileSave({});
  };

  /**
   * 设置时间实时预览
   */
  const onSetTimeToPreview = (data: any) => {
    const file = dataBoardProps?.file;
    const arData = {
      id: data?.name,
      name: dataBoardProps?.dataFile?.file_name
    };
    arDataRef.current = arData;
    getBoardDataBySelectedDataFile(dataBoardProps?.dataFile?.file_name, '', file, '', [], false, false, arData);
    // getBoardDataBySelectedDataFile(dataBoardProps?.dataFile?.file_name, '', file, '', [], false, true, arData);
  };

  const onModalOrTip = (hasRelationDataFile: any, editData: any) => {
    const isRobot = currentSelectedDS.current?.data_source === DS_SOURCE.AnyRobot;
    const form = dataSourceFormRef.current?.form;
    const formValues = form?.getFieldsValue();
    if (isRobot) {
      const isHaveSelectedErrorFile = onAssignToTime(dataBoardProps?.dataFile);
      if (!_.isEmpty(isHaveSelectedErrorFile) && hasRelationDataFile && editData.length === 0) {
        setTipsModalVisible(true);
      } else {
        modalOkBtn();
      }
      return;
    }
    if (
      ['as', 'as7'].includes(dataBoardProps?.file?.data_source) &&
      dataBoardProps?.file?.dataType === 'structured' &&
      selectFileType === 'csv' &&
      String(selectedDataFile?.current[0]?.label?.split('.')?.[1]) === 'csv'
    ) {
      const isHaveSelectedErrorFile = onHandleSelected({ file_source: formValues?.file?.key });
      if (!_.isEmpty(isHaveSelectedErrorFile) && hasRelationDataFile && editData.length === 0) {
        setTipsModalVisible(true);
      } else {
        modalOkBtn();
      }
      return;
    }

    const isHaveSelectedErrorFile = onSelectedErrorTip(formValues?.file, { key: formValues?.file?.key });
    if (hasRelationDataFile && editData.length === 0 && !_.isEmpty(isHaveSelectedErrorFile)) {
      setTipsModalVisible(true);
    } else {
      modalOkBtn();
    }
  };
  const prefixCls = 'add-data-file';
  return (
    <>
      <TemplateModal
        className={`${prefixCls}-modal`}
        open
        title={
          editData.length > 0
            ? intl.get(`${prefixClsLocale}.editDataFileBtn`)
            : intl.get('workflow.information.addDataFileBtn')
        }
        width="100%"
        onOk={() => {
          if (dataBoardProps.loading) {
            return;
          }
          const form = dataSourceFormRef.current?.form;
          const formValues = form?.getFieldsValue();
          if (
            (!formValues.file || formValues.file.length === 0) &&
            currentSelectedDS.current?.data_source !== DS_SOURCE.mq
          ) {
            message.error({
              content: intl.get(`${prefixClsLocale}.addDataFileRequireTip`),
              className: 'custom-class',
              style: {
                padding: 0
              }
            });
            return;
          }

          let hasRelationDataFile = false;
          if (selectedG6Node.length > 0) {
            const { _sourceData } = selectedG6Node[0];
            graphKMap.entity.forEach(item => {
              if (item.name === _sourceData.name && item.entity_type) {
                hasRelationDataFile = true;
              }
            });
          }
          if (selectedG6Edge.length > 0) {
            const { edgeData } = selectedG6Edge[0];
            const { _sourceData } = edgeData;
            graphKMap.edge.forEach(item => {
              if (_.isEqual(item.relations, _sourceData.relations) && item.entity_type) {
                hasRelationDataFile = true;
              }
            });
          }

          onModalOrTip(hasRelationDataFile, editData);
        }}
        onCancel={() => {
          onCancel();
          onCancelParsing();
        }}
        fullScreen
        footerAlign="center"
      >
        <SplitBox defaultSize={480} minSize={240} maxSize={480}>
          <DataSourceForm
            modelDataFile={modelDataFile} // 模型数据文件
            editData={editData}
            onSelectFile={onDataFileSelect}
            initialDataBoardStatus={initialDataBoardStatus}
            onSelectDs={onSelectDs}
            onSelectModel={onSelectModel}
            ref={dataSourceFormRef}
            partitionData={[dataBoardProps.partitionData]}
            setSelectFileType={setSelectFileType}
            errorMap={errorMap}
          />
          <div className="kw-w-100 kw-h-100 kw-pt-5 kw-pb-5">
            <DataBoard
              {...dataBoardProps}
              onTableHeaderCheckboxChange={onTableHeaderCheckboxChange}
              onPartitionChange={onPartitionChange}
              onRefreshData={onRefreshData}
              currentSelectedDS={currentSelectedDS}
              selectFileType={selectFileType}
              parsingChange={parsingChange}
              setParsingChange={setParsingChange}
              requestId={requestId}
              setRequestId={setRequestId}
              requestIdRef={requestIdRef}
              onParsingChange={onParsingChange}
              defaultParsingRule={defaultParsingRule}
              parsingSet={parsingSet}
              setParsingSet={setParsingSet}
              arFileSave={arFileSave}
              setArFileSave={setArFileSave}
              parsingTreeChange={parsingTreeChange}
              currentParse={currentParse}
              editData={editData}
              onBlur={onBlur}
              onSetTimeToPreview={onSetTimeToPreview}
            />
          </div>
        </SplitBox>
      </TemplateModal>
      <TipModal
        open={tipsModalVisible}
        onClose={() => setTipsModalVisible(false)}
        onCancel={() => setTipsModalVisible(false)}
        onOk={() => {
          setTimeout(() => {
            // 替换已经关联的文件的话，需要先清除之前的映射关系
            x6ContainerRef && x6ContainerRef.current.clearMap();
            modalOkBtn();
          }, 0);
        }}
        title={intl.get(`${prefixClsLocale}.addDataFileModalTitle`)}
        content={intl.get(`${prefixClsLocale}.addDataFileModalContent`)}
      />
    </>
  );
};

export default AddDataFileModal;
