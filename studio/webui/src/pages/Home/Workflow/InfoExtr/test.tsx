import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { Button, Modal, ConfigProvider, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import _ from 'lodash';

import { changeAnyDataLang } from '@/reduxConfig/actions';
import servicesCreateEntity from '@/services/createEntity';
import serviceWorkflow from '@/services/workflow';

import ScrollBar from '@/components/ScrollBar';
import { getPostfix } from '@/utils/handleFunction';

import ShowTable from './ShowTable';
import ModalContent from './ModalContent';
import SourceList from './SourceList';
import RuleList from './RuleList';
import {
  SourceType,
  ExtractType,
  generateGraph,
  transExtractData,
  handleStep3Data,
  updateDsName,
  createSource,
  removeRepeatDs
} from './assistFunction';

import noInfoImg from '@/assets/images/flow4Empty.svg';
import './style.less';

const ENTITY = 'entity_type'; // 抽取规则的实体名称
const FIELD = 'property_field'; // 抽取规则的属性字段
const MQ = 'rabbitmq';
const EXTRACT_ERROR_CODE: Record<number, string> = {
  500002: 'createEntity.sourceIncorrect',
  500006: 'createEntity.sourceNoexist',
  500009: 'createEntity.fileNoExist',
  500010: 'createEntity.fileNotPre',
  500011: 'createEntity.someFileNotPre',
  500013: 'createEntity.tokenError'
};
const PREVIEW_ERROR_CODE: Record<number | string, string> = {
  500001: 'createEntity.fileNoexist',
  500002: 'createEntity.sourceIncorrect',
  500006: 'createEntity.sourceNoexist',
  500013: 'workflow.information.as7BeOver',
  '500009-file': 'workflow.information.fileNoExist',
  '500009-dir': 'workflow.information.nodir'
};

const InfoExtr = (props: any, ref: React.Ref<any>) => {
  const {
    next,
    prev,
    graphId,
    current,
    useDs,
    setUseDs,
    infoExtrData,
    setInfoExtrData,
    dataSourceData,
    ontoData,
    anyDataLang
  } = props;
  const preCurrent = useRef(0); // 使用ref hook 模拟 componentDidUpdate
  const modalContentRef = useRef<any>(); // 弹框内容的ref
  const dslistScrollRef = useRef<any>(); // 文件列表的滚动条ref
  const boardScrollRef = useRef<any>(); // 展示看板的滚动条ref
  const ruleScrollRef = useRef<any>(); // 抽取规则的滚动条ref
  const [addDsVisible, setAddDsVisible] = useState(false); // 选择数据源弹窗是否可见
  const [sourceList, setSourceList] = useState<any[]>([]); // 抽取源文件列表
  const [selectedSource, setSelectedSource] = useState<Record<string, any>>({}); // 选择的抽取源
  const [viewType, setViewType] = useState(''); // 展示看板类型, json, non-json, dir, unSupported
  const [previewData, setPreviewData] = useState<any>([]); // 预览数据
  const [modelList, setModelList] = useState<any[]>([]); // 如果是模型抽取, 提供模型供用户选择
  const [isRuleErr, setIsRuleErr] = useState(false); // 记录规则错误的全局布尔值
  const [preLoading, setPreLoading] = useState(false); // 预览区loading
  const [addLoading, setAddLoading] = useState(false); // 添加文件loading
  const [nextLoading, setNextLoading] = useState(false); // 等待下一步请求

  useImperativeHandle(ref, () => ({
    getFlowData: () => {
      const data = generateGraph(sourceList);
      return data;
    }
  }));

  useEffect(() => {
    fetchModel();
  }, []);

  useEffect(() => {
    if ((current === 3 && preCurrent.current === 2) || current === 0) {
      let dsList: any[] = [];

      // 初次进入, 如果是保存过, 取回数据第四步的数据
      if (infoExtrData.length > 0 && sourceList.length === 0) {
        dsList = transExtractData(infoExtrData);
      }

      if (current === 0) {
        setSourceList(dsList);
        return;
      }

      // 合并第三步数据
      sourceList.length > 0 && (dsList = [...sourceList]);
      const step3Source = handleStep3Data(ontoData[0], dsList);
      dsList = [...dsList, ...step3Source];
      setSourceList(dsList);
      setTimeout(() => {
        if (dslistScrollRef.current) dslistScrollRef.current?.scrollbars?.scrollToBottom();
      }, 0);
    }

    // 模拟componentDidUpdate更新 步骤current
    current !== preCurrent.current && (preCurrent.current = current);
  }, [current, infoExtrData]);

  // 加载预览数据
  useEffect(() => {
    if (!selectedSource.selfId) return;
    const { name, pId, data_source, file_id, extract_type, file_type } = selectedSource;

    // 仅支持预览csv和json
    if (file_type === 'file' && !['csv', 'json'].includes(getPostfix(name))) {
      setViewType('unSupported');
      setPreviewData([]);

      return;
    }

    extract_type === ExtractType.MODEL && file_type === 'dir'
      ? getUnPre(file_id, pId)
      : getPreviewData(pId, data_source, file_id);
  }, [selectedSource.selfId]);

  /**
   * 获取模型
   */
  const fetchModel = async () => {
    const res = await servicesCreateEntity.fetchModelList();
    res && res.res && setModelList(Object.entries(res.res));
  };

  /**
   * 上一步
   */
  const onPrev = () => {
    const dsList = updateDsName(sourceList, dataSourceData);
    saveState(dsList);
    setSelectedSource({});
    setIsRuleErr(false);
    prev();
  };

  /**
   * 下一步
   */
  const onNext = async () => {
    if (nextLoading) return;

    const dsList = updateDsName(sourceList, dataSourceData);
    saveState(dsList);
    if (dsList.length === 0) return message.error(intl.get('workflow.information.placeAddDs'));
    if (dsList.length > 100) return message.error(intl.get('workflow.information.addMaxErr'));
    if (isRuleErr) return showRuleErrMsg();

    // 未配置规则, 不进行下一步
    let hasErr = false;
    let noneIndex = -1;

    dsList.forEach((ds, i) => {
      if (ds.extract_rules.length === 0) {
        hasErr = true;
        noneIndex = noneIndex === -1 ? i : noneIndex;
        ds.isDsError = true;
        ds.errorTip = intl.get('workflow.information.placeAdd');
      }
    });
    setSourceList(dsList);

    if (hasErr && noneIndex !== -1) {
      setSelectedSource(dsList[noneIndex]);
      message.error(intl.get('workflow.information.ruleError'));
      checkTools.scrollToFile(noneIndex);
      return;
    }

    // 校验所有
    const { fileIndex, ruleIndex, err0, err1 } = checkTools.checkAll(dsList);

    if (fileIndex !== -1 && ruleIndex !== -1) {
      setIsRuleErr(true);
      setSelectedSource(dsList[fileIndex]);

      const rules = dsList[fileIndex].extract_rules;
      checkTools.setDisabled(rules, ruleIndex, true, dsList, fileIndex);
      if (err0) checkTools.setErrMsg(ENTITY, rules, ruleIndex, err0, dsList, fileIndex);
      if (err1) checkTools.setErrMsg(FIELD, rules, ruleIndex, err1, dsList, fileIndex);

      showRuleErrMsg();
      checkTools.scrollToFile(fileIndex);
      return;
    }

    const graph_process = generateGraph(dsList);
    setNextLoading(true);
    const graph = { graph_step: 'graph_InfoExt', graph_process };
    const res = await serviceWorkflow.graphEdit(graphId, graph);
    setNextLoading(false);
    if (res?.res) next();
    if (res?.Code || res?.ErrorCode) next(res);
  };

  /**
   * 保存state数据到父组件
   */
  const saveState = (dsList: any[]) => {
    const graph = generateGraph(dsList);
    const used = filterUsedData(sourceList, dataSourceData);

    setSourceList(dsList);
    setInfoExtrData(graph);
    setUseDs(used);
  };

  /**
   * 点击确认按钮添加数据源
   */
  const onAdd = async (e: any) => {
    e.preventDefault();
    const addData = modalContentRef.current.addFile();
    if (!addData) return;
    setAddDsVisible(false);
    setAddLoading(true);
    let data: any[] = [];
    const { selectSource, asSelectValue, dataSheetSelectValue } = addData;
    const { id, data_source, extract_type, extract_model } = selectSource;
    const alertExtractErr = (code: number) => {
      code in EXTRACT_ERROR_CODE && message.error(intl.get(EXTRACT_ERROR_CODE[code]));
    };

    try {
      if (data_source === 'as' || data_source === 'as7') {
        // 选择了AS
        let params;
        let res: { Code: number; res: any };
        const file_list = asSelectValue.map((item: string) => {
          const { docid, name, type } = JSON.parse(item);
          return { docid, type, name };
        });
        // 非结构化 list
        const unstructured_list = asSelectValue.map((item: string) => {
          const { docid, file_path, name } = JSON.parse(item);
          return [docid, file_path, name];
        });

        if (extract_type === ExtractType.STANDARD || extract_type === ExtractType.LABEL) {
          params = {
            ds_id: String(id),
            data_source,
            file_list,
            extract_type,
            step: extract_type === ExtractType.LABEL ? 'Ext' : undefined,
            postfix: file_list[0].name.substring(file_list[0].name.lastIndexOf('.') + 1) // 新加
          };
          res = await servicesCreateEntity.getFileGraphData(params);
        } else {
          params = { model: extract_model, file_list: unstructured_list };
          res = await servicesCreateEntity.unstructuredData(params);
        }

        if (res?.Code && res.Code !== 500001) alertExtractErr(res.Code);
        if (res?.res || (res?.Code && res.Code === 500001)) {
          data = createSource(selectSource, asSelectValue, res.res, true);
        }
      } else {
        // 选择了数据库
        const params = {
          ds_id: String(selectSource.id),
          data_source: selectSource.data_source,
          file_list: dataSheetSelectValue,
          extract_type,
          postfix: ''
        };
        const res = await servicesCreateEntity.getFileGraphData(params);

        if (res?.Code && res.Code !== 500001) alertExtractErr(res.Code);
        if (res?.res || (res?.Code && res.Code === 500001)) {
          data = createSource(selectSource, dataSheetSelectValue, res.res, false);
        }
      }
      // eslint-disable-next-line no-empty
    } catch (err) {}

    setAddLoading(false);
    addDataSource(data);
  };

  /**
   * 新增数据源
   * @param sources 可能有多选, 新增的数据源列表项
   */
  const addDataSource = (sources: any[]) => {
    if (sources.length === 0) return;
    const newData = removeRepeatDs(sourceList, sources);
    if (newData.length === 0) return;

    setSourceList(newData);
    setSelectedSource(newData[newData.length - 1]);

    if (dslistScrollRef.current) dslistScrollRef.current.scrollbars.scrollToBottom();
    if (ruleScrollRef.current) ruleScrollRef.current.scrollbars.scrollToTop();
  };

  /**
   * 标记使用过的数据
   * @param dsList 文件列表
   * @param choiceData 第二步选的数据
   */
  const filterUsedData = (dsList: any[], choiceData: any[]) => {
    const usedId = _.uniq(dsList.map(d => d.pId));
    const filterData = choiceData.filter(ds => usedId.includes(ds.id));
    const oldData = useDs.filter((old: any) => !usedId.includes(old.id));

    return filterData.concat(oldData);
  };

  const alertPreviewErr = (code: number, type?: string) => {
    const curCode = code === 500009 ? `${code}-${type === SourceType.STRUCTURED ? 'file' : 'dir'}` : code;
    curCode in PREVIEW_ERROR_CODE && message.error(intl.get(PREVIEW_ERROR_CODE[curCode]));
  };

  /**
   * 获取结构化预览数据
   * @param id 数据源id
   * @param data_source 数据源, sql 或 AnyShare
   * @param name AnyShare为docid, 数据库为表名
   */
  const getPreviewData = async (id: any, data_source: string, name: any) => {
    let preData = [];
    let vType = '';
    const params = { id, data_source, name };

    setPreLoading(true);
    const res = await servicesCreateEntity.getOtherPreData(params);
    setPreLoading(false);
    if (res && (res.data || res.res)) {
      vType = res.viewtype ? res.viewtype : 'non-json';
      preData = res.data ? res.data : res.res;
      if (data_source === MQ) vType = 'json';
    }
    if (res && res.Code) alertPreviewErr(res.Code, SourceType.STRUCTURED);

    setViewType(vType);
    setPreviewData(preData);
    resetScroll(boardScrollRef);
  };

  /**
   * 获取非结构化文件夹平埔的内容
   * @param docid  文件id
   * @param ds_id  数据源id
   */
  const getUnPre = async (docid: string, ds_id: number) => {
    let preData = [];
    const params = { docid, ds_id, postfix: 'all' };

    setPreLoading(true);
    const res = await servicesCreateEntity.getChildrenFile(params);
    setPreLoading(false);
    if (res && res.res) preData = res.res.output;
    if (res && res.Code) alertPreviewErr(res.Code);

    setViewType('dir');
    setPreviewData({ ds_id, docid, data: preData });
    resetScroll(boardScrollRef);
  };

  /**
   * 获取预测的抽取规则
   * @param {Array} dsList 文件列表数据
   * @param {number} ds_id 数据源id
   * @param {string} data_source 数据源, sql 或 AnyShare
   * @param {Array} file_id 数据表名, 或AS的docid
   * @param {number} file_path 文件路径
   */
  const getSelectRules = async ({ ds_id, data_source, extract_type, file_id, name, dsList, index, file_type }: any) => {
    let selectRules: string | any[] = [];

    const params = {
      ds_id: ds_id.toString(),
      data_source,
      file_list:
        data_source === 'as' || data_source === 'as7' ? [{ docid: file_id, type: file_type, name }] : [file_id],
      extract_type,
      step: extract_type === ExtractType.LABEL ? 'Ext' : undefined,
      postfix: name.substring(name.lastIndexOf('.') + 1)
    };

    const response = await servicesCreateEntity.getFileGraphData(params);

    if (response && response.res) {
      const { entity_property_dict } = response.res;

      entity_property_dict.forEach((item: { property: any[] }) =>
        item.property.forEach((pro: any[]) => {
          if (!selectRules.includes(pro[0])) selectRules = [...selectRules, pro[0]];
        })
      );

      dsList[index].selectRules = selectRules;
      setSourceList(dsList);
    }
  };

  /**
   * 根据selfId找索引
   * @param selfId
   * @param data
   */
  const getIndexById = (selfId: number, data: any[]) => data.findIndex(d => d.selfId === selfId);

  /**
   * 弹出抽取规则有误的信息
   */
  const showRuleErrMsg = () => {
    message.error(intl.get('workflow.information.ruleError'));
    setTimeout(() => {
      checkTools.scrollToErr();
    }, 0);
  };

  /**
   * 点击添加抽取源
   */
  const onAddClick = () => {
    if (isRuleErr) return showRuleErrMsg();
    if (selectedSource.selfId) {
      const rules = selectedSource.extract_rules;
      if (checkTools.isNewAdd(rules)) return showRuleErrMsg();
    }
    setAddDsVisible(true);
  };

  /**
   * 点击抽取源列表
   * @param rowData 单个抽取源
   * @param index 索引
   */
  const onSourceClick = (rowData: Record<string, any>, index: number) => {
    if (preLoading || rowData.selfId === selectedSource.selfId) return;
    const dsList = [...sourceList];
    if (isRuleErr) {
      setTimeout(() => {
        checkTools.scrollToErr();
      }, 0);

      return;
    }

    // 新增了但未配置抽取规则, 校验当前文件所有规则
    if (selectedSource.selfId) {
      const oldIndex = getIndexById(selectedSource.selfId, dsList);
      const rules = selectedSource.extract_rules;

      if (checkTools.isNewAdd(rules)) {
        setTimeout(() => {
          if (ruleScrollRef.current) ruleScrollRef.current.scrollbars.scrollToBottom();
        }, 0);

        return;
      }

      // 校验所有
      const { ruleIndex, err0, err1 } = checkTools.checkAll([selectedSource]);

      if (ruleIndex !== -1) {
        setIsRuleErr(true);
        checkTools.setDisabled(rules, ruleIndex, true, dsList, oldIndex);

        if (err0) checkTools.setErrMsg(ENTITY, rules, ruleIndex, err0, dsList, oldIndex);
        if (err1) checkTools.setErrMsg(FIELD, rules, ruleIndex, err1, dsList, oldIndex);

        setTimeout(() => {
          checkTools.scrollToErr();
        }, 0);

        return;
      }
    }

    // 无错误, 正常执行
    const { pId, name, data_source, file_id, extract_type, file_path, file_type } = dsList[index];
    setSelectedSource(rowData);
    setSourceList(dsList);
    ruleScrollRef.current?.scrollbars?.scrollToTop();
    if (extract_type !== ExtractType.MODEL && dsList[index].selectRules.length === 0) {
      // 标准抽取, 如果退出之后取回时没有下拉项, 重新请求获取
      setTimeout(() => {
        getSelectRules({ ds_id: pId, data_source, extract_type, file_id, file_path, name, dsList, index, file_type });
      }, 500);
    }
  };

  /**
   * 点击删除源文件
   * @param newData 删除后的数据
   * @param item 被删除的数据
   * @param index 被删除的数据索引
   */
  const onDeleteSource = async (newData: any[], item: Record<string, any>, index: number) => {
    message.success(intl.get('workflow.information.removeSuccess'));
    setSourceList(newData);

    if (!newData.length) {
      setSelectedSource({});
      return;
    }

    if (item.selfId === selectedSource.selfId) {
      const newIndex = index === 0 ? 0 : index - 1;
      setSelectedSource(newData[newIndex]);
    }
  };

  /**
   * 校验工具, 校验用户输入信息的抽取规则, 为了使用this, 不用箭头函数
   */
  const checkTools = {
    // 错误提示信息
    errMsg: {
      max255: intl.get('workflow.information.max255'),
      max64: intl.get('workflow.information.max64'),
      wrongful: intl.get('workflow.information.nameConsists'),
      empty: intl.get('workflow.information.inputEmpty'),
      repeat: intl.get('workflow.information.nameRepeat'),
      regError: intl.get('workflow.information.regError')
    },

    /**
     * 更新抽取规则
     * @param {Array} rules 抽取规则列表
     */
    updateRules(rules: any) {
      const dsList = [...sourceList];
      const index = getIndexById(selectedSource.selfId, dsList);

      if (dsList[index]) {
        dsList[index].extract_rules = rules;
        setSourceList(dsList);
      }
    },

    /**
     * 设置错误提示信息
     * @param {string} type "entity_type", "property_field", "property_func"
     * @param {Array} rules 抽取规则列表
     * @param {number} index 抽取规则索引
     * @param {string} msg 错误信息, 可选参数, 若不传参则设置为空
     */
    // eslint-disable-next-line max-params
    setErrMsg(type: string, rules: any, index: number, msg = '', dsList?: any, dsIndex?: any) {
      switch (type) {
        case ENTITY:
          rules[index].errMsg[0] = msg;
          break;
        case FIELD:
          rules[index].errMsg[1] = msg;
          break;
        default:
          return null;
      }

      if (msg) setIsRuleErr(true);

      if (dsList && dsIndex) {
        dsList[dsIndex].extract_rules = rules;
        setSourceList(dsList);
      } else {
        this.updateRules(rules);
      }
    },

    /**
     * 禁用除了当前抽取规则之外的其他输入框
     * @param {Array} rules 抽取规则列表
     * @param {number} index 抽取规则索引
     * @param {boolean} isDisabled true则禁用, false取消禁用
     * @param {Array} dsList 文件列表, 可选参数, 不传递则自动从state更新
     * @param {number} dsIndex 文件索引，可选参数
     */
    setDisabled(rules: any, index: number, isDisabled: boolean, dsList?: any, dsIndex?: any) {
      for (let i = 0; i < rules.length; i++) {
        if (i !== index) {
          rules[i].disabled = !!isDisabled;
        } else {
          // 错误项被删除了, 解除所有禁用
          rules[i].disabled && (rules[i].disabled = false);
        }
      }

      if (dsList && dsIndex) {
        dsList[dsIndex].extract_rules = rules;
        setSourceList(dsList);
      } else {
        this.updateRules(rules);
      }
    },

    /**
     * 新增了抽取, 未填写且无错误信息
     * @param {Array} rules 抽取规则列表
     */
    isNewAdd(rules: string | any[]) {
      if (rules.length === 0) return false;

      const lastIndex = rules.length - 1;
      let isErr = false;

      if (!rules[lastIndex].errMsg[0] && !rules[lastIndex].entity_type) {
        rules[lastIndex].errMsg[0] = this.errMsg.empty;
        isErr = true;
      }

      if (!rules[lastIndex].errMsg[1] && !rules[lastIndex].property.property_field) {
        rules[lastIndex].errMsg[1] = this.errMsg.empty;
        isErr = true;
      }

      if (isErr) {
        this.setDisabled(rules, lastIndex, true);
        setIsRuleErr(true);
      }

      return isErr;
    },

    /**
     * 校验所有, 返回错误的文件信息，不触发交互
     * @param {Array} dsList
     * @returns {number, number, string, string} {fileIndex: 文件索引, ruleIndex：规则索引, err0：实体类名错误信息, err1: 属性字段错误信息}
     */
    checkAll(dsList: string | any[]) {
      const errInfo = { fileIndex: -1, ruleIndex: -1, err0: '', err1: '' };

      if (dsList.length === 0) return errInfo; // 未添加文件

      for (let i = 0; i < dsList.length; i++) {
        const rules = dsList[i].extract_rules;
        let isBreak = false;
        let repeatField: any[] = [];
        const reg = /^[\u4e00-\u9fa5A-Za-z0-9_]+$/; // 中英文数字 正则

        if (rules.length === 0) {
          // 规则为空
          errInfo.fileIndex = i;
          break;
        }

        for (let j = 0; j < rules.length; j++) {
          const entity = rules[j].entity_type;
          const field = rules[j].property.property_field;

          if (repeatField.findIndex(item => item.entity === entity && item.field === field) !== -1) {
            // 校验重复
            errInfo.ruleIndex = j;
            errInfo.err1 = checkTools.errMsg.repeat;
            isBreak = true;
            break;
          }

          if (entity.length === 0) {
            // 校验空
            errInfo.err0 = checkTools.errMsg.empty;
          } else if (entity.length > 64) {
            // 校验最大长度
            errInfo.err0 = checkTools.errMsg.max64;
          } else if (!reg.test(entity)) {
            // 校验格式
            errInfo.err0 = checkTools.errMsg.wrongful;
          }

          if (field.length === 0) {
            errInfo.err1 = checkTools.errMsg.empty;
          } else if (field.length > 64) {
            errInfo.err1 = checkTools.errMsg.max64;
          } else if (!reg.test(field)) {
            errInfo.err1 = checkTools.errMsg.wrongful;
          }

          if (errInfo.err0 || errInfo.err1) {
            errInfo.ruleIndex = j;
            isBreak = true;
            break;
          }

          repeatField = [...repeatField, { entity, field }];
        }

        if (isBreak) {
          errInfo.fileIndex = i;
          break;
        }
      }

      return errInfo;
    },

    /**
     * 滚动到错误的抽取规则
     */
    scrollToErr() {
      const scroll = document.querySelector('div.show div.extract-rules-scroll div:first-of-type')!;
      const input = document.querySelector('div.show div.extract-item .extract-item-form-box .rule-input-error')!;
      const container = document.querySelector('div.show div.extract-items-box')!;

      if (scroll && input && container) {
        const ruleNode = input.parentNode?.parentNode?.parentNode?.parentNode as any;
        const y = ruleNode?.offsetTop;
        const scrollY = scroll.scrollTop;
        const viewHeight = container.clientHeight;

        if (y < scrollY || y + 117 > scrollY + viewHeight) {
          // 容器盒子高度 117
          scroll.scrollTop = y - 20; // 上margin 20
        }
      }
    },

    scrollToFile(index: number) {
      const height = 94; // 每一项高度94px

      if (dslistScrollRef.current) dslistScrollRef.current.scrollbars.scrollTop(index * height);
    }
  };

  // 展示看板滚动条始终归位到top和left
  const resetScroll = (ref: any) => {
    if (ref.current) {
      if (ref.current.scrollWidth > ref.current.clientWidth) {
        ref.current.scrollLeft = 0;
      }

      if (ref.current.scrollHeight > ref.current.clientHeight) {
        ref.current.scrollTop = 0;
      }
    }
  };

  return (
    <div className="info-extract-box">
      <div className="info-extract-content">
        <SourceList
          data={sourceList}
          selectedSource={selectedSource}
          onAddClick={onAddClick}
          onRowClick={onSourceClick}
          onDelete={onDeleteSource}
        />

        {!selectedSource.selfId ? (
          <div className="source-show-board-null">
            <h3 className="show-board-title">{intl.get('workflow.information.board')}</h3>
            <div className="show-board-content-null">
              <div className="no-info-box">
                <img src={noInfoImg} alt="nodata" className="no-info-img"></img>
                <div className="no-info-text">
                  <p>{intl.get('workflow.information.addSourceTip')}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="source-show-board">
              <h3 className={anyDataLang === 'en-US' ? 'show-board-title-EN' : 'show-board-title'}>
                <span className="word">{intl.get('workflow.information.board')}</span>
                <span className="title-line">-</span>
                <span className="show-board-file-name" title={selectedSource.name?.replace(/(.{30})/g, '$1\n')}>
                  {selectedSource.name}
                </span>
              </h3>
              <div className="show-board-content">
                <div className="show-data-box" ref={boardScrollRef}>
                  <ScrollBar color="rgb(184,184,184)">
                    {preLoading ? (
                      <LoadingOutlined className="icon" />
                    ) : (
                      <ShowTable selfKey={'work'} viewType={viewType} preData={previewData} area={'work'} />
                    )}
                  </ScrollBar>
                </div>
              </div>
            </div>

            <RuleList data={selectedSource} anyDataLang={anyDataLang} onChange={() => {}} />
          </>
        )}
      </div>

      <div className={addLoading ? 'extract-add-loading' : 'no-loading'}>
        <LoadingOutlined className="icon" />
      </div>

      <div className="work-flow-footer">
        <Button className="ant-btn-default btn" onClick={onPrev}>
          {intl.get('workflow.previous')}
        </Button>

        <Button type="primary" className="btn" onClick={onNext}>
          {intl.get('workflow.next')}
        </Button>
      </div>

      <Modal
        className="extract-modal"
        title={intl.get('workflow.information.details')}
        visible={addDsVisible}
        width={800}
        maskClosable={false}
        destroyOnClose
        footer={[
          <ConfigProvider key="entityInfo" autoInsertSpaceInButton={false}>
            <Button className="ant-btn-default ds-btn" onClick={() => setAddDsVisible(false)}>
              {intl.get('workflow.information.cancel')}
            </Button>
            <Button type="primary" className="ds-btn" onClick={onAdd}>
              {intl.get('workflow.information.ok')}
            </Button>
          </ConfigProvider>
        ]}
        onCancel={() => setAddDsVisible(false)}
      >
        <ModalContent
          ref={modalContentRef}
          modelList={modelList}
          graphId={graphId}
          anyDataLang={anyDataLang}
          total={sourceList.length}
        />
      </Modal>
    </div>
  );
};

const mapStateToProps = (state: any) => ({
  anyDataLang: state.getIn(['changeAnyDataLang', 'anyDataLang'])
});

const mapDispatchToProps = (dispatch: any) => ({
  updateAnyDataLang: (anyDataLang: string) => dispatch(changeAnyDataLang(anyDataLang))
});

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(forwardRef(InfoExtr));
