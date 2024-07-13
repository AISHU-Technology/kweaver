/* eslint-disable max-lines */
import React, { PropsWithChildren, useState, useRef, useEffect, useMemo } from 'react';

import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { ValidateStatus } from 'antd/lib/form/FormItem';
import { Modal, ConfigProvider, Button, Form, Select, Input, Row, Col, Empty, message } from 'antd';

import HOOKS from '@/hooks';
import Format from '@/components/Format';
import DragLine from '@/components/DragLine';
import IconFont from '@/components/IconFont';
import TipModal from '@/components/TipModal';
import { DS_SOURCE, EXTRACT_TYPE } from '@/enums';
import ParamCodeEditor, { ParamEditorRef } from '@/components/ParamCodeEditor';
import { PreviewTable, parseToTable } from '@/components/SourceImportComponent';
import { DsSourceItem, PreviewColumn } from '@/components/SourceImportComponent/types';
import { DataFileType, FileType } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/types';
import { useKnowledgeMapContext } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';
import { ExtractRuleProps } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KMRightContainer/AddDataFileModal/AddDataFileModal';

import servicesCreateEntity from '@/services/createEntity';

import { ExtractItem } from '../types';
import LeftSourceTree from './LeftSourceTree';
import { generateSqlExtractRule } from '../../assistant';
import { SOURCE_IMG_MAP } from '../AddDataFileModal/assistant';
import DataBoard, { DataBoardProps } from '../AddDataFileModal/DataBoard/DataBoard';

import './style.less';
import TemplateModal from '@/components/TemplateModal';

interface SqlExtractModalProps {
  onCancel: () => void; // 关闭弹框
  editData: DataFileType | null; // 编辑的数据
  listData: ExtractItem[]; // 数据抽取列表中的数据
  isAutoMapPropsSignRef: React.MutableRefObject<boolean>; // 是否进行自动属性映射标识
  x6ContainerRef?: React.MutableRefObject<any>;
}

interface FormValues {
  sql: string;
  sql_name: string;
  ds_id: number;
}

// const MIN_WIDTH = 480;
// const MAX_WIDTH = 1000;
const MIN_HEIGHT = 140;
const MAX_HEIGHT = 585;
// const MAX_HEIGHT = 640;
const FormItem = Form.Item;

/**
 * SQL 抽取弹框组件
 */
const SqlExtractModal: React.FC<PropsWithChildren<SqlExtractModalProps>> = props => {
  const {
    knowledgeMapStore: { graphId, graphKMap, selectedG6Node, selectedG6Edge, currentDataFile },
    setKnowledgeMapStore
  } = useKnowledgeMapContext();
  const prefixLocale = 'workflow.information'; // 国际化前缀
  const { onCancel, editData, listData, isAutoMapPropsSignRef, x6ContainerRef } = props;
  const language = HOOKS.useLanguage();
  const { width: screenWidth } = HOOKS.useWindowSize();
  const [sqlResultHeight, setSqlResultHeight] = useState<any>(400);
  // const [sqlResultHeight, setSqlResultHeight] = useState<number>(1000);
  const [dataSourceOptions, setDataSourceOptions] = useState<DsSourceItem[]>([]); // 数据源名字段下拉框的所有候选项
  const [fileNameValidate, setFileNameValidate] = useState({
    status: undefined as ValidateStatus | undefined,
    help: undefined as undefined | string
  });
  const [sqlValidate, setSqlValidate] = useState({
    status: undefined as ValidateStatus | undefined,
    help: undefined as undefined | string
  });
  const [dataBoardProps, setDataBoardProps] = useState<DataBoardProps>({
    loading: false,
    data: [],
    error: '',
    type: 'table',
    tableHeaderCheckedKey: [],
    dataFile: {},
    partitionData: {} // 分区数据 (key就是分区字段，value就是分区变量)
  });
  const [tipsModalVisible, setTipsModalVisible] = useState<boolean>(false);

  const allExtractRuleForSelectedDataFile = useRef<ExtractRuleProps[]>([]);

  const editorRef = useRef<ParamEditorRef>(null);
  const resetExtractRule = useRef<boolean>(false); // 是否重置抽取规则
  const lastFormValues = useRef<any>(); // 点击预览按钮之前的表单的值
  const [form] = Form.useForm();
  const [sqlChangeTips, setSqlChangeTips] = useState<boolean>(false);
  const [isAdd, setIsAdd] = useState(false);
  // 添加按钮高亮与灰置
  const [isDisableClick, setIsDisableClick] = useState(false); // 是否可以向编辑器添加
  const [isAddDisable, setIsAddDisable] = useState(true); // 是否禁止添加

  useEffect(() => {
    getDataSourceOptions();
  }, []);

  HOOKS.useDeepCompareEffect(() => {
    if (editData && dataSourceOptions.length > 0) {
      initEditData();
    }
  }, [editData, dataSourceOptions]);

  /**
   * 编辑模式下，使用编辑数据初始化表单
   */
  const initEditData = () => {
    const formValues = {
      sql: editData!.files[0].file_source,
      sql_name: editData!.files[0].file_name,
      ds_id: editData?.ds_id
    };
    form.setFieldsValue(formValues);
    lastFormValues.current = formValues;
    resetExtractRule.current = true;
    handlePreview(formValues as FormValues);
    setTimeout(() => {
      editorRef.current?.editorInstance.refresh();
    }, 100);
  };

  /**
   * 获取数据源名的Options
   */
  const getDataSourceOptions = async () => {
    const data = await servicesCreateEntity.getFlowSource({ id: graphId, type: 'unfilter' });
    if (data) {
      const { res, Description } = data;
      if (res) {
        const filterArr = [DS_SOURCE.mq, DS_SOURCE.as, DS_SOURCE.AnyRobot];
        const dataSourceRes = (res?.df ?? []).filter((item: any) => !filterArr.includes(item.data_source));
        setDataSourceOptions(dataSourceRes);
        if (!editData) {
          // 非编辑模式默认选中第一个
          const selectedDS = dataSourceRes[0];
          form.setFieldsValue({ ds_id: selectedDS.id });
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
   * 拖拽改变宽度
   * @param offset
   */
  const onHeightDrag = (offset: any) => {
    const height = sqlResultHeight - offset;
    const curHeight = height > MAX_HEIGHT ? MAX_HEIGHT : height < MIN_HEIGHT ? MIN_HEIGHT : height;
    setSqlResultHeight(curHeight);
  };

  /**
   * 确定的点击事件
   */
  const handleOk = _.debounce(async () => {
    const values = lastFormValues.current;
    // 每次点击确定对于sql_name都用最新的
    values.sql_name = form.getFieldsValue().sql_name;
    const validatorRes = await validateFileNameRepeat(values);
    if (validatorRes) return;
    if (dataBoardProps.error) return;
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
    if (hasRelationDataFile && !editData) {
      setTipsModalVisible(true);
    } else {
      handleSaveData(values);
    }
  }, 300);

  /**
   * 预览按钮的点击事件
   */
  const onPreview = _.debounce(() => {
    form.submit();
  }, 300);

  /**
   * 真正的执行预览事件
   */
  const handlePreview = async (values: FormValues) => {
    const selectedDS = dataSourceOptions.find(item => item.id === values.ds_id)!;
    const dataFile = {
      file_name: values.sql_name,
      partition_usage: false,
      partition_infos: {}, // 分区信息
      data_source: selectedDS.data_source,
      extract_type: EXTRACT_TYPE.SQL,
      ds_id: values.ds_id
    };

    setDataBoardProps(preState => ({
      ...preState,
      loading: true
    }));
    const dataResult: any = await getDataByFile(values);
    if (dataResult.error) {
      setDataBoardProps(prevState => ({
        ...prevState,
        dataFile,
        loading: false,
        error: dataResult.error
      }));
      return {
        extractRuleKeys: [],
        error: dataResult.error
      };
    }
    const rulesResult: any = await getExtractRule(values);
    if (rulesResult.error) {
      setDataBoardProps(prevState => ({
        ...prevState,
        dataFile,
        loading: false,
        error: rulesResult.error
      }));
      return {
        extractRuleKeys: [],
        error: rulesResult.error
      };
    }
    // 此处是设置默认抽取规则的地方
    allExtractRuleForSelectedDataFile.current = rulesResult.rules; // 储存接口返回的所有的抽取规则

    let tableHeaderCheckedKey = allExtractRuleForSelectedDataFile.current.map(item => item.property.property_field);
    if (resetExtractRule.current) {
      if (editData && dataBoardProps.tableHeaderCheckedKey!.length === 0) {
        const oldRuleFiled = editData.extract_rules[0].property.map(item => item.property_field);
        tableHeaderCheckedKey = tableHeaderCheckedKey.filter(key => oldRuleFiled.includes(key));
      }
    } else {
      tableHeaderCheckedKey = tableHeaderCheckedKey.filter(key => dataBoardProps.tableHeaderCheckedKey!.includes(key));
    }
    resetExtractRule.current = false; // 抽取规则重置完，标识设置为false
    setDataBoardProps(prevState => ({
      ...prevState,
      loading: false,
      data: dataResult.tables,
      error: dataResult.error || rulesResult.error,
      type: 'table',
      tableHeaderCheckedKey,
      dataFile
    }));
    return {
      extractRuleKeys: tableHeaderCheckedKey,
      error: dataResult.error || rulesResult.error
    };
  };

  /**
   * 获取样本数据
   * @param file
   */
  const getDataByFile = (formValues: FormValues) => {
    // const formValues = form?.getFieldsValue();
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async resolve => {
      const params = { ds_id: formValues.ds_id, sql: formValues.sql };
      let tables: any = [];
      let errorTip = '';
      try {
        const { res } = (await servicesCreateEntity.sqlExtractPreview(params)) || {};
        if (res) {
          tables = parseToTable(res);
        }
      } catch (error) {
        errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      }
      resolve({ tables, error: errorTip });
    });
  };

  /**
   * 获取抽取规则
   * @param file
   * @param postfix 文件后缀名
   */
  const getExtractRule = (formValues: FormValues) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async resolve => {
      let rules: any = [];
      let errorTip = '';
      try {
        const { res } = (await servicesCreateEntity.sqlExtract(formValues)) || {};
        if (res) {
          const deepCloneData = _.cloneDeep(res);
          rules = generateSqlExtractRule(deepCloneData.file_name, deepCloneData.property);
        }
      } catch (error) {
        errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      }
      resolve({ rules, error: errorTip });
    });
  };

  /**
   * 保存数据
   */
  const handleSaveData = async (formValues: FormValues) => {
    const tableHeaderCheckedKey: string[] = dataBoardProps.tableHeaderCheckedKey!;

    const selectedDS = dataSourceOptions.find(item => item.id === formValues.ds_id)!;
    const extractRule = allExtractRuleForSelectedDataFile.current.filter(item =>
      tableHeaderCheckedKey?.includes(item.property.property_field)
    );
    // 重新组合接口需要的抽取规则数据格式
    const extractRulesProperty = extractRule.map(item => ({
      column_name: item.property.column_name,
      property_field: item.property.property_field
    }));

    const file: DataFileType = {
      ds_id: formValues.ds_id,
      data_source: selectedDS.data_source,
      ds_path: selectedDS.ds_path,
      extract_type: EXTRACT_TYPE.SQL,
      extract_rules: [
        {
          entity_type: form.getFieldsValue().sql_name,
          property: extractRulesProperty
        }
      ],
      files: [
        {
          file_name: form.getFieldsValue().sql_name,
          file_path: selectedDS.ds_path,
          file_source: formValues.sql
        }
      ],
      x: 0,
      y: 0
    };

    // hive 数据源 必须要有下面两个属性
    if (selectedDS.data_source === DS_SOURCE.hive) {
      file.partition_usage = false;
      file.partition_infos = {};
    }

    // 编辑模式下将graphKMap中的files中的数据替换掉
    if (editData) {
      const graphKMapFiles = _.cloneDeep(graphKMap?.files);
      const fileIndex = graphKMapFiles?.findIndex(item => item.extract_rules[0].entity_type === formValues.sql_name);
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
    if (!editData) {
      isAutoMapPropsSignRef.current = true;
    }

    setKnowledgeMapStore(preStore => ({
      ...preStore,
      currentDataFile: [file],
      firstAddFile: !editData
    }));
    onCancel && onCancel();
  };

  /**
   * 校验通过回调事件
   * @param values
   */
  const onValidateFinish = async (values: FormValues) => {
    if (fileNameValidate.status === 'error') return;
    handlePreview(values);
  };

  /**
   * 校验数据文件名称是否重复
   */
  const validateFileNameRepeat = async (values: FormValues) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async resolve => {
      const sql_name = values.sql_name;
      if (editData && editData.files[0].file_name === sql_name) {
        // 说明编辑前后没有更改名称
        resolve(false);
        return;
      }

      // 同一个知识图谱内，所有通过SQL创建的都不能重名（包括接口返的与前端临时存的）
      const allSqlDataFileForList = graphKMap.files.filter(item => item.extract_type === EXTRACT_TYPE.SQL);
      const target2 = allSqlDataFileForList.find(item => {
        if (item.files[0].file_name === sql_name) {
          if (currentDataFile.length > 0 && currentDataFile[0].files[0].file_name === sql_name) {
            return false;
          }
          return true;
        }
        return false;
      });

      // 获取选中的数据库中所有的数据表
      // 与选择的数据源下的所有表名不能重名
      let target3 = '';
      const selectedDS = dataSourceOptions.find(item => item.id === values.ds_id);
      const { res, ErrorDetails } =
        (await servicesCreateEntity.getDataList({
          ds_id: selectedDS?.id,
          data_source: selectedDS?.data_source,
          postfix: ''
        })) || {};
      if (res) {
        if ([DS_SOURCE.sqlserver, DS_SOURCE.kingbasees, DS_SOURCE.postgresql].includes(selectedDS!.data_source)) {
          const dirNames = Object.keys(res.output);
          for (let i = 0; i < dirNames.length; i++) {
            const key = dirNames[i];
            target3 = res.output[key].find((item: string) => item === sql_name);
            if (target3) break;
          }
        }
        if ([DS_SOURCE.mysql, DS_SOURCE.hive, DS_SOURCE.clickhouse].includes(selectedDS!.data_source)) {
          target3 = res.output.find((item: string) => item === sql_name);
        }
      }

      if (ErrorDetails) {
        setDataBoardProps(preState => ({
          ...preState,
          error: ErrorDetails,
          data: []
        }));
        resolve(true);
      }
      if (target2 || target3) {
        setFileNameValidate({
          status: 'error',
          help: intl.get('global.repeatName')
        });
        resolve(true);
      }
      resolve(false);
    });
  };

  const isRightAreaShow = useMemo(
    () => dataBoardProps.data.length > 0 || !!dataBoardProps.error,
    [dataBoardProps.data.length, dataBoardProps.error]
  );

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
   * 右侧面板同步按钮的点击事件
   */
  const onRefreshData = async () => {
    const { error } = await handlePreview(lastFormValues.current);
    if (!error) {
      message.success({
        content: intl.get('workflow.knowledgeMap.syncDataSuccessTips'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }
  };

  const prefixCls = 'sqlExtractModal';

  const viewChangeTips = () => {
    const formValues = form.getFieldsValue();
    if (
      lastFormValues.current &&
      (formValues.ds_id !== lastFormValues.current?.ds_id || formValues.sql !== lastFormValues.current?.sql)
    ) {
      return true;
    }
    return false;
  };

  /**
   * 清空
   */
  const onClear = () => {
    setSqlChangeTips(true);
    form?.resetFields(['sql']);
    editorRef?.current?.removeText();
  };

  /**
   * 文件名、属性添加至光标后
   */
  const onAdd = (value: string) => {
    editorRef?.current?.insertText(value);
  };

  return (
    <>
      <TemplateModal
        maskClosable={false}
        onCancel={onCancel}
        width="100%"
        className={prefixCls}
        visible
        title={editData ? intl.get('workflow.knowledgeMap.sqlEdit') : intl.get(`${prefixLocale}.sqlExtract`)}
        destroyOnClose
        footer={null}
        fullScreen
      >
        <div className={`${prefixCls}-container kw-flex-column`}>
          <div className="kw-flex" style={{ flex: 1, height: 0, position: 'relative' }}>
            <div className="left-list kw-p-6">
              <LeftSourceTree
                dataSourceOptions={dataSourceOptions}
                prefixLocale={prefixLocale}
                form={form}
                onAdd={onAdd}
                isAdd={isAdd}
                setIsAdd={setIsAdd}
                editData={editData}
                setSqlChangeTips={setSqlChangeTips}
                lastFormValues={lastFormValues}
                isAddDisable={isAddDisable}
              />
            </div>
            <div className={`${prefixCls}-form kw-p-6 kw-border-r kw-flex kw-h-100`}>
              <Form
                className="kw-flex-column"
                style={{ height: isRightAreaShow || !!editData ? `calc(100% - ${sqlResultHeight}px)` : '100%' }}
                form={form}
                layout="vertical"
                onFinish={onValidateFinish}
              >
                <FormItem
                  label={intl.get(`${prefixLocale}.sqlExtractFormItemDataFile`)}
                  name="sql_name"
                  validateFirst
                  rules={[
                    { required: true, message: intl.get('global.noNull') },
                    { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
                    { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: intl.get('global.onlyNormalName') }
                  ]}
                  validateStatus={fileNameValidate.status}
                  validateTrigger={['onChange', 'onBlur']}
                  help={fileNameValidate.help}
                >
                  <Input
                    onChange={() => {
                      fileNameValidate.status === 'error' &&
                        setFileNameValidate({
                          status: undefined,
                          help: undefined
                        });
                    }}
                    autoComplete="off"
                    className="sql-name-input"
                    placeholder={intl.get(`${prefixLocale}.inputPlaceholder`)}
                  />
                </FormItem>
                <FormItem noStyle shouldUpdate>
                  <div className="kw-flex right-sql-title-and-btn kw-mt-4 kw-pl-4 kw-pt-1 kw-pb-1">
                    <div className="kw-flex sql-title-left">
                      <div className="kw-mr-5">{intl.get('dpapiService.scriptDebugging')}</div>
                      <Format.Button
                        type="icon"
                        size="small"
                        tip={intl.get(`${prefixLocale}.sqlExtractPreview`)}
                        onClick={() => {
                          resetExtractRule.current = true;
                          lastFormValues.current = form.getFieldsValue();
                          setSqlChangeTips(false);
                          onPreview();
                        }}
                        className={classNames(
                          dataBoardProps.loading || !form.getFieldValue('sql') ? '' : 'kw-c-primary'
                        )}
                        disabled={dataBoardProps.loading || !form.getFieldValue('sql')}
                        style={{ padding: 0 }}
                      >
                        <IconFont type="icon-qidong" />
                      </Format.Button>
                      <Format.Button type="icon" size="small" onClick={onClear} tip={intl.get('global.delete')}>
                        <IconFont type="icon-quanbuyichu" />
                      </Format.Button>
                    </div>

                    <div className="kw-flex sql-title-right kw-pr-4 kw-ellipsis">
                      {(viewChangeTips() || (sqlChangeTips && lastFormValues.current)) && (
                        <div className="kw-align-center">
                          <span className="kw-align-center">
                            <IconFont className="kw-c-error" style={{ fontSize: 16 }} type="icon-shibai" />
                            <span className="kw-ml-2 kw-c-error">{intl.get('workflow.knowledgeMap.sqlChangeTip')}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </FormItem>
                <FormItem
                  style={{ margin: 0 }}
                  name="sql"
                  required
                  className={`${prefixCls}-codeEditor kw-flex-item-full-height kw-flex-column`}
                  validateStatus={sqlValidate.status}
                  help={sqlValidate.help}
                >
                  <ParamCodeEditor
                    ref={editorRef}
                    options={{
                      placeholder: intl.get(`${prefixLocale}.sqlExtractFormItemSqlPlaceholder`)
                    }}
                    height="100%"
                    onChange={(value: string) => {
                      if (value && value !== lastFormValues.current?.sql) {
                        setSqlChangeTips(true);
                      } else {
                        setSqlChangeTips(false);
                      }

                      setSqlValidate(prevState => ({
                        ...prevState,
                        status: undefined
                      }));
                    }}
                  />
                </FormItem>
              </Form>
              <DragLine
                className="dragLine kw-ml-6"
                style={{
                  top: isRightAreaShow || !!editData ? `calc(100% - ${sqlResultHeight + 40}px)` : '0px',
                  display: !isRightAreaShow ? 'none' : 'block'
                }}
                onChange={(x, y) => onHeightDrag(y)}
              />
              {(isRightAreaShow || !!editData) && (
                <div
                  className={`${prefixCls}-result kw-flex-column kw-w-100 kw-mt-4`}
                  style={{ height: sqlResultHeight }}
                >
                  <div className="kw-flex-item-full-height" style={{ marginLeft: '-24px', marginRight: '-24px' }}>
                    <DataBoard
                      {...dataBoardProps}
                      onTableHeaderCheckboxChange={onTableHeaderCheckboxChange}
                      onRefreshData={onRefreshData}
                      operateType="sql"
                    />
                  </div>

                  {/* <LoadingMask loading={dataBoardProps.loading!} style={{ zIndex: 99 }} />*/}
                </div>
              )}
            </div>
          </div>
          {isRightAreaShow || !!editData ? (
            <>
              {!dataBoardProps.error && (
                <div className={`${prefixCls}-footer`}>
                  <ConfigProvider autoInsertSpaceInButton={false}>
                    <Button type="default" className="kw-mr-3" onClick={onCancel} disabled={dataBoardProps.loading}>
                      {intl.get('global.cancel')}
                    </Button>
                    <Button type="primary" onClick={handleOk} disabled={dataBoardProps.loading}>
                      {intl.get('global.save')}
                    </Button>
                  </ConfigProvider>
                </div>
              )}
            </>
          ) : null}
        </div>
      </TemplateModal>
      <TipModal
        open={tipsModalVisible}
        onClose={() => setTipsModalVisible(false)}
        onCancel={() => setTipsModalVisible(false)}
        onOk={() => {
          setTimeout(() => {
            // 替换已经关联的文件的话，需要先清除之前的映射关系
            x6ContainerRef && x6ContainerRef.current.clearMap();
            const values = form.getFieldsValue();
            handleSaveData(values);
          }, 0);
        }}
        title={intl.get('workflow.knowledgeMap.addDataFileModalTitle')}
        content={intl.get('workflow.knowledgeMap.addDataFileModalContent')}
      />
    </>
  );
};

export default SqlExtractModal;
