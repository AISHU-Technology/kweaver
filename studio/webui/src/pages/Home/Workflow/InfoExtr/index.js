/* eslint-disable max-lines */
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { Button, Input, Modal, ConfigProvider, Tooltip, message } from 'antd';
import { ExclamationCircleFilled, ExclamationCircleOutlined, LoadingOutlined } from '@ant-design/icons';

import { changeAnyDataLang } from '@/reduxConfig/actions';
import servicesCreateEntity from '@/services/createEntity';
import serviceWorkflow from '@/services/workflow';

import IconFont from '@/components/IconFont';
import ScrollBar from '@/components/ScrollBar';
import { switchIcon, getPostfix, wrapperTitle, formatModel } from '@/utils/handleFunction';

import ShowTable from './ShowTable';
import ModalContent from './ModalContent';
import SearchSelect from './RuleList/SearchSelect';
import { createRule, dataSourceShow, generateGraph } from './assistFunction';

import emptyImg from '@/assets/images/empty.svg';
import trashImg from '@/assets/images/Trash.svg';
import noInfoImg from '@/assets/images/flow4Empty.svg';
import './SourceList/style.less';
import './RuleList/style.less';
import './style.less';

const AUTOMATIC = 'automatic'; // 第三步标记自动预测的点
const FROM_MODEL = 'from_model'; // 抽取规则来自模型
const NOT_MODEL = 'not_model'; // 抽取规则不来自模型
const STRUCTURED = 'structured'; // 结构化
const STANDARD_EXTRACTION = 'standardExtraction'; // 标准抽取
const MODEL_EXTRACTION = 'modelExtraction'; // 模型抽取
const LABEL_EXTRACTION = 'labelExtraction'; // 标注抽取
const ENTITY = 'entity_type'; // 抽取规则的实体名称
const FIELD = 'property_field'; // 抽取规则的属性字段
const ANIMATION_TIME = 300; // 定义"移除"动画的事件, 300ms
const MQ = 'rabbitmq';

const InfoExtr = (props, ref) => {
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
  const modalContentRef = useRef(); // 弹框内容的ref
  const dslistScrollRef = useRef(); // 文件列表的滚动条ref
  const boardScrollRef = useRef(); // 展示看板的滚动条ref
  const ruleScrollRef = useRef(); // 抽取规则的滚动条ref
  const [selectDsModalVisible, setSelectDsModalVisible] = useState(false); // 选择数据源弹窗是否可见
  const [dataSourceList, setDataSourceList] = useState([]); // 数据源列表
  const [markSelfId, setMarkSelfId] = useState(0); // 用于标记文件列表项, 随文件数据增加;
  const [activeID, setActiveID] = useState(-1); // 点击时应该展示的数据源的id
  const [showName, setShowName] = useState(''); // 展示看板显示的文件名
  const [viewType, setViewType] = useState(''); // 展示看板类型, json, non-json, dir, unSupported
  const [previewData, setPreviewData] = useState([]); // 预览数据
  const [modelList, setModelList] = useState([]); // 如果是模型抽取, 提供模型供用户选择
  const [ruleKey, setRuleKey] = useState(0); // 自定义抽取规则id
  const [showSelect, setShowSelect] = useState(false); // 属性字段的select是否显示
  const [fieldText, setFieldText] = useState(''); // 属性字段input框的值
  const [inputInfo, setInputInfo] = useState({}); // 属性字段input框focus时提供一些必要参数给select
  const [isRuleErr, setIsRuleErr] = useState(false); // 记录规则错误的全局布尔值
  const [preLoading, setPreLoading] = useState(false); // 预览区loading
  const [addLoading, setAddLoading] = useState(false); // 添加文件loading
  const [nextLoading, setNextLoading] = useState(false); // 等待下一步请求
  const [delFileIndex, setDelFileIndex] = useState(-1); // 删除文件的索引, 删除动画需要的变量
  const [delRuleIndex, setDelRuleIndex] = useState(-1); // 删除抽取规则的索引, 删除动画需要的变量
  const [startAddRule, setStartAddRule] = useState(false); // 开始添加抽取规则, 添加动画需要的变量

  // 暴露组件内部方法
  useImperativeHandle(ref, () => ({
    getFlowData: () => {
      const data = generateGraph(dataSourceList);
      return data;
    }
  }));

  // 获取模型
  useEffect(() => {
    if (graphId && current === 3) fetchModel();
  }, [graphId, current]);

  // 如果是上下步回退过来的, 取出保存在父组件的state
  useEffect(() => {
    if ((current === 3 && preCurrent.current === 2) || current === 0) {
      let dsList = [];
      let rId = ruleKey;
      let fid = markSelfId;

      current && setAddLoading(true);

      // 初次进入, 如果是保存过, 取回数据第四步的数据
      if (infoExtrData.length > 0 && dataSourceList.length === 0) {
        for (let i = 0; i < infoExtrData.length; i++) {
          const id0 = rId;
          const {
            ds_name,
            ds_id,
            data_source,
            ds_path,
            file_source,
            file_name,
            file_path,
            file_type,
            extract_type,
            extract_model,
            extract_rules
          } = infoExtrData[i];

          dsList = [
            ...dsList,
            {
              selfId: fid + i,
              name: file_name,
              file_name,
              file_id: file_source,
              file_source,
              pId: ds_id,
              dsname: ds_name,
              data_source,
              ds_path,
              file_path,
              file_type,
              extract_type,
              extract_model,
              extract_rules: extract_rules.map((item, i) => {
                item.id = id0 + i;
                item.errMsg = ['', '', ''];
                item.disabled = false;

                return item;
              }),
              selectRules: [],
              isDsError: false,
              errorTip: ''
            }
          ];
          rId += extract_rules.length;
        }
        fid += infoExtrData.length;
      }

      if (current === 0) {
        setDataSourceList(dsList);
        setMarkSelfId(fid);
        setRuleKey(rId);
        return;
      }

      // 只是返回上一步, 从state中取回
      if (dataSourceList.length > 0) dsList = [...dataSourceList];
      let autoList = []; // 过滤第三步的数据
      // 过滤自动预测的点
      const autoEntity = ontoData[0].entity.filter(
        item => item.source_type === AUTOMATIC && item.extract_type === STANDARD_EXTRACTION
      );

      const edges = ontoData[0].edge.filter(
        item => item.source_type === AUTOMATIC && item.extract_type === STANDARD_EXTRACTION
      );

      const autoDs = autoEntity.filter((item, i) => {
        // 该点来自多个文件, 只要其中一个文件在流程四中没有包含, 那么取出, 否则过滤掉
        const { source_table } = item;
        let repeatIndex = [];

        for (let i = 0; i < source_table.length; i++) {
          const file_id = source_table[i] instanceof Array ? source_table[i][0] : source_table[i];
          const findex = dsList.findIndex(ds => ds.pId.toString() === item.ds_id.toString() && ds.file_id === file_id);

          repeatIndex = [...repeatIndex, findex];
        }

        return repeatIndex.some(i => i === -1);
      });

      let repeatEntity = []; // 记录第三步自身重复的点

      // 过滤后构造文件列表
      autoDs.forEach(item => {
        const { ds_id, ds_name, extract_type, file_type, name, source_table, properties, model, ds_path, data_source } =
          item;

        source_table.forEach((s, sindex) => {
          const file_path = s instanceof Array ? s[2] : ds_path;
          const file_id = s instanceof Array ? s[0] : s;
          const file_name = file_type === '' ? s : s[1];

          if (dsList.findIndex(ds => ds.pId.toString() === ds_id.toString() && ds.file_id === file_id) !== -1) return;

          // 构造取值规则
          let selectRules = [];
          let rules = [];

          properties.forEach((pro, i) => {
            if (!selectRules.includes(pro[0])) selectRules = [...selectRules, pro[0]];
            rules = [...rules, createRule(rId + i, NOT_MODEL, name, pro[0])];
          });

          rId += rules.length;

          // 合并重复点类的规则
          if (repeatEntity.includes(file_id)) {
            const i = autoList.findIndex(au => au.file_id === file_id);
            const newSelectRules = selectRules.filter(s => !autoList[i].selectRules.includes(s));

            autoList[i].extract_rules = [...autoList[i].extract_rules, ...rules];
            autoList[i].selectRules = [...autoList[i].selectRules, ...newSelectRules];
          } else {
            repeatEntity = [...repeatEntity, file_id]; // 记录重复点类
            autoList = [
              ...autoList,
              {
                selfId: fid + sindex,
                name: file_name,
                file_name,
                file_id,
                file_source: file_id,
                pId: ds_id,
                dsname: ds_name,
                data_source,
                ds_path,
                file_path,
                file_type: data_source.includes('as') ? 'file' : '',
                extract_type,
                extract_model: model,
                extract_rules: rules,
                selectRules,
                isDsError: false,
                errorTip: ''
              }
            ];
          }
        });

        fid += source_table.length;
      });

      // 取出边
      edges.forEach(edge => {
        const fromSource = [...new Set(edge.source_table)]; // Set去重
        const dsIndex = autoList.findIndex(ds => fromSource.includes(ds.file_id));

        if (dsIndex !== -1) {
          const eName = edge.name;
          let sRules = [...autoList[dsIndex].selectRules];

          const eRules = edge.properties.map((pro, pIndex) => {
            if (!sRules.includes(pro[0])) sRules = [...sRules, pro[0]];

            return {
              id: rId + pIndex,
              is_model: NOT_MODEL,
              entity_type: eName,
              property: {
                property_field: pro[0],
                property_func: 'All'
              },
              errMsg: ['', '', ''],
              disabled: false
            };
          });

          rId += eRules.length;
          autoList[dsIndex].extract_rules = autoList[dsIndex].extract_rules.concat(eRules);
          autoList[dsIndex].selectRules = sRules;
        }
      });

      // 合并第三步数据
      dsList = [...dsList, ...autoList];

      setDataSourceList(dsList);
      setMarkSelfId(fid);
      setRuleKey(rId);

      setTimeout(() => {
        setAddLoading(false); // 文件列表数据加载完毕
        if (dslistScrollRef.current) dslistScrollRef.current.scrollbars.scrollToBottom();
      }, 0);
    }

    // 模拟componentDidUpdate更新 步骤current
    if (current !== preCurrent.current) preCurrent.current = current;

    // eslint-disable-next-line
  }, [current, infoExtrData]);

  // 点击文件加载预览数据
  useEffect(() => {
    if (activeID === -1) return;

    const dsList = [...dataSourceList];
    const activeIndex = getIndexById(activeID, dsList);

    if (activeIndex === -1) return;

    const { name, pId, data_source, file_id, extract_type, file_type } = dsList[activeIndex];

    setShowName(name);

    // 仅支持预览csv和json
    if (file_type === 'file' && !['csv', 'json'].includes(getPostfix(name))) {
      setViewType('unSupported');
      setPreviewData([]);

      return;
    }

    extract_type === MODEL_EXTRACTION && file_type === 'dir'
      ? getUnPre(file_id, pId)
      : getPreviewData(pId, data_source, file_id);

    // eslint-disable-next-line
  }, [activeID]);

  /**
   * 获取模型
   */
  const fetchModel = async () => {
    const res = await servicesCreateEntity.fetchModelList();
    res && res.res && setModelList(Object.entries(res.res));
  };

  /**
   * @description 上一步
   */
  const onPrev = () => {
    const dsList = updateDsName(dataSourceList, dataSourceData);

    saveState(dsList);
    setActiveID(-1);
    setIsRuleErr(false);
    prev();
  };

  /**
   * @description 下一步
   */
  const onNext = async () => {
    if (nextLoading) return;

    const dsList = updateDsName(dataSourceList, dataSourceData);
    saveState(dsList);

    // 未选择数据源
    if (dsList.length === 0) return message.error(intl.get('workflow.information.placeAddDs'));
    // 最多支持100条数据源
    if (dsList.length > 100) return message.error(intl.get('workflow.information.addMaxErr'));
    // 抽取规则配置有误, 不进行下一步
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

    setDataSourceList(dsList);

    if (hasErr && noneIndex !== -1) {
      setActiveID(dsList[noneIndex].selfId);
      message.error(intl.get('workflow.information.ruleError'));
      checkTools.scrollToFile(noneIndex);
      return;
    }

    // 校验所有
    const { fileIndex, ruleIndex, err0, err1 } = checkTools.checkAll(dsList);

    if (fileIndex !== -1 && ruleIndex !== -1) {
      setIsRuleErr(true);
      setActiveID(dsList[fileIndex].selfId);

      const rules = dsList[fileIndex].extract_rules;
      checkTools.setDisabled(rules, ruleIndex, true, dsList, fileIndex);
      if (err0) checkTools.setErrMsg(ENTITY, rules, ruleIndex, err0, dsList, fileIndex);
      if (err1) checkTools.setErrMsg(FIELD, rules, ruleIndex, err1, dsList, fileIndex);

      showRuleErrMsg();
      checkTools.scrollToFile(fileIndex);
      return;
    }

    // 后台校验
    const graph_process = generateGraph(dsList);

    setNextLoading(true);
    const graph = { graph_step: 'graph_InfoExt', graph_process };
    const res = await serviceWorkflow.graphEdit(graphId, graph);
    setNextLoading(false);
    if (res && res.res) next();
    if (res && (res.Code || res.ErrorCode)) next(res);
  };

  /**
   * 更新数据源名
   * @param {Array} ds 第四步中的文件列表数据
   * @param {Array} orign 第二步选择的数据源
   */
  const updateDsName = (ds, orign) => {
    const dsList = [...ds];
    const dsByStep2 = [...orign];

    // 更新数据源名
    if (dsList.length > 0 && dsByStep2.length > 0) {
      for (let i = 0; i < dsList.length; i++) {
        const filterDs = dsByStep2.filter(d => d.id.toString() === dsList[i].pId.toString());
        if (filterDs.length > 0 && dsList[i].dsname !== filterDs[0].dsname) {
          dsList[i].dsname = filterDs[0].dsname;
        }
      }
    }

    return dsList;
  };

  /**
   * @description 保存state数据到父组件
   */
  const saveState = dsList => {
    const graph = generateGraph(dsList);
    const used = filterUsedData(dataSourceList, dataSourceData);

    setDataSourceList(dsList);
    setInfoExtrData(graph);
    setUseDs(used);
  };

  /**
   * @description 点击确认按钮添加数据源
   */
  const onAdd = async e => {
    e.preventDefault();

    const addData = modalContentRef.current.addFile();

    if (addData) {
      setSelectDsModalVisible(false);
      setAddLoading(true);

      const { selectSource, asSelectValue, dataSheetSelectValue } = addData;
      const { id, dsname, data_source, ds_path, extract_type, extract_model } = selectSource;
      let selfId = markSelfId;

      // 构造文件列表数据模板
      let data = [];
      const file = {
        selfId: -1,
        name: '',
        file_name: '', // 等于name
        file_id: '', // 文件id或数据表名
        file_source: '', // 等于file_id
        pId: id, // 所属数据源
        dsname, // 所属数据源名
        data_source, // 来源, 数据库或AS
        ds_path, // 数据源路径
        file_path: ds_path, // 文件路径, as需要额外拼接文件夹
        file_type: '', // 文件类型
        extract_type, // 抽取方式
        extract_rules: [], // 抽取规则
        extract_model,
        selectRules: [], // 标准抽取时可选择的属性字段
        isDsError: false, // 是否错误
        errorTip: '' // 错误tip信息
      };

      // 添加抽取规则
      let rId = ruleKey;

      if (data_source === 'as' || data_source === 'as7') {
        // 选择了AS
        let params;
        let res;
        const file_list = asSelectValue.map(item => {
          const { docid, name, type } = JSON.parse(item);

          return { docid, type, name };
        });
        // 非结构化 list
        const unstructured_list = asSelectValue.map(item => {
          const { docid, file_path, name } = JSON.parse(item);

          return [docid, file_path, name];
        });

        if (extract_type === STANDARD_EXTRACTION || extract_type === LABEL_EXTRACTION) {
          params = {
            ds_id: id.toString(),
            data_source,
            file_list,
            extract_type,
            step: extract_type === LABEL_EXTRACTION ? 'Ext' : undefined,
            postfix: file_list[0].name.substring(file_list[0].name.lastIndexOf('.') + 1) // 新加
          };
          res = await servicesCreateEntity.getFileGraphData(params);
        } else {
          params = { model: extract_model, file_list: unstructured_list };
          res = await servicesCreateEntity.unstructuredData(params);
        }

        if (res && res.Code && res.Code !== 500001) alertRuleErr(res.Code);
        if ((res && res.res) || (res && res.Code && res.Code === 500001)) {
          asSelectValue.forEach(item => {
            let _file = JSON.parse(JSON.stringify(file)); // 拷贝Obejct
            const { docid, name, file_path, type } = JSON.parse(item);

            if (res.res) _file = convertToRules(res.res, _file, docid, rId, extract_type); // 预测的数据转化为抽取规则
            _file.selfId = selfId;
            _file.name = name;
            _file.file_name = name;
            _file.file_id = docid;
            _file.file_source = docid;
            _file.file_path = file_path;
            _file.file_type = type;
            data = [_file, ...data];
            selfId += 1;
            rId += _file.extract_rules.length;
          });
        }
      } else {
        // 选择了数据库
        const params = {
          ds_id: selectSource.id.toString(),
          data_source: selectSource.data_source,
          file_list: dataSheetSelectValue,
          extract_type,
          postfix: ''
        };
        const res = await servicesCreateEntity.getFileGraphData(params);

        if (res && res.Code && res.Code !== 500001) alertRuleErr(res.Code);
        if ((res && res.res) || (res && res.Code && res.Code === 500001)) {
          dataSheetSelectValue.forEach(item => {
            let _file = JSON.parse(JSON.stringify(file));

            if (res.res) _file = convertToRules(res.res, _file, item, rId, extract_type); // 预测的数据转化为抽取规则
            _file.selfId = selfId;
            _file.name = item;
            _file.file_name = item;
            _file.file_id = item;
            _file.file_source = item;
            data = [_file, ...data];
            selfId += 1;
            rId += _file.extract_rules.length;
          });
        }
      }

      setRuleKey(rId);
      setAddLoading(false);
      addDataSource(data);
    }
  };

  /**
   * @description 新增数据源
   * @param {Array} sources 可能有多选, 新增的数据源列表项
   */
  const addDataSource = sources => {
    if (sources.length === 0) return;
    setMarkSelfId(markSelfId + sources.length); // 更新文件id

    const data = [...dataSourceList];
    const newData = [...removeRepeatDs(data, sources)];

    if (newData.length === 0) return;

    setDataSourceList(newData);
    // 默认展开最新添加的项
    const { selfId } = newData[newData.length - 1];
    setActiveID(selfId);

    if (dslistScrollRef.current) dslistScrollRef.current.scrollbars.scrollToBottom();
    if (ruleScrollRef.current) ruleScrollRef.current.scrollbars.scrollToTop();
  };

  /**
   * @description 新增数据源时覆盖已添加的数据源, 且抽取规则不变
   * @param {Array} oldData 原有的数据
   * @param {Array} newData 新增的数据
   */
  const removeRepeatDs = (oldData, newData) => {
    let repeatIndex = [];

    for (let i = 0; i < newData.length; i++) {
      const index = oldData.findIndex(
        item => item.file_id === newData[i].file_id && item.pId.toString() === newData[i].pId.toString()
      );

      if (index !== -1 && !repeatIndex.includes(index)) {
        repeatIndex = [...repeatIndex, index];

        if (newData[i].extract_type === STANDARD_EXTRACTION || newData[i].extract_type === LABEL_EXTRACTION) {
          newData[i].extract_rules = oldData[index].extract_rules; // 规则不变
        }
      }
    }

    const ds = oldData.filter((d, i) => repeatIndex.indexOf(i) === -1); // 过滤重复的

    return ds.concat(newData);
  };

  /**
   * @description 标记使用过的数据
   * @param {Array} dsList 文件列表
   * @param {Array} choiceData 第二步选的数据
   */
  const filterUsedData = (dsList, choiceData) => {
    let usedId = [];

    for (let i = 0; i < dsList.length; i++) {
      if (!usedId.includes(dsList[i].pId)) usedId = [...usedId, dsList[i].pId];
    }

    const filterData = choiceData.filter(ds => usedId.includes(ds.id));
    const oldData = useDs.filter(old => !usedId.includes(old.id));

    return filterData.concat(oldData);
  };

  // 定义预览数据错误码
  const alertPreErr = (code, type) => {
    if (code === 500001) message.error(intl.get('createEntity.fileNoexist'));
    if (code === 500002) message.error(intl.get('createEntity.sourceIncorrect'));
    if (code === 500006) message.error(intl.get('createEntity.sourceNoexist'));
    if (code === 500013) message.error(intl.get('workflow.information.as7BeOver'));
    if (code === 500009) {
      type === STRUCTURED
        ? message.error(intl.get('workflow.information.fileNoExist'))
        : message.error(intl.get('workflow.information.nodir'));
    }
  };

  /**
   * @description 获取结构化预览数据
   * @param {number} id 数据源id
   * @param {string} data_source 数据源, sql 或 AnyShare
   * @param {string} name AnyShare为docid, 数据库为表名
   */
  const getPreviewData = async (id, data_source, name) => {
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
    if (res && res.Code) alertPreErr(res.Code, STRUCTURED);

    setViewType(vType);
    setPreviewData(preData);
    resetScroll(boardScrollRef);
  };

  /**
   * 获取非结构化文件夹平埔的内容
   * @param {string} docid  文件id
   * @param {number} ds_id  数据源id
   */
  const getUnPre = async (docid, ds_id) => {
    let preData = [];
    const params = { docid, ds_id, postfix: 'all' };

    setPreLoading(true);
    const res = await servicesCreateEntity.getChildrenFile(params);
    setPreLoading(false);
    if (res && res.res) preData = res.res.output;
    if (res && res.Code) alertPreErr(res.Code);

    setViewType('dir');
    setPreviewData({ ds_id, docid, data: preData });
    resetScroll(boardScrollRef);
  };

  // 定义获取抽取规则的错误码
  const alertRuleErr = code => {
    if (code === 500002) message.error(intl.get('createEntity.sourceIncorrect'));
    if (code === 500006) message.error(intl.get('createEntity.sourceNoexist'));
    if (code === 500009) message.error(intl.get('createEntity.fileNoExist'));
    if (code === 500010) message.error(intl.get('createEntity.fileNotPre'));
    if (code === 500011) message.error(intl.get('createEntity.someFileNotPre'));
    if (code === 500013) message.error(intl.get('createEntity.tokenError'));
  };

  /**
   * @description 获取预测的抽取规则
   * @param {Array} dsList 文件列表数据
   * @param {number} ds_id 数据源id
   * @param {string} data_source 数据源, sql 或 AnyShare
   * @param {Array} file_id 数据表名, 或AS的docid
   * @param {number} file_path 文件路径
   */
  const getSelectRules = async ({ ds_id, data_source, extract_type, file_id, name, dsList, index, file_type }) => {
    let selectRules = [];

    const params = {
      ds_id: ds_id.toString(),
      data_source,
      file_list:
        data_source === 'as' || data_source === 'as7' ? [{ docid: file_id, type: file_type, name }] : [file_id],
      extract_type,
      step: extract_type === LABEL_EXTRACTION ? 'Ext' : undefined,
      postfix: name.substring(name.lastIndexOf('.') + 1)
    };

    const response = await servicesCreateEntity.getFileGraphData(params);

    if (response && response.res) {
      const { entity_property_dict } = response.res;

      entity_property_dict.forEach(item =>
        item.property.forEach(pro => {
          if (!selectRules.includes(pro[0])) selectRules = [...selectRules, pro[0]];
        })
      );

      dsList[index].selectRules = selectRules;
      setDataSourceList(dsList);
    }
  };

  /**
   * @description 后台返回的预测数据转换为抽取规则
   * @param {Object} res 后台返回的数据
   * @param {Object} file 文件模板
   * @param {string} docid 文件id
   * @param {number} id 抽取规则id
   * @param {string} extract_type 抽取方式
   */
  const convertToRules = (res, file, docid, id, extract_type) => {
    if (res) {
      const is_model = extract_type === MODEL_EXTRACTION ? FROM_MODEL : NOT_MODEL;
      const { entity_main_table_dict, entity_property_dict, relation_property_dict } = res;

      const spots = entity_main_table_dict.filter(item => {
        // 找到该文件对应的点
        const index = item.main_table.findIndex((table, i, self) => {
          if (table instanceof Array) return table[0].includes(docid);
          if (table?.docid) return table.docid === docid;
          return self.includes(docid);
        });

        return index !== -1;
      });

      let rules = [];
      let selectRules = [];

      spots.forEach(item => {
        const edge_dict = entity_property_dict.filter(dict => item.entity === dict.entity); // 找到点对应的边

        edge_dict.forEach(edge => {
          edge.property.forEach(pro => {
            // 取出每条边类信息
            if (!selectRules.includes(pro[0])) selectRules = [...selectRules, pro[0]];

            rules = [...rules, createRule(id, is_model, edge.entity, pro[0])];
            // eslint-disable-next-line no-param-reassign
            id += 1;
          });
        });
      });

      relation_property_dict.forEach(relations => {
        const entity_type = relations.edge;

        relations.property.forEach(pro => {
          if (!selectRules.includes(pro[0])) selectRules = [...selectRules, pro[0]];

          rules = [...rules, createRule(id, is_model, entity_type, pro[0])];
          // eslint-disable-next-line no-param-reassign
          id += 1;
        });
      });

      file.extract_rules = rules;
      file.selectRules = selectRules;
    }

    return file;
  };

  /**
   * @description 根据selfId找索引
   * @param {string} selfId 文件id, 实际是docid或表名
   * @param {Array} data 文件列表数据
   */
  const getIndexById = (selfId, datas) => {
    if (datas instanceof Array) return datas.findIndex(data => data.selfId === selfId);
    return -1;
  };

  /**
   * @description 弹窗对象集合
   */
  const modalBox = {
    /**
     * @description 警告弹窗, 只有提示信息和确认取消按钮
     * @param {string} title 警告标题
     * @param {string} content 警告内容
     * @param {string} okText 确认按钮文字
     * @param {string} cancelText 取消按钮文字
     */
    warmingModal: (title, content, okText, cancelText) => {
      return new Promise(resolve => {
        Modal.confirm({
          className: 'warming-modal',
          title,
          icon: <ExclamationCircleFilled className="err-icon" />,
          content,
          okText,
          cancelButtonProps: { className: 'ant-btn-default' },
          cancelText,
          width: 432,
          onOk() {
            resolve(true);
          },
          onCancel() {
            resolve(false);
          }
        });
      });
    },

    selectDsModal: () => {
      return (
        <Modal
          className="extract-modal"
          title={intl.get('workflow.information.details')}
          visible={selectDsModalVisible}
          width={800}
          maskClosable={false}
          destroyOnClose
          footer={[
            <ConfigProvider key="entityInfo" autoInsertSpaceInButton={false}>
              <Button className="ant-btn-default ds-btn" key="cancel" onClick={() => setSelectDsModalVisible(false)}>
                {intl.get('workflow.information.cancel')}
              </Button>
              <Button type="primary" className="ds-btn" key="ok" onClick={onAdd}>
                {intl.get('workflow.information.ok')}
              </Button>
            </ConfigProvider>
          ]}
          onCancel={() => setSelectDsModalVisible(false)}
        >
          <ModalContent
            ref={modalContentRef}
            modelList={modelList}
            graphId={graphId}
            anyDataLang={anyDataLang}
            total={dataSourceList.length}
          />
        </Modal>
      );
    }
  };

  /**
   * @description 弹出抽取规则有误的信息
   */
  const showRuleErrMsg = () => {
    message.error(intl.get('workflow.information.ruleError'));
    setTimeout(() => {
      checkTools.scrollToErr();
    }, 0);
  };

  /**
   * @description 点击文件列表
   * @param {number} index 文件列表索引
   */
  const onFileClick = index => {
    // 上一次点击的预览数据未返回, 无法点击
    if (preLoading) return;

    const dsList = [...dataSourceList];
    // 抽取规则有错误, 不能点击
    if (isRuleErr) {
      setTimeout(() => {
        checkTools.scrollToErr();
      }, 0);

      return;
    }

    // 新增了但未配置抽取规则, 校验当前文件所有规则
    const oldIndex = getIndexById(activeID, dsList);

    if (oldIndex !== -1) {
      const rules = dsList[oldIndex].extract_rules;

      if (checkTools.isNewAdd(rules)) {
        setTimeout(() => {
          if (ruleScrollRef.current) ruleScrollRef.current.scrollbars.scrollToBottom();
        }, 0);

        return;
      }

      // 校验所有
      const { ruleIndex, err0, err1 } = checkTools.checkAll([dsList[oldIndex]]);

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
    const { selfId, pId, name, data_source, file_id, extract_type, file_path, file_type } = dsList[index];

    setDataSourceList(dsList);

    if (ruleScrollRef.current) ruleScrollRef.current.scrollbars.scrollToTop();

    if (extract_type !== MODEL_EXTRACTION && dsList[index].selectRules.length === 0) {
      // 标准抽取, 如果退出之后取回时没有下拉项, 重新请求获取
      setTimeout(() => {
        getSelectRules({ ds_id: pId, data_source, extract_type, file_id, file_path, name, dsList, index, file_type });
      }, 500);
    }

    setActiveID(selfId); // 设置激活索引
  };

  /**
   * @description 点击删除文件
   * @param {DOM.event} e 点击事件
   * @param {number} index 文件列表索引
   */
  const onDelFileClick = async (e, index) => {
    e.stopPropagation();
    const title = intl.get('workflow.information.isDeleteTitle');
    const content = intl.get('workflow.information.isDeleteText');
    const okText = intl.get('workflow.information.ok');
    const cancelText = intl.get('workflow.information.cancel');

    const isOk = await modalBox.warmingModal(title, content, okText, cancelText);

    if (isOk) {
      const dsList = [...dataSourceList];

      setDelFileIndex(index);

      // 等待300ms删除动画执行完毕
      setTimeout(() => {
        setDelFileIndex(-1);
        message.success(intl.get('workflow.information.removeSuccess'));

        // 如果删除的是选中的文件,则展开上一个,删第一个则展开下一个
        if (dsList[index] && dsList[index].selfId === activeID) {
          const newData = dsList.filter(item => activeID !== item.selfId); // 删除文件操作

          setDataSourceList(newData);

          if (isRuleErr) setIsRuleErr(false); // 规则错误信息置空

          if (newData.length > 0) {
            const newIndex = index === 0 ? 0 : index - 1;

            setActiveID(newData[newIndex].selfId);
          } else {
            setActiveID(-1);
            setViewType('');
            setPreviewData([]);
          }
        } else {
          const newData = dsList.filter((item, i) => i !== index); // 删除文件操作

          setDataSourceList(newData);
        }
      }, ANIMATION_TIME);
    }
  };

  /**
   * @description 渲染数据源列表项
   * @param {Array} dataSourceList 数据源列表
   */
  const mapDataSourceItem = dataSourceList => {
    return dataSourceList.map((item, index) => {
      const { selfId, name, file_path, file_type, isDsError, errorTip, data_source, extract_model } = item;

      return (
        <li
          className={`
            ds-item
            ${preLoading && 'ds-disabled'} 
            ${isDsError ? 'ds-item-error' : activeID === selfId && 'ds-item-active'}
            ${delFileIndex === index && 'del-animation'}
          `}
          key={selfId}
          onClick={() => onFileClick(index)}
        >
          <div className="ds-item-icon">
            {file_type === 'dir'
              ? switchIcon('dir', '', 34)
              : data_source.includes('as')
              ? switchIcon('file', name, 34)
              : switchIcon('sheet', '', 34)}
          </div>

          <div className="ds-item-info">
            <h3 className="ds-item-title" title={wrapperTitle(name)}>
              {file_type === 'file' && name.split('.').length > 1 ? (
                <>
                  <span className="ds-file-name">{name.split('.').slice(0, -1).join('')}</span>
                  <span className="ds-file-postfix">.{name.split('.').pop()}</span>
                </>
              ) : (
                <span className="ds-sheet-name">{name}</span>
              )}
            </h3>
            <div className="ds-other-info">
              <div className="source-info">
                <p className="ds-item-source" title={wrapperTitle(file_path)}>
                  {file_path}
                </p>
                <div className="tab-box">
                  <p className="ds-item-tag ellipsis-one" title={dataSourceShow(data_source)}>
                    {dataSourceShow(data_source)}
                  </p>
                  {extract_model && (
                    <p className="ds-item-tag ellipsis-one" title={formatModel(extract_model)}>
                      {formatModel(extract_model)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="ds-right-bar">
            <span className="trash-btn" onClick={e => onDelFileClick(e, index)}>
              <img src={trashImg} alt="nodata" />
            </span>

            <div className={isDsError ? 'ds-warming-icon' : 'ds-warming-icon-none'}>
              <Tooltip title={errorTip}>
                <ExclamationCircleOutlined style={{ fontSize: 16, color: '#db0040', marginTop: 2 }} />
              </Tooltip>
            </div>
          </div>
        </li>
      );
    });
  };

  /**
   * @description 展示标准抽取规则页面
   */
  const showStandardExtrComponent = () => {
    return (
      <>
        <h3 className="extract-rule-title">
          {intl.get('workflow.information.extrRules')}
          <span className="extract-rule-add-icon">
            <Tooltip title={intl.get('workflow.information.add')}>
              <IconFont type="icon-Add" className="rule-add-icon" onClick={onAddExtrItemClick} />
            </Tooltip>
          </span>
        </h3>

        <div
          className="extract-items-box"
          onScroll={() => {
            if (inputInfo.id) {
              const input = document.getElementById(inputInfo.id);
              if (input && showSelect) input.blur();
            }
          }}
        >
          <ScrollBar isshowx="false" color="rgb(184,184,184)" className="extract-rules-scroll" ref={ruleScrollRef}>
            {activeID === -1 ? null : mapExtrRules()}
          </ScrollBar>
        </div>

        {/* 属性字段 */}
        {showSelect ? (
          <SearchSelect
            visible={showSelect}
            selectData={dataSourceList[getIndexById(activeID, dataSourceList)].selectRules}
            searchText={fieldText}
            pid={'extract-rule'}
            inputId={inputInfo.id}
            onChange={onFieldChange}
          />
        ) : (
          <div />
        )}
      </>
    );
  };

  /**
   * @description 渲染抽取规则
   * @param {Array} rules 抽取规则列表
   */
  const mapExtrRules = () => {
    const activeIndex = getIndexById(activeID, dataSourceList);

    if (activeIndex === -1) return;

    const rules = [...dataSourceList[activeIndex].extract_rules];

    if (rules.length === 0) {
      return (
        <div className="no-rule">
          <img src={emptyImg} alt="nodata" />
          <p className="no-rule-word">{intl.get('workflow.information.noRule')}</p>
        </div>
      );
    }

    return rules.map((rule, index) => {
      return (
        <div
          className={`
            extract-item 
            ${delRuleIndex === index ? 'del-animation' : ''}
            ${startAddRule && index === rules.length - 1 ? 'add-animation' : ''}
          `}
          key={rule.id}
        >
          <div className="extract-item-form-box">
            <div className={anyDataLang === 'en-US' ? 'rule-item-EN' : 'rule-item-CN'}>
              <div className="rule-name-box">
                <label className="rule-label">{intl.get('workflow.information.property')}</label>
              </div>

              <div className="rule-input-box">
                <Input
                  className={`rule-input ${rule.errMsg[0] !== '' ? 'rule-input-error' : ''}`}
                  autoComplete="off"
                  placeholder={intl.get('workflow.information.nameHolder')}
                  value={rule.entity_type}
                  disabled={rule.disabled && rule.is_model !== FROM_MODEL}
                  readOnly={rule.is_model === FROM_MODEL}
                  onChange={e => checkTools.onRuleChange(e, ENTITY, rules, index)}
                  onFocus={e => {
                    if (rule.is_model === FROM_MODEL) return e.target.blur();
                    if (checkTools.isNewAdd(rules)) {
                      setTimeout(() => {
                        checkTools.scrollToErr();
                      }, 0);
                    }
                  }}
                />

                <span className="entity-err-info">{rule.errMsg[0]}</span>
              </div>
            </div>

            <div className="rule-line" />

            <div className={anyDataLang === 'en-US' ? 'rule-item-EN' : 'rule-item-CN'}>
              <div className="rule-name-box">
                <label className="rule-label">{intl.get('workflow.information.propertyField')}</label>
              </div>

              <div className="rule-input-box">
                <Input
                  id={`field${rule.id}`}
                  autoComplete="off"
                  className={`rule-input ${rule.errMsg[1] !== '' ? 'rule-input-error' : ''}`}
                  placeholder={intl.get('workflow.information.fieldHolder')}
                  value={rule.property.property_field}
                  disabled={rule.disabled && rule.is_model !== FROM_MODEL}
                  readOnly={rule.is_model === FROM_MODEL}
                  onChange={e => checkTools.onRuleChange(e, FIELD, rules, index)}
                  onFocus={e => {
                    if (rule.is_model === FROM_MODEL) return e.target.blur();
                    if (checkTools.isNewAdd(rules)) {
                      setTimeout(() => {
                        checkTools.scrollToErr();
                      }, 0);
                    } else {
                      setShowSelect(true);
                      setInputInfo({ id: `field${rule.id}`, rules, index });
                    }
                  }}
                  onBlur={() => {
                    setShowSelect(false);
                    setFieldText('');
                  }}
                />

                <span className="field-err-info">{rule.errMsg[1]}</span>
              </div>
            </div>
          </div>
          <div
            className={`${rule.is_model === FROM_MODEL ? 'model-item-delete' : 'extract-item-delete'}`}
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              onDelRuleClick(rules, index);
            }}
          >
            <IconFont type="icon-lajitong" />
          </div>
        </div>
      );
    });
  };

  /**
   * @description 属性字段select改变时回调函数
   * @param {string} value 选中的值
   */
  const onFieldChange = value => {
    const { rules, index } = JSON.parse(JSON.stringify(inputInfo));

    checkTools.onChangeBindState(value, FIELD, rules, index); // 选中的值回填到输入框
    checkTools.checkPropertyField(value, rules, index); // 校验

    // 改变后触发blur关闭选择器
    const input = document.getElementById(inputInfo.id);

    input.blur();
  };

  /**
   * @description 点击新增抽取项
   */
  const onAddExtrItemClick = () => {
    const dsList = [...dataSourceList];
    const index = getIndexById(activeID, dsList);
    let rules = dsList[index].extract_rules;

    // 之前新增了但没有填写, 不新增
    if (checkTools.isNewAdd(rules)) {
      setTimeout(() => {
        if (ruleScrollRef.current) ruleScrollRef.current.scrollbars.scrollToBottom();
      }, 0);
      return;
    }

    // 之前填写的有错, 不新增
    if (rules.length !== 0 && checkTools.isError(rules)) return checkTools.scrollToErr();
    // 截断文件后缀名
    let name = '';

    if (dsList[index].extract_type !== MODEL_EXTRACTION) {
      const nameList = dsList[index].name.split('.');
      name = nameList.length > 1 ? nameList.slice(0, -1).join('') : dsList[index].name;
    }

    rules = [...rules, createRule(ruleKey, NOT_MODEL, name, '')];

    setRuleKey(ruleKey + 1);

    dsList[index].isDsError = false;
    dsList[index].errorTip = '';
    dsList[index].extract_rules = rules;

    setDataSourceList(dsList);
    setStartAddRule(true);
    if (isRuleErr) setIsRuleErr(false);

    setTimeout(() => {
      if (ruleScrollRef.current) ruleScrollRef.current.scrollbars.scrollToBottom();
    }, 0);

    setTimeout(() => {
      setStartAddRule(false);
    }, ANIMATION_TIME);
  };

  /**
   * @description 点击删除抽取项
   * @param {Array} rules 抽取规则列表
   * @param {number} index 抽取规则索引
   */
  const onDelRuleClick = async (rules, index) => {
    if (rules[index] && rules[index].is_model === FROM_MODEL) return;

    const title = intl.get('workflow.information.isDelRuleTitle');
    const content = intl.get('workflow.information.isDelRuleText');
    const okText = intl.get('workflow.information.ok');
    const cancelText = intl.get('workflow.information.cancel');
    const isOk = await modalBox.warmingModal(title, content, okText, cancelText);

    if (isOk) {
      const newRules = rules.filter((item, i) => i !== index);

      setDelRuleIndex(index);

      // 等待页面执行300ms删除动画
      setTimeout(() => {
        setDelRuleIndex(-1);
        message.success(intl.get('workflow.information.ruleDelSuccess'));

        if (!checkTools.isError([rules[index]]) && !rules[index].disabled) {
          // 没有错, 直接更新
          if (isRuleErr) setIsRuleErr(false);
          checkTools.uptateRules(newRules);

          return;
        }

        if (!checkTools.isError([rules[index]]) && rules[index].disabled) {
          // 此项无错误, 但被禁用了, 说明存在错误项
          const errindex = newRules.findIndex(rule => rule.errMsg.some(err => err !== ''));
          if (newRules[errindex].errMsg[1] === checkTools.errMsg.repeat) {
            // 重名错误, 取消禁用, 去掉重名警告
            newRules[errindex].errMsg[1] = '';
            checkTools.setDisabled(newRules, errindex, false);
            if (isRuleErr) setIsRuleErr(false);
          } else {
            // 不是重名, 直接删除, 且保持禁用状态
            checkTools.uptateRules(newRules);
          }

          return;
        }

        if (checkTools.isError([rules[index]])) {
          // 删的是错误项的, 取消其他的禁用
          checkTools.setDisabled(newRules, -1, false);
          if (isRuleErr) setIsRuleErr(false);
        }
      }, ANIMATION_TIME);
    }
  };

  /**
   * @description 校验工具, 校验用户输入信息的抽取规则, 为了使用this, 不用箭头函数
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
     * @description 更新抽取规则
     * @param {Array} rules 抽取规则列表
     */
    uptateRules(rules) {
      const dsList = [...dataSourceList];
      const index = getIndexById(activeID, dsList);

      if (dsList[index]) {
        dsList[index].extract_rules = rules;
        setDataSourceList(dsList);
      }
    },

    /**
     * @description 抽取规则输入框value绑定state
     * @param {string} value 输入的值
     * @param {string} type "entity_type", "property_field", "property_func"
     * @param {Array} rules 抽取规则列表
     * @param {number} index 抽取规则索引
     */
    onChangeBindState(value, type, rules, index) {
      switch (type) {
        case ENTITY:
          rules[index].entity_type = value;
          break;
        case FIELD:
          rules[index].property.property_field = value;
          break;
        default:
          return null;
      }

      this.uptateRules(rules);
    },

    /**
     * @description 设置错误提示信息
     * @param {string} type "entity_type", "property_field", "property_func"
     * @param {Array} rules 抽取规则列表
     * @param {number} index 抽取规则索引
     * @param {string} msg 错误信息, 可选参数, 若不传参则设置为空
     */
    // eslint-disable-next-line max-params
    setErrMsg(type, rules, index, msg = '', dsList = null, dsIndex = undefined) {
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
        setDataSourceList(dsList);
      } else {
        this.uptateRules(rules);
      }
    },

    /**
     * @description 禁用除了当前抽取规则之外的其他输入框
     * @param {Array} rules 抽取规则列表
     * @param {number} index 抽取规则索引
     * @param {boolean} isDisabled true则禁用, false取消禁用
     * @param {Array} dsList 文件列表, 可选参数, 不传递则自动从state更新
     * @param {number} dsIndex 文件索引，可选参数
     */
    setDisabled(rules, index, isDisabled, dsList = null, dsIndex = undefined) {
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
        setDataSourceList(dsList);
      } else {
        this.uptateRules(rules);
      }
    },

    /**
     * @description 校验实体类名
     * @param {string} value 校验值
     * @param {Array} rules 抽取规则列表
     * @param {number} index 抽取规则索引
     */
    checkEntityType(value, rules, index) {
      const reg = /^[\u4e00-\u9fa5A-Za-z0-9_]+$/;
      const isRepeat = this.isRepeat(rules, index);
      let hasErr = false;
      let errMsg = '';

      if (isRepeat) {
        this.setDisabled(rules, index, true);
        this.setErrMsg(FIELD, rules, index, this.errMsg.repeat);
        return;
      }

      if (value.length === 0) {
        hasErr = true;
        errMsg = this.errMsg.empty;
      } else if (value.length > 64) {
        hasErr = true;
        errMsg = this.errMsg.max64;
      } else if (!reg.test(value)) {
        hasErr = true;
        errMsg = this.errMsg.wrongful;
      }

      if (hasErr) {
        this.setDisabled(rules, index, true);
        this.setErrMsg(ENTITY, rules, index, errMsg);
        return;
      }

      this.setErrMsg(ENTITY, rules, index); // 输入合法, 错误信息置空

      if (rules[index].errMsg[1] === this.errMsg.repeat) {
        rules[index].errMsg[1] = ''; // 重名更改
      }

      if (rules[index].errMsg.some(err => err !== '')) {
        setIsRuleErr(true); // 当前合法,其他两个项有错
      } else {
        setIsRuleErr(false);
        this.setDisabled(rules, index, false);
      }
    },

    /**
     * @description 校验属性字段
     * @param {string} value 校验值
     * @param {Array} rules 抽取规则列表
     * @param {number} index 抽取规则索引
     */
    checkPropertyField(value, rules, index) {
      const reg = /^[\u4e00-\u9fa5A-Za-z0-9_]+$/;
      const isRepeat = this.isRepeat(rules, index);
      let hasErr = false;
      let errMsg = '';

      if (isRepeat) {
        this.setDisabled(rules, index, true);
        this.setErrMsg(FIELD, rules, index, this.errMsg.repeat);
        return;
      }

      if (value.length === 0) {
        hasErr = true;
        errMsg = this.errMsg.empty;
      } else if (value.length > 64) {
        hasErr = true;
        errMsg = this.errMsg.max64;
      } else if (!reg.test(value)) {
        hasErr = true;
        errMsg = this.errMsg.wrongful;
      }

      if (hasErr) {
        this.setDisabled(rules, index, true);
        this.setErrMsg(FIELD, rules, index, errMsg);
        return;
      }

      this.setErrMsg(FIELD, rules, index); // 输入合法, 错误信息置空

      if (rules[index].errMsg[0] === this.errMsg.repeat) {
        rules[index].errMsg[0] = ''; // 重名错误置空
      }

      if (rules[index].errMsg.some(err => err !== '')) {
        setIsRuleErr(true); // 当前合法,且此规则全对,才取消禁用
      } else {
        setIsRuleErr(false);
        this.setDisabled(rules, index, false);
      }
    },

    /**
     * @description 校验是否重复
     * @param {Array} rules 抽取规则列表
     * @param {number} index 第index个抽取规则
     */
    isRepeat(rules, index) {
      const rule = rules[index];
      const filterRules = rules.filter(item => {
        return item.entity_type === rule.entity_type && item.property.property_field === rule.property.property_field;
      });

      return filterRules.length > 1;
    },

    /**
     * @description 检测是否存在错误
     * @param {Array} rules 抽取规则列表
     */
    isError(rules) {
      let isErr = false;

      rules.forEach(rule => {
        // 没有填写
        if (!rule.entity_type || !rule.property.property_field || !rule.property.property_func) {
          isErr = true;
        }

        // 填写有误
        rule.errMsg.forEach(err => {
          if (err) {
            isErr = true;
          }
        });
      });

      return isErr;
    },

    /**
     * @description 输入时, 实时校验
     * @param {DOM.event} e change事件
     * @param {string} type "entity_type", "property_field", "property_func"
     * @param {Array} rules 抽取规则列表
     * @param {number} index 第index个抽取规则
     */
    onRuleChange(e, type, rules, index) {
      const { value } = e.target;

      this.onChangeBindState(value, type, rules, index);

      switch (type) {
        case ENTITY:
          this.checkEntityType(value, rules, index);
          break; // 校验
        case FIELD:
          setFieldText(value); // 模糊搜索值
          this.checkPropertyField(value, rules, index);
          break;
        default:
          return null;
      }
    },

    /**
     * @description 新增了抽取, 未填写且无错误信息
     * @param {Array} rules 抽取规则列表
     */
    isNewAdd(rules) {
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
    checkAll(dsList) {
      const errInfo = { fileIndex: -1, ruleIndex: -1, err0: '', err1: '' };

      if (dsList.length === 0) return errInfo; // 未添加文件

      for (let i = 0; i < dsList.length; i++) {
        const rules = dsList[i].extract_rules;
        let isBreak = false;
        let repeatField = [];
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
      const scroll = document.querySelector('div.show div.extract-rules-scroll div:first-of-type');
      const input = document.querySelector('div.show div.extract-item .extract-item-form-box .rule-input-error');
      const container = document.querySelector('div.show div.extract-items-box');

      if (scroll && input && container) {
        const ruleNode = input.parentNode.parentNode.parentNode.parentNode;
        const y = ruleNode.offsetTop;
        const scrollY = scroll.scrollTop;
        const viewHeight = container.clientHeight;

        if (y < scrollY || y + 117 > scrollY + viewHeight) {
          // 容器盒子高度 117
          scroll.scrollTop = y - 20; // 上margin 20
        }
      }
    },

    scrollToFile(index) {
      const height = 94; // 每一项高度94px

      if (dslistScrollRef.current) dslistScrollRef.current.scrollbars.scrollTop(index * height);
    }
  };

  // 展示看板滚动条始终归位到top和left
  const resetScroll = ref => {
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
        <div className="info-extract-source-list">
          <h2 className="=list-title">{intl.get('workflow.information.fileList')}</h2>
          <div className="select-source-btn-box">
            <Button
              className="select-source-btn"
              icon={<IconFont type="icon-Add" style={{ fontSize: 16, transform: 'translateY(1px)' }} />}
              onClick={() => {
                if (isRuleErr) return showRuleErrMsg();
                const dsList = [...dataSourceList];
                const activeIndex = getIndexById(activeID, dsList);

                if (dsList.length > 0 && activeIndex !== -1) {
                  const rules = dsList[activeIndex].extract_rules;
                  if (checkTools.isNewAdd(rules)) return showRuleErrMsg();
                }
                setSelectDsModalVisible(true);
              }}
            >
              {intl.get('workflow.information.selectDs')}
            </Button>
            {modalBox.selectDsModal()}
          </div>
          <div className="ds-item-box">
            <ScrollBar color="rgb(184,184,184)" ref={dslistScrollRef} isshowx="false">
              <ul>{dataSourceList instanceof Array ? mapDataSourceItem(dataSourceList) : null}</ul>
            </ScrollBar>
          </div>
        </div>

        {activeID === -1 ? (
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
                <span className="show-board-file-name" title={showName.replace(/(.{30})/g, '$1\n')}>
                  {showName}
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
            <div className="info-extract-rule" id="extract-rule">
              {getIndexById(activeID, dataSourceList) === -1 ? null : showStandardExtrComponent()}
            </div>
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
    </div>
  );
};

const mapStateToProps = state => ({
  anyDataLang: state.getIn(['changeAnyDataLang', 'anyDataLang'])
});

const mapDispatchToProps = dispatch => ({
  updateAnyDataLang: anyDataLang => dispatch(changeAnyDataLang(anyDataLang))
});

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(forwardRef(InfoExtr));
