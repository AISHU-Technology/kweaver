/**
 * 批量导入实体类弹窗
 */
import React, { useState, useEffect, useReducer, useRef, forwardRef, useImperativeHandle } from 'react';
import { Select, Empty, Input, message, Button } from 'antd';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';

import servicesCreateEntity from '@/services/createEntity';
import servicesDataSource from '@/services/dataSource';
import { DS_SOURCE } from '@/enums';
import TemplateModal from '@/components/TemplateModal';
import UniversalModal from '@/components/UniversalModal';
import LoadingMask from '@/components/LoadingMask';
import NoDataBox from '@/components/NoDataBox';
import TimePickerSetting from '@/components/TimePickerSetting';

import { DataSheet, FileTree, PreviewTable, PreviewJson, parseToTable } from '@/components/SourceImportComponent';
import { DsSourceItem, PreviewColumn } from '@/components/SourceImportComponent/types';

import ParsingRuleSettingModal from './ParsingRuleSettingModal';

import { ONTO_SOURCE_IMG_MAP } from './assistant';
import kongImg from '@/assets/images/kong.svg';
import guideImg from '@/assets/images/flow4Empty.svg';
import invalidFileImg from '@/assets/images/invalidFile.svg';
import './style.less';
import ParsingSetting from '@/components/ParsingSetting';

export interface EntityImportModalProps {
  knDataId: string;
  graphId: number;
  visible: boolean;
  onCancel: () => void;
  onOk: (data: any, type?: any) => void;
  ontoLibType: string;
  setParsingFileSet: (data: any) => void;
  defaultParsingRule: any;
  setDefaultParsingRule: (data: any) => void;
  sourceFileType: any;
  setSourceFileType: (data: any) => void;
  parsingTreeChange: any;
  setParsingTreeChange: (data: any) => void;
  arFileSave: Record<any, any>;
  setArFileSave: (data: any) => void;
}

type ViewType = 'table' | 'json';
const { Option } = Select;

const defaultLoading = { left: false, right: false, delimiter: '', quotechar: '', escapechar: '' };
const loadingReducer = (pre: typeof defaultLoading, next: Partial<typeof defaultLoading>) => ({ ...pre, ...next });

const OntoEntityImportModal = (props: EntityImportModalProps, ref: any) => {
  const {
    visible,
    graphId,
    onOk,
    onCancel,
    knDataId,
    ontoLibType,
    setParsingFileSet,
    defaultParsingRule,
    setDefaultParsingRule,
    sourceFileType,
    setSourceFileType,
    parsingTreeChange,
    setParsingTreeChange,
    arFileSave,
    setArFileSave
  } = props;
  const postfix = useRef<string | undefined>(); // as文件类型, csv | json
  const [sourceData, setSourceData] = useState<DsSourceItem[]>([]); // 已分类的数据源
  const [selectedSource, setSelectedSource] = useState<DsSourceItem>({} as DsSourceItem); // 选择的数据源
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]); // 勾选的数据
  const [selectedKey, setSelectedKey] = useState<string | undefined>(); // 选中查看的数据
  const [tableData, setTableData] = useState<PreviewColumn[]>([]); // 预览的表格数据
  const [viewType, setViewType] = useState<ViewType>('table'); // 预览的视图类型

  const [loading, dispatchLoading] = useReducer(loadingReducer, defaultLoading); // 左右loading
  const [errorMap, setErrorMap] = useState<Record<string, string>>({}); // 错误信息
  const errorMapRef = useRef<any>({ error: {} }); // 错误信息
  const requestIdRef = useRef<any>({ id: 0 });

  const [parsingChange, setParsingChange] = useState({ delimiter: '', quotechar: '', escapechar: '' }); // 解析规则(某一文件具体)
  const [requestId, setRequestId] = useState(0); // 请求次数
  const arDataRef = useRef<any>();

  useEffect(() => {
    if (String(graphId) !== '' || (String(graphId) === '' && ontoLibType !== '')) {
      getSourceList();
    }
  }, [graphId]);

  useEffect(() => {
    dispatchLoading({ ...loading, ...defaultParsingRule });
  }, [defaultParsingRule]);

  useImperativeHandle(ref, () => {
    onDefaultRequestId;
  });

  /**
   * 获取数据源
   */
  const getSourceList = async () => {
    dispatchLoading({ left: true });
    let response;
    if (ontoLibType !== '') {
      response = await servicesDataSource.dataSourceGetNew(-1, 10, 'descend', knDataId, 'structured');
    } else {
      response = await servicesCreateEntity.getFlowSource({ id: graphId, type: 'filter' });
    }

    dispatchLoading({ left: false });
    if (!response?.res) {
      // return response?.Description && message.error(response?.Description);
      return (
        response?.Description &&
        message.error({
          content: response?.Description,
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        })
      );
    }
    const firstItem = response.res.df[0];
    setSourceData(response.res.df);

    if (!firstItem) return;
    setSelectedSource(firstItem);

    // rabbitmq的队列相当于一个抽取文件
    if (firstItem.data_source === DS_SOURCE.mq) {
      setCheckedKeys([firstItem.queue]);
      setViewType('json');
    }
  };

  /**
   * 清除数据
   */
  const clearData = () => {
    setViewType('table');
    setTableData([]);
    setCheckedKeys([]);
    setSelectedKey(undefined);
    setErrorMap({});
    errorMapRef.current.error = {};
  };

  /**
   * 切换数据源
   * @param id 数据源id
   */
  const onSourceChange = (id: number) => {
    if (!id) {
      clearData();
      setSelectedSource({} as any);
    }

    setCheckedKeys([]);
    setSelectedKey(undefined);
    setErrorMap({});
    errorMapRef.current.error = {};
    arDataRef.current = {};
    setArFileSave({});
    setParsingFileSet({});
    setParsingTreeChange([]);
    setSourceFileType('csv');
    requestIdRef.current.id = 0;
    setRequestId(0);

    const source = _.find(sourceData, d => d.id === id);

    if (!source) return;
    setSelectedSource(source);

    if (source.data_source === DS_SOURCE.mq) {
      setCheckedKeys([source.queue]);
      setViewType('json');
    }
  };

  /**
   * 预览数据表
   * @param name 数据表名 | 文件docid | 队列名称
   */
  const onPreviewParamHandle = async (name?: any, source?: any, parsing?: any, isUpdate?: any, arData?: any) => {
    if (isUpdate) {
      const { delimiter, quotechar, escapechar } = defaultParsingRule;
      const filterData = _.filter(_.cloneDeep(parsingTreeChange), (item: any) => item?.key === name);
      dispatchLoading(_.isEmpty(filterData) ? { delimiter, quotechar, escapechar } : { ...filterData?.[0]?.parsing });
    }
    const curSource = source || selectedSource;
    setSelectedKey(curSource?.data_source === 'AnyRobot' ? arDataRef.current?.name : name);
    let params: any = {};
    if (!name) {
      clearData();
      return;
    }

    params = {
      id: curSource.id,
      data_source: curSource.data_source,
      name: curSource?.data_source === 'AnyRobot' ? arDataRef.current?.id : name
    };
    if (curSource?.data_source === 'AnyRobot') {
      params = onReduceAccordToName(params, arDataRef?.current);
    }
    // as数据源&&结构化&&csv传解析规则
    if (
      ['as7', 'as'].includes(curSource.data_source) &&
      curSource.dataType === 'structured' &&
      sourceFileType === 'csv'
    ) {
      params = {
        ...params,
        delimiter: parsing?.delimiter,
        quotechar: parsing?.quotechar,
        escapechar: parsing?.escapechar,
        request_id: String(requestIdRef?.current?.id)
      };
    }

    try {
      dispatchLoading({ right: true });
      const { res, ErrorCode, ErrorDetails } = (await servicesCreateEntity.getOtherPreData(params)) || {};
      dispatchLoading({ right: false });
      if (
        ['as7', 'as'].includes(curSource.data_source) &&
        curSource.dataType === 'structured' &&
        sourceFileType === 'csv'
      ) {
        if (res && res?.request_id === String(requestIdRef.current?.id)) {
          setTableData(parseToTable(res));
          onHandleErrors(name);
          return;
        }
        setTableData([]);
      } else {
        if (res) {
          if (curSource?.data_source === 'AnyRobot' && params?.start_time) {
            onHandleErrors(arDataRef?.current?.name);
          } else {
            onHandleErrors(name);
          }

          setTableData(parseToTable(res));
          return;
        }
        setTableData([]);
      }

      if (ErrorCode) {
        const errors = { ...errorMapRef?.current?.error, [arDataRef?.current?.name || name]: ErrorDetails };
        // const errors = { ...errorMapRef?.current?.error, [name]: ErrorDetails };
        errorMapRef.current.error = { ...errors };
        setErrorMap(errors);
      }
    } catch {
      dispatchLoading({ right: false });
    }
  };

  /**
   * 预览成功去除报错信息
   */
  const onHandleErrors = (name: any) => {
    const cloneErrorMap = _.cloneDeep(errorMapRef?.current?.error);
    let filterData: any = {};
    _.filter(cloneErrorMap, (item: any, index: any) => {
      if (index !== name) {
        filterData = { ...filterData, [index]: item };
      }
    });
    const errors = _.isEmpty(filterData) ? {} : filterData;
    setErrorMap(errors);
    errorMapRef.current.error = errors;
  };

  /**
   * 类型为AnyRobot，以文件名为key进行reduce
   */
  const onReduceAccordToName = (params: any, data: any) => {
    if (_.isEmpty(data)) return;
    // 先勾选后选择时间，此时只存了时间没有其余信息
    if (arFileSave[data?.name]) {
      arFileSave[data.name] = { ...params, ...arFileSave[data?.name] };
      setArFileSave(arFileSave);
      if (arFileSave[data?.name]?.start_time && arFileSave[data?.name]?.end_time) {
        return { ...params, ...arFileSave[data?.name] };
      }
      return params;
    }
    // 不存在则添加
    const cloneParams = _.cloneDeep(params);
    cloneParams.start_time = 0;
    cloneParams.end_time = 0;
    arFileSave[data.name] = cloneParams;
    setArFileSave(arFileSave);
    return params;
  };

  /**
   * 预览数据表解析规则传参处理
   */
  const onPreview = (name?: any, source?: any, data?: any) => {
    const curSource = source || selectedSource;
    const cloneData = _.cloneDeep(parsingTreeChange);
    const { delimiter, quotechar, escapechar } = defaultParsingRule;
    if (
      ['as7', 'as'].includes(curSource.data_source) &&
      curSource.dataType === 'structured' &&
      sourceFileType === 'csv'
    ) {
      const clickFileParse = _.filter(cloneData, (item: any) => item?.key === name);
      if (_.isEmpty(clickFileParse)) {
        onPreviewParamHandle(name, source, { delimiter, quotechar, escapechar }, true);
      } else {
        onPreviewParamHandle(name, source, clickFileParse?.[0]?.parsing, true);
      }
    } else if (curSource.data_source === 'AnyRobot') {
      arDataRef.current = data;
      onPreviewParamHandle(name, source, {}, false, data);
    } else {
      onPreviewParamHandle(name, source);
    }
  };

  /**
   * 树选择
   * @param keys 选中的key, 是json字符串列表
   */
  const onTreeChange = (keys: any[], fix?: string) => {
    setCheckedKeys(keys);
    postfix.current = fix;
  };

  /**
   * 点击确认添加
   */
  const onHandleOk = () => {
    if (!checkedKeys.length) {
      // return message.error(intl.get('createEntity.importNullTip'));
      return message.error({
        content: intl.get('createEntity.importNullTip'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }
    let type = '';
    let data: any = checkedKeys;
    let fileData: any = [];
    let keyAll: any = [];
    let cloneData: any = [];
    let isErrorTip: any = false;
    const selectedValue: any = { ...selectedSource };
    switch (true) {
      case [DS_SOURCE.hive, DS_SOURCE.mysql, DS_SOURCE.clickhouse].includes(selectedValue.data_source):
        type = 'sql';
        isErrorTip = onSelectedErrorTip(checkedKeys);
        break;
      case [DS_SOURCE.postgresql, DS_SOURCE.kingbasees, DS_SOURCE.sqlserver].includes(selectedValue.data_source):
        type = 'king';
        isErrorTip = onSelectedErrorTip(checkedKeys);
        break;
      case selectedValue.data_source === DS_SOURCE.mq:
        type = 'rabbitmq';
        isErrorTip = onSelectedErrorTip(checkedKeys);
        data = selectedValue;
        break;
      case selectedValue.data_source === DS_SOURCE.AnyRobot:
        data = onHandleArSelected(checkedKeys, selectedValue);
        type = 'AnyRobot';
        break;
      default:
        type = 'as';
        selectedValue.postfix = postfix.current || 'csv';

        fileData = checkedKeys.map((d: string) => [_.pick(JSON.parse(d), 'docid', 'name', 'type')]);
        cloneData = onHandleAsSelected(fileData);
        if (_.isEmpty(cloneData)) return;
        keyAll = _.map(cloneData, (item: any) => item?.key);
        data = _.map(fileData, (item: any) => {
          _.map(cloneData, (i: any) => {
            if (item?.[0]?.docid === i?.key) {
              const handleData = { ...item?.[0], ...i?.parsing };
              item[0] = handleData;
            }
          });
          return item;
        });
    }

    if (isErrorTip) return;
    if (selectedValue.data_source === DS_SOURCE.AnyRobot && _.isEmpty(data)) return;
    onOk({ type, selectedValue, data }, sourceFileType);
  };

  /**
   * 类型为AnyRobot时返回选择的文件数据
   */
  const onHandleArSelected = (keys: any, selectedValue: any) => {
    const fileList: any = [];
    _.map(_.cloneDeep(keys), (item: any) => {
      if (arFileSave[item]) {
        fileList.push({
          id: String(arFileSave[item]?.name),
          name: item,
          start_time: Number(arFileSave[item]?.start_time),
          end_time: Number(arFileSave[item]?.end_time),
          type: 'AnyRobot'
        });
      }
    });

    const isExitEmpty = onIsExitEmptyTime(fileList, keys);
    if (!isExitEmpty) {
      return fileList;
    }
    return {};
  };

  /**
   * 选择的数据中是否有没有选择的时间
   */
  const onIsExitEmptyTime = (data: any, keys: any) => {
    const cloneData = _.cloneDeep(data);
    const emptyAllName: any = [];
    _.map(cloneData, (item: any) => {
      if (!item?.start_time || !item?.end_time) {
        emptyAllName.push(item?.name);
      }
    });
    let isFileError = false;
    // 没有设置时间
    if (!_.isEmpty(emptyAllName) && !_.isEmpty(data)) {
      message.error(intl.get('workflow.information.pleaseSelectTime'));
      const error = _.reduce(
        emptyAllName,
        (pre: any, key: any) => {
          pre[key] = intl.get('workflow.information.pleaseSelectTime');
          return pre;
        },
        {}
      );
      const errors = { ...errorMapRef.current.error, ...error };
      errorMapRef.current.error = errors;
      setErrorMap(errors);
      isFileError = true;
    }
    if (isFileError) return true;
    // 文件解析有问题
    // _.map(_.cloneDeep(errorMapRef.current.error), (item: any, index: any) => {
    //   if (keys.includes(index)) {
    //     isFileError = true;
    //   }
    // });
    // if (isFileError) {
    //   message.error(intl.get('workflow.information.errorTip'));
    //   return true;
    // }
    isFileError = onSelectedErrorTip(keys);
    return isFileError;
  };

  /**
   * 选择文件是否存在错误
   */
  const onSelectedErrorTip = (keys: any) => {
    let isFileError = false;
    _.map(_.cloneDeep(errorMapRef.current.error), (item: any, index: any) => {
      if (keys.includes(index)) {
        isFileError = true;
      }
    });
    if (isFileError) {
      message.error(intl.get('workflow.information.errorTip'));
      return true;
    }
    return isFileError;
  };

  /**
   * 类型为as时确认后处理解析规则
   */
  const onHandleAsSelected = (data: any) => {
    if (sourceFileType !== 'csv') return data;
    let newParsing: any = [];
    const cloneData = _.cloneDeep(parsingTreeChange);
    const fileData = _.cloneDeep(data);
    const { delimiter, quotechar, escapechar } = defaultParsingRule;
    const docidData: any = []; // 选中的文件
    _.map(fileData, (item: any) => {
      _.map(item, (i: any) => docidData.push(i?.docid));
    });
    // 全部
    const keyAll = _.map(cloneData, (item: any) => item?.key);
    // 点击但没编辑的
    const filterKey = _.filter(docidData, (item: any) => !keyAll.includes(item));
    const cloneFilterKey = _.cloneDeep(filterKey);
    let isSelectedFileError: any = false;
    _.map(_.cloneDeep(docidData), (item: any) => {
      if (errorMapRef?.current?.error[item]) {
        isSelectedFileError = true;
      }
    });
    if (isSelectedFileError) {
      message.error(intl.get('workflow.information.errorTip'));
      return {};
    }
    if (!_.isEmpty(cloneFilterKey)) {
      _.map(cloneFilterKey, (i: any) => {
        newParsing.push({ key: i, parsing: { delimiter, quotechar, escapechar } });
      });
      const existKey = _.filter(cloneData, (item: any) => docidData.includes(item?.key));
      newParsing = [...newParsing, ...existKey];
    } else {
      newParsing = _.filter(cloneData, (item: any) => docidData.includes(item?.key));
    }
    setParsingFileSet(newParsing);
    return newParsing;
  };

  /**
   * 实时保存修改的解析规则
   */
  const onParsingChange = (type: string, value: string) => {
    setRequestId(requestId + 1);
    requestIdRef.current.id += 1;
    switch (type) {
      case 'delimiter':
        dispatchLoading({ ...loading, delimiter: value });
        onPreviewParamHandle(selectedKey, '', { ...loading, delimiter: value });
        onSaveParsing(selectedKey, { ...loading, delimiter: value });
        break;
      case 'quotechar':
        dispatchLoading({ ...loading, quotechar: value });
        onPreviewParamHandle(selectedKey, '', { ...loading, quotechar: value });
        onSaveParsing(selectedKey, { ...loading, quotechar: value });
        break;
      case 'escapechar':
        dispatchLoading({ ...loading, escapechar: value });
        onPreviewParamHandle(selectedKey, '', { ...loading, escapechar: value });
        onSaveParsing(selectedKey, { ...loading, escapechar: value });
        break;
      default:
        break;
    }
  };

  /**
   * request_id恢复默认
   */
  const onDefaultRequestId = () => {
    setRequestId(0);
    requestIdRef.current.id = 0;
  };

  const onSaveParsing = (name: any, data: any) => {
    // 解析规则和文件一一对应
    const { delimiter, quotechar, escapechar } = data;
    let cloneParsingData: any = _.cloneDeep(parsingTreeChange);
    const keyAll = _.map(cloneParsingData, (item: any) => item?.key) || [];
    // 新增
    if (!keyAll.includes(name)) {
      cloneParsingData = [
        ...cloneParsingData,
        {
          key: name,
          parsing: {
            delimiter: defaultParsingRule?.delimiter,
            quotechar: defaultParsingRule?.quotechar,
            escapechar: defaultParsingRule?.escapechar
          }
        }
      ];
    }
    const newParsingFileSet = _.map(cloneParsingData, (item: any) => {
      // 更改
      if (item?.key === name) {
        item.parsing = { delimiter, quotechar, escapechar };
        return item;
      }
      return item;
    });

    setParsingFileSet(newParsingFileSet);
    setParsingTreeChange(newParsingFileSet);
  };

  /**
   * 解析规则失去焦点时，空输入框恢复默认解析规则且可编辑
   */
  const onBlur = () => {
    const { delimiter, quotechar, escapechar } = defaultParsingRule;
    const cloneData = _.cloneDeep(parsingTreeChange);
    const filterData = _.map(cloneData, (item: any) => {
      if (item?.key === selectedKey) {
        if (!item.parsing.delimiter) {
          item.parsing.delimiter = delimiter;
          dispatchLoading({ ...loading, delimiter });
          onPreviewParamHandle(selectedKey, '', { ...loading, delimiter });
        }
        if (!item.parsing.quotechar) {
          item.parsing.quotechar = quotechar;
          dispatchLoading({ ...loading, quotechar });
          onPreviewParamHandle(selectedKey, '', { ...loading, quotechar });
        }
        if (!item.parsing.escapechar) {
          item.parsing.escapechar = escapechar;
          dispatchLoading({ ...loading, escapechar });
          onPreviewParamHandle(selectedKey, '', { ...loading, escapechar });
        }
        return item;
      }
      return item;
    });
    setParsingTreeChange(filterData);
  };

  /**
   * 设置时间实时预览
   */
  const onSetTimeToPreview = (data: any) => {
    const source = { data_source: 'AnyRobot', id: data?.id };
    const arData = {
      id: data?.name,
      name: selectedKey
    };
    onPreviewParamHandle(selectedKey, source, {}, false, arData);
  };

  /**
   * 切换文件
   */
  const onDataSheetChange = (keys: any) => {
    setCheckedKeys(keys);
    onReduceAccordToName({}, { name: keys[keys.length - 1] });
  };

  return (
    <UniversalModal
      title={intl.get('createEntity.importNodeBatchT')}
      className="flow-3-entity-import-modal"
      visible={visible}
      width={1000}
      onOk={onHandleOk}
      onCancel={() => {
        onCancel();
      }}
    >
      <div className="m-main kw-flex">
        {/* <div className="kw-flex kw-h-100 kw-w-100"> */}
        <div className="kw-flex kw-w-100" style={{ height: 'calc(100% - 59px)' }}>
          <div className="data-box kw-flex-column">
            <LoadingMask loading={loading.left} />

            {/* 数据源 */}
            <div className="rows kw-align-center kw-mt-5">
              <div className="row-label">{intl.get('workflow.information.dataName')}</div>
              <div className="row-content">
                <Select
                  className="kw-w-100"
                  // optionFilterProp="label"
                  // allowClear
                  // showArrow
                  // showSearch
                  value={selectedSource?.id}
                  onChange={onSourceChange}
                  getPopupContainer={triggerNode => triggerNode.parentElement}
                  notFoundContent={<Empty image={kongImg} description={intl.get('global.noData')} />}
                >
                  {_.map(sourceData, item => (
                    <Option key={item.id} value={item.id} label={item.dsname}>
                      <div className="kw-flex">
                        <div className="kw-mr-2">
                          <img className="source-icon" src={ONTO_SOURCE_IMG_MAP[item.data_source]} alt="KWeaver" />
                        </div>
                        <div className="source-info">
                          <div className="kw-c-header kw-ellipsis" title={item.dsname}>
                            {item.dsname}
                          </div>
                          <div className="kw-c-subtext kw-ellipsis">{item.ds_path || '--'}</div>
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </div>
            </div>

            {selectedSource.data_source === DS_SOURCE.mq ? (
              // 队列名称
              <div className="rows kw-align-center kw-mt-5">
                <div className="row-label">{intl.get('datamanagement.queue')}</div>
                <div className="row-content">
                  <Input value={selectedSource.queue} disabled />
                </div>
              </div>
            ) : (
              // 数据列表
              <div className="rows tree-row kw-flex kw-mt-5">
                <div className="row-label">{intl.get('workflow.information.tables')}</div>
                <div className="row-content">
                  {['mysql', 'hive', 'clickhouse', 'AnyRobot'].includes(selectedSource.data_source) && (
                    <DataSheet
                      key={selectedSource.id}
                      source={selectedSource}
                      checkedValues={checkedKeys}
                      selectedKey={selectedKey}
                      errors={errorMap}
                      extraTip={intl.get('createEntity.predictTip')}
                      onChange={keys => onDataSheetChange(keys)}
                      onNameClick={onPreview}
                    />
                  )}

                  {['as7', 'sqlserver', 'kingbasees', 'postgresql'].includes(selectedSource.data_source) && (
                    <FileTree
                      key={selectedSource.id}
                      source={selectedSource}
                      checkedKeys={checkedKeys}
                      selectedKey={selectedKey}
                      errors={errorMap}
                      extraTip={intl.get('createEntity.predictTip')}
                      onChange={onTreeChange}
                      onRowClick={onPreview}
                      setSourceFileType={setSourceFileType}
                      onDefaultRequestId={onDefaultRequestId}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            className={classNames('preview-box kw-flex-column', {
              'kw-pl-0 kw-pr-0': selectedSource.data_source === 'AnyRobot'
            })}
          >
            <LoadingMask loading={loading.right} />
            {/* 流程三数据源弹窗*/}

            {/* 解析规则 */}
            {['as7', 'as'].includes(selectedSource?.data_source) &&
            selectedSource?.dataType === 'structured' &&
            sourceFileType === 'csv' &&
            selectedKey ? (
              <ParsingSetting
                parsingChange={parsingChange}
                setParsingChange={setParsingChange}
                onChange={onParsingChange}
                setRequestId={setRequestId}
                requestId={requestId}
                requestIdRef={requestIdRef}
                parsingFileSet={parsingTreeChange}
                selectedKey={selectedKey}
                defaultParsingRule={defaultParsingRule}
                onBlur={onBlur}
              />
            ) : null}
            <div
              className={classNames('kw-mb-3 kw-c-header', {
                'kw-pl-5 kw-pr-6': selectedSource?.data_source === 'AnyRobot'
              })}
            >
              {intl.get('workflow.information.preview')}
              <span className="kw-ml-2 kw-c-subtext">
                {selectedSource.data_source === DS_SOURCE.mq
                  ? intl.get('workflow.information.showSchema')
                  : intl.get('workflow.information.previewSome')}
              </span>
            </div>

            <div className={classNames('view-wrap', { 'kw-pl-5 kw-pr-6': selectedSource?.data_source === 'AnyRobot' })}>
              <div className={classNames('kw-w-100 kw-h-100', { 'hide-view': viewType !== 'table' })}>
                <PreviewTable showLess data={tableData} shouldCheck={false} />
              </div>
              <div className={classNames('kw-w-100 kw-h-100', { 'hide-view': viewType !== 'json' })}>
                <PreviewJson data={selectedSource.json_schema} />
              </div>
              {(selectedSource.data_source === DS_SOURCE.mq
                ? !selectedSource.json_schema
                : !tableData.length && !loading.right) && (
                <div className="tip-container kw-pl-5 kw-pr-5">
                  <NoDataBox
                    imgSrc={
                      selectedKey ? (errorMapRef?.current?.error[selectedKey] ? invalidFileImg : kongImg) : guideImg
                    }
                    // imgSrc={selectedKey ? (errorMap[selectedKey] ? invalidFileImg : kongImg) : guideImg}
                    desc={
                      selectedKey
                        ? errorMapRef?.current?.error[selectedKey] || intl.get('workflow.information.dataEmpty')
                        : // ? errorMap[selectedKey] || intl.get('workflow.information.dataEmpty')
                          intl.get('workflow.information.addSourceTip')
                    }
                  />
                </div>
              )}
            </div>
            {/* 时间设置 */}
            {selectedSource?.data_source === 'AnyRobot' && selectedKey ? (
              <TimePickerSetting
                arFileSave={arFileSave}
                setArFileSave={setArFileSave}
                selectedKey={selectedKey}
                onSetTimeToPreview={onSetTimeToPreview}
              />
            ) : null}
          </div>
        </div>

        <div className="footer-box">
          {selectedSource?.data_source === 'as7' &&
          selectedSource?.dataType === 'structured' &&
          sourceFileType === 'csv' ? (
            <ParsingRuleSettingModal
              defaultParsingRule={defaultParsingRule}
              setDefaultParsingRule={setDefaultParsingRule}
            />
          ) : null}
          <div className="btn-box">
            <Button className="kw-mr-2" onClick={onCancel}>
              {intl.get('global.cancel')}
            </Button>
            <Button onClick={onHandleOk} type="primary">
              {intl.get('global.ok')}
            </Button>
          </div>
        </div>
      </div>
    </UniversalModal>
  );
};

export default forwardRef(OntoEntityImportModal);
