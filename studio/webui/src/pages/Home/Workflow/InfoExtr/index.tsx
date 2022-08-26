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
import { hasErr, verifyLast, verifySources } from './RuleList/assistFunction';
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

let previewRequestId = 0;
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
  const boardScrollRef = useRef<any>(); // 展示看板的滚动条ref
  const sourceListRef = useRef<any>(); // 抽取源列表ref
  const ruleListRef = useRef<any>(); // 规则列表ref
  const [addDsVisible, setAddDsVisible] = useState(false); // 选择数据源弹窗是否可见
  const [sourceList, setSourceList] = useState<any[]>([]); // 抽取源文件列表
  const [selectedSource, setSelectedSource] = useState<Record<string, any>>({}); // 选择的抽取源
  const [viewType, setViewType] = useState(''); // 展示看板类型, json, non-json, dir, unSupported
  const [previewData, setPreviewData] = useState<any>([]); // 预览数据
  const [modelList, setModelList] = useState<any[]>([]); // 如果是模型抽取, 提供模型供用户选择
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
    prev();
  };

  /**
   * 下一步
   */
  const onNext = async () => {
    if (nextLoading || isRuleHasErr()) return;

    const dsList = updateDsName(sourceList, dataSourceData);
    saveState(dsList);
    if (dsList.length === 0) return message.error(intl.get('workflow.information.placeAddDs'));
    if (dsList.length > 100) return message.error(intl.get('workflow.information.addMaxErr'));

    // 校验所有
    const errIndex = verifySources(dsList);
    setSourceList(dsList);
    if (errIndex.length) {
      message.error(intl.get('workflow.information.ruleError'));
      const [errFile, errRule] = errIndex[0];
      setSelectedSource(dsList[errFile]);
      setTimeout(() => {
        sourceListRef.current.scrollToFile(errFile);
        ruleListRef.current.scrollToErr(errRule);
      }, 0);
      return;
    }

    try {
      const graph_process = generateGraph(dsList);
      setNextLoading(true);
      const graph = { graph_step: 'graph_InfoExt', graph_process };
      const res = await serviceWorkflow.graphEdit(graphId, graph);
      setNextLoading(false);
      if (res?.res) next();
      if (res?.Code || res?.ErrorCode) next(res);
    } catch {
      setNextLoading(false);
    }
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
   * @param data_source 数据源
   * @param name 文件名 | 数据库表名
   */
  const getPreviewData = async (id: any, data_source: string, name: string) => {
    let preData = [];
    let vType = '';
    const params = { id, data_source, name };

    try {
      const signId = ++previewRequestId;
      setPreLoading(true);
      const res = await servicesCreateEntity.getOtherPreData(params);
      if (signId < previewRequestId) return;
      setPreLoading(false);
      if (res?.data || res?.res) {
        vType = res.viewtype ? res.viewtype : 'non-json';
        preData = res.data ? res.data : res.res;
        if (data_source === MQ) vType = 'json';
      }
      if (res?.Code) alertPreviewErr(res.Code, SourceType.STRUCTURED);

      setViewType(vType);
      setPreviewData(preData);
      resetScroll(boardScrollRef);
    } catch {
      setPreLoading(false);
    }
  };

  /**
   * 获取非结构化文件夹平埔的内容
   * @param docid  文件id
   * @param ds_id  数据源id
   */
  const getUnPre = async (docid: string, ds_id: number) => {
    let preData = [];
    const params = { docid, ds_id, postfix: 'all' };

    try {
      const signId = ++previewRequestId;
      setPreLoading(true);
      const res = await servicesCreateEntity.getChildrenFile(params);
      if (signId < previewRequestId) return;
      setPreLoading(false);
      if (res && res.res) preData = res.res.output;
      if (res && res.Code) alertPreviewErr(res.Code);
      setViewType('dir');
      setPreviewData({ ds_id, docid, data: preData });
      resetScroll(boardScrollRef);
    } catch {
      setPreLoading(false);
    }
  };

  /**
   * 获取预测的抽取规则
   * @param data 选择的源
   * @param sources 源列表
   * @param index 选择的索引
   */
  const getSelectRules = async (data: Record<string, any>, sources: any[], index: number) => {
    const { pId, data_source, extract_type, file_id, name, file_type } = data;
    const selectRules: string[] = [];
    const dsList = [...sources];
    const params = {
      ds_id: String(pId),
      data_source,
      file_list:
        data_source === 'as' || data_source === 'as7' ? [{ docid: file_id, type: file_type, name }] : [file_id],
      extract_type,
      step: extract_type === ExtractType.LABEL ? 'Ext' : undefined,
      postfix: name.substring(name.lastIndexOf('.') + 1)
    };

    try {
      const response = await servicesCreateEntity.getFileGraphData(params);
      if (!response?.res) return;
      const { entity_property_dict } = response.res;
      _.forEach(entity_property_dict, (item: any) =>
        _.forEach(item.property, (pro: any[]) => selectRules.push(pro[0]))
      );
      dsList[index].selectRules = _.uniq(selectRules);
      setSourceList(dsList);
    } catch {
      return 0;
    }
  };

  /**
   * 根据selfId找索引
   * @param selfId
   * @param data
   */
  const getIndexById = (selfId: number, data: any[]) => data.findIndex(d => d.selfId === selfId);

  /**
   * 提示抽取规则有误并定位
   */
  const showRuleErrMsg = (index = 0) => {
    message.error(intl.get('workflow.information.ruleError'));
    setTimeout(() => {
      ruleListRef.current.scrollToErr(index);
    }, 0);
  };

  /**
   * 校验正在查看的抽取源是否有误
   */
  const isRuleHasErr = () => {
    if (!selectedSource.selfId) return false;
    const dsList = [...sourceList];
    const newSource = { ...selectedSource };
    const rules = [...selectedSource.extract_rules];
    const isNoInput = verifyLast(rules); // 这个函数会改变传入的数组

    if (isNoInput) {
      newSource.extract_rules = rules;
      const selectedIndex = getIndexById(selectedSource.selfId, dsList);
      dsList[selectedIndex] = newSource;
      setSelectedSource(newSource);
      setSourceList(dsList);
      showRuleErrMsg(rules.length - 1);
      return true;
    }

    const { isErr, index } = hasErr(rules, false);

    isErr && showRuleErrMsg(index);
    return isErr;
  };

  /**
   * 点击添加抽取源
   */
  const onAddClick = () => {
    if (isRuleHasErr()) return;
    setAddDsVisible(true);
  };

  /**
   * 点击抽取源列表
   * @param rowData 单个抽取源
   * @param index 索引
   */
  const onSourceClick = (rowData: Record<string, any>, index: number) => {
    if (rowData.selfId === selectedSource.selfId || isRuleHasErr()) return;
    setSelectedSource(rowData);
    if (rowData.extract_type !== ExtractType.MODEL && !rowData.selectRules.length) {
      setTimeout(() => {
        getSelectRules(rowData, sourceList, index);
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

  // 展示看板滚动条始终归位到top和left
  const resetScroll = (ref: any) => {
    if (!ref.current) return;
    ref.current.scrollLeft = 0;
    ref.current.scrollTop = 0;
  };

  /**
   * 更改抽取规则
   * @param newRules 修改后的规则
   * @param hasErr 是否有错误
   */
  const onRuleChange = (newRules: any[], action: 'change' | 'add') => {
    const sources = [...sourceList];
    const index = getIndexById(selectedSource.selfId, sources);
    const newSource = {
      ...selectedSource,
      extract_rules: newRules,
      ...(action === 'add' ? { isDsError: false, errorTip: '' } : {})
    };
    sources[index] = newSource;
    setSelectedSource(newSource);
    setSourceList(sources);
  };

  return (
    <div className="info-extract-box">
      <div className="info-extract-content">
        <SourceList
          ref={sourceListRef}
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
                <span
                  className="show-board-file-name ad-ellipsis"
                  title={selectedSource.name?.replace(/(.{30})/g, '$1\n')}
                >
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

            <RuleList ref={ruleListRef} data={selectedSource} anyDataLang={anyDataLang} onChange={onRuleChange} />
          </>
        )}
      </div>

      <div className={addLoading ? 'extract-add-loading' : 'hide'}>
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
