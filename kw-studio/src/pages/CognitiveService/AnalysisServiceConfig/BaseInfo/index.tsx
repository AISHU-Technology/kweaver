/**
 * 图分析服务基本信息
 */
import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Button, Select, ConfigProvider, Empty, message, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

import { PERMISSION_KEYS, ANALYSIS_SERVICES, GRAPH_LAYOUT_PATTERN } from '@/enums';
import serviceGraphDetail from '@/services/graphDetail';
import servicesPermission from '@/services/rbacPermission';
import cognitiveSearchService from '@/services/cognitiveSearch';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

import { tipModalFunc } from '@/components/TipModal';
import { BasicData, GraphItem, ActionType } from '../types';

import layout_pattern_common from '@/assets/images/layout_pattern_common.svg';
import layout_pattern_tree from '@/assets/images/layout_pattern_tree.svg';
import kongImg from '@/assets/images/kong.svg';
import './style.less';

const BaseInfoLine = (props: any) => {
  const { title = '', errorText = '', children } = props;
  return (
    <div className={classNames('form-row kw-align-center kw-mb-8', { 'error-border': errorText })}>
      <div className="form-label kw-c-header kw-mr-5">{title}</div>
      <div className="form-content">
        {children}
        <div className="err-msg">{errorText}</div>
      </div>
    </div>
  );
};

const SelectGraphLayoutPattern = (props: any) => {
  const { basicData } = props;
  const { onChange } = props;

  const value = basicData?.graphLayoutPattern;
  const operation_type = basicData?.operation_type;

  const [graphTypes, setGraphTypes] = useState([
    {
      key: GRAPH_LAYOUT_PATTERN.COMMON,
      title: intl.get('analysisService.common'),
      selected: value === GRAPH_LAYOUT_PATTERN.COMMON,
      tip: intl.get('analysisService.styleSupportsTip'),
      disabled: false,
      image: layout_pattern_common,
      deps: [
        ANALYSIS_SERVICES.SEARCH_TYPE?.CUSTOM_SEARCH,
        ANALYSIS_SERVICES.SEARCH_TYPE?.NEIGHBOR,
        ANALYSIS_SERVICES.SEARCH_TYPE?.SHOREST_PATH,
        ANALYSIS_SERVICES.SEARCH_TYPE?.ALL_PATH
      ]
    },
    {
      key: GRAPH_LAYOUT_PATTERN.TREE,
      title: intl.get('analysisService.compactBox'),
      selected: value === GRAPH_LAYOUT_PATTERN.TREE,
      tip: intl.get('analysisService.styleSupportsTreeTip'),
      disabled: false,
      image: layout_pattern_tree,
      deps: [ANALYSIS_SERVICES.SEARCH_TYPE?.CUSTOM_SEARCH, ANALYSIS_SERVICES.SEARCH_TYPE?.NEIGHBOR]
    }
  ]);

  useEffect(() => {
    const newGraphTypes = _.map(graphTypes, item => {
      if (value) item.selected = value === item.key;
      if (operation_type) {
        item.disabled = !_.includes(item.deps, operation_type);
        if (item.disabled && item.selected) onChange({ graphLayoutPattern: GRAPH_LAYOUT_PATTERN.COMMON });
      }
      return item;
    });
    setGraphTypes(newGraphTypes);
  }, [value, operation_type]);

  return (
    <div className="graphType">
      {_.map(
        graphTypes,
        (item: {
          key: keyof typeof GRAPH_LAYOUT_PATTERN.PATTERN_OBJECT;
          title: 'string';
          image: any;
          selected: boolean;
          disabled: boolean;
          tip?: string;
        }) => {
          const { key, title, image, selected, disabled, tip } = item;
          return (
            <div
              key={key}
              className={classNames('graphTypeCard', { selected, disabled })}
              onClick={() => !disabled && onChange({ graphLayoutPattern: key })}
            >
              <div className="graphTypeImage">
                <img src={image} />
              </div>
              <div className="graphTypeTitle">
                {tip ? (
                  <span>
                    {title}
                    <Tooltip placement="bottom" title={tip}>
                      <QuestionCircleOutlined className="kw-ml-1" style={{ color: 'rgba(0,0,0,.45)' }} />
                    </Tooltip>
                  </span>
                ) : (
                  <span>{title}</span>
                )}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
};

export interface BaseInfoProps {
  action: ActionType;
  basicData: BasicData;
  isConfigured?: boolean; // 后续流程是否已配置, 若已配置, 在修改信息时警告
  disabled?: boolean;
  isExist: boolean;
  onChange: (data: Partial<BasicData>, isClear?: any) => void;
  onExit: () => void;
  onNext: () => void;
  saveImportEntity: any;
  testData: any;
  setIsChange: any;
}

const BaseInfo = (props: BaseInfoProps) => {
  const {
    action,
    disabled,
    setIsChange,
    basicData,
    isConfigured,
    isExist,
    onExit,
    onNext,
    testData,
    onChange,
    saveImportEntity
  } = props;

  const [knowledgeNetworks, setKnowledgeNetworks] = useState<any>([]); // 可配置的有权限的知识网络
  const [graphs, setGraphs] = useState<any>([]); // 可配置的有权限的图谱
  const [graphList, setGraphList] = useState<GraphItem[]>([]); // 图谱下拉数据

  const [errors, setErrors] = useState<Record<string, string>>({}); // 错误信息
  const optionsQueryType = [
    {
      key: ANALYSIS_SERVICES.SEARCH_TYPE?.CUSTOM_SEARCH,
      text: intl.get('analysisService.graphLangType'),
      describe: intl.get('analysisService.graphLangExplain')
    },
    {
      key: ANALYSIS_SERVICES.SEARCH_TYPE.NEIGHBOR,
      text: intl.get('exploreGraph.neighbor'),
      describe: intl.get('cognitiveService.neighbors.neighborExplain')
    },
    {
      key: ANALYSIS_SERVICES.SEARCH_TYPE.SHOREST_PATH,
      text: intl.get('cognitiveService.analysis.shortestPathQuery'),
      describe: intl.get('cognitiveService.analysis.exploreTheShortestPath')
    },
    {
      key: ANALYSIS_SERVICES.SEARCH_TYPE.ALL_PATH,
      text: intl.get('cognitiveService.analysis.allPathsQuery'),
      describe: intl.get('cognitiveService.analysis.exploreAllPaths')
    }
  ];

  useEffect(() => {
    if (!['create', 'import'].includes(action)) return;
    getKwList();
  }, [action]);

  useEffect(() => {
    if (basicData.knw_id) getGraphList(basicData.knw_id);
  }, [basicData.knw_id]);

  useEffect(() => {
    if (isExist) {
      setErrors({ graph: ' ' });
    } else {
      setErrors({});
    }
  }, [isExist]);

  useEffect(() => {
    if (!basicData.knw_id || action === 'create') return;
    const dataIds = [String(basicData?.kg_id)];
    const postData = { dataType: PERMISSION_KEYS.TYPE_KG, dataIds };
    // servicesPermission.dataPermission(postData).then(result => {
    //   const codesData = _.keyBy(result?.res, 'dataId');
    //   const newGraphData = _.filter(graphList, item => _.includes(codesData?.[item.id]?.codes, 'KG_VIEW'));
    //   if (_.isElement(newGraphData)) message.error(intl.get('analysisService.noGraphAuth'));
    // });
  }, [basicData.kg_id]);

  useEffect(() => {
    const dataIds = _.map(graphList, item => String(item.id));
    const postData = { dataType: PERMISSION_KEYS.TYPE_KG, dataIds };
    // servicesPermission.dataPermission(postData).then(result => {
    //   const codesData = _.keyBy(result?.res, 'dataId');
    //   const newGraphData = _.filter(graphList, item => _.includes(codesData?.[item.id]?.codes, 'KG_VIEW'));
    //   setGraphs(newGraphData);
    // });
    setGraphs(graphList);
  }, [graphList]);

  /** 获取知识网络列表 */
  const getKwList = async () => {
    try {
      const params = { size: 1000, page: 1, rule: 'update', order: 'desc' };
      const { res = {} } = (await servicesKnowledgeNetwork.knowledgeNetGet(params)) || {};
      const dataIds = _.map(res?.df, item => String(item.id));
      const postData = { dataType: PERMISSION_KEYS.TYPE_KN, dataIds };
      // servicesPermission.dataPermission(postData).then(result => {
      //   const codesData = _.keyBy(result?.res, 'dataId');
      //   const authData = _.filter(res?.df, item => _.includes(codesData?.[item.id]?.codes, 'KN_VIEW'));
      //   setKnowledgeNetworks(authData || []);
      // });
      setKnowledgeNetworks(res?.df || []);
    } catch (error) {}
  };

  /**
   * 查询图谱
   * @param id 知识网络id
   */
  const getGraphList = async (id: number) => {
    try {
      const { res } = (await cognitiveSearchService.getKgList(id)) || {};
      setGraphList(res?.df || []);
    } catch (error) {
      //
    }
  };

  /**
   * 切换图谱
   * @param _
   * @param option
   */
  const handleGraphChange = async (e: string, option: any) => {
    const { name, id } = option.data;
    let isModal = true;
    if (action === 'import') {
      try {
        const resultOnto = await serviceGraphDetail.graphGetInfoOnto({ graph_id: id });
        const entityData = resultOnto?.res;
        const copyEntity = _.cloneDeep(entityData);
        const copyOntoData = _.cloneDeep(saveImportEntity);
        // 判断切换后的图谱信息是否一致
        // 导入图谱的所有kg_id

        // config_info中filters的{本体名和properties}、tags是否相同
        // filters不存在，tags存在则指判断tags是否相同
        const allKgIds = _.map(copyOntoData, (item: any) => item?.name);
        const filterEntity = _.filter(copyEntity?.entity, (item: any) => allKgIds.includes(item?.name));
        const lengthIsEqual = allKgIds?.length !== filterEntity?.length && copyEntity?.length !== copyOntoData;
        const isSameName = _.filter(copyEntity?.entity, (item: any) =>
          testData?.config_info?.tags?.includes(item?.name)
        );
        const notSame = !_.isEmpty(copyOntoData)
          ? lengthIsEqual && isSameName?.length !== copyEntity?.entity?.length
          : isSameName?.length !== copyEntity?.entity?.length;

        if (notSame) {
          isModal = true;
        } else {
          const handleOnto = _.reduce(
            copyOntoData,
            (pre: any, key: any) => {
              pre[key.name] = _.map(key?.properties, (item: any) => ({ name: item?.name, type: item?.type }));
              return pre;
            },
            {}
          );
          const handleEntity = _.reduce(
            copyEntity?.entity,
            (pre: any, key: any) => {
              pre[key.name] = key.properties;
              return pre;
            },
            {}
          );

          const isEqual = JSON.stringify(_.sortBy(handleOnto)) === JSON.stringify(_.sortBy(handleEntity));
          const isUpdate = !_.isEmpty(copyOntoData)
            ? isEqual && isSameName?.length === copyEntity?.entity?.length
            : isSameName?.length === copyEntity?.entity?.length;

          if (isUpdate) {
            isModal = false;
          } else {
            isModal = true;
          }
        }
      } catch (err) {
        //
      }
    }

    if (isConfigured || (action === 'import' && isModal)) {
      const isOk = await tipModalFunc({
        title: intl.get('analysisService.changeGraphTitle'),
        content: intl.get('analysisService.changeTip'),
        closable: false
      });
      if (!isOk) return;
    }
    // @release2.0.1.7 engine已经统一使用kgconfid, 为了兼容旧数据仍命名kg_id
    if (action === 'import') {
      setIsChange(true);
    }
    onChange({ kg_id: id, kg_name: name }, isModal);
    setErrors({});
  };

  // 未找到配置相同的知识图谱，请重新选择或添加配置正确的图谱

  /**
   * 下一步
   */
  const onHandleNext = () => {
    if (!basicData?.knw_id) {
      setErrors({ graph: intl.get('exploreGraph.noSelectTip') });
      return;
    }
    if (!basicData.kg_id) {
      setErrors({ graph: intl.get('exploreGraph.noSelectTip') });
      return;
    }
    onNext();
  };

  const customLabelRender = (option: any) => (
    <div className="kw-pt-1 kw-pb-1" style={{ height: 50 }}>
      <div className="kw-c-text">{option?.text}</div>
      <div className="kw-c-watermark kw-ellipsis">{option?.describe}</div>
    </div>
  );

  /** 知识网络的切换 */
  const onChangeKnowledgeNetwork = async (value: string, option: any) => {
    const { knw_name, id } = option.data;

    if (isConfigured || action === 'import') {
      const isOk = await tipModalFunc({
        title: intl.get('cognitiveService.analysis.changeKnwTitle'),
        content: intl.get('analysisService.changeTip'),
        closable: false
      });
      if (!isOk) return;
    }
    if (action === 'import') setIsChange(true);
    onChange({ knw_id: id, knw_name, kg_id: 0, kg_name: '' });
    setErrors({});
  };

  /** 构建知识网络的options数据 */
  const structureOptionsKnowledgeNetworks = () => {
    return _.map(knowledgeNetworks, item => ({ data: item, value: item?.id, label: item.knw_name }));
  };

  /** 构建图谱的options数据 */
  const structureOptionsGraphs = () => {
    return _.map(graphs, item => ({ data: item, value: item?.id, label: item.name }));
  };

  /** 构建查询方式的options数据 */
  const structureOptionsQueryType = () => {
    return _.map(optionsQueryType, item => ({ ...item, value: item?.key, label: customLabelRender(item) }));
  };

  /** 过去查询方式的value */
  const getQueryTypeValue = (op: any) => {
    const data: any = optionsQueryType.find(pro => pro?.key === op);

    return {
      value: data?.value,
      label: (
        <div className="kw-w-100">
          <div className="kw-c-text kw-align-center" style={{ height: 20 }}>
            {data?.text}
          </div>
          <div style={{ height: 20 }} className="kw-c-watermark kw-align-center kw-ellipsis kw-w-100">
            {data?.describe}
          </div>
        </div>
      )
    };
  };

  return (
    <div className="service-config-step1-root kw-h-100 kw-p-6">
      <div className="kw-h-100" style={{ background: '#fff' }}>
        <div className="s-main kw-h-100">
          <BaseInfoLine title={intl.get('global.kgNet')} errorText={errors.knw}>
            <Select
              className="kw-w-100"
              placeholder={intl.get('global.pleaseSelect')}
              disabled={disabled}
              options={structureOptionsKnowledgeNetworks()}
              value={action !== 'create' ? basicData.knw_name : (basicData.knw_id as any) || undefined}
              notFoundContent={<Empty image={kongImg} description={intl.get('global.noData')} />}
              onChange={onChangeKnowledgeNetwork}
            />
          </BaseInfoLine>
          <BaseInfoLine title={intl.get('global.graph')} errorText={errors.graph}>
            <Select
              className="kw-w-100"
              placeholder={intl.get('global.pleaseSelect')}
              disabled={disabled}
              options={structureOptionsGraphs()}
              value={action !== 'create' ? basicData.kg_name : (basicData.kg_id as any) || undefined}
              notFoundContent={<Empty image={kongImg} description={intl.get('global.noData')} />}
              onChange={handleGraphChange}
            />
          </BaseInfoLine>
          <BaseInfoLine title={intl.get('analysisService.queryType')}>
            <Select
              className="kw-w-100 selectCustom"
              labelInValue
              disabled={disabled}
              optionLabelProp="children"
              options={structureOptionsQueryType()}
              value={getQueryTypeValue(basicData?.operation_type)}
              onChange={(_, op: any) => onChange({ operation_type: op?.value })}
            />
          </BaseInfoLine>
          <BaseInfoLine title={intl.get('analysisService.applicationScenarios')}>
            <SelectGraphLayoutPattern basicData={basicData} onChange={onChange} />
          </BaseInfoLine>
          <BaseInfoLine>
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button type="default" className="kw-mr-3" onClick={onExit}>
                {intl.get('global.cancelS')}
              </Button>
              <Button type="primary" onClick={onHandleNext}>
                {intl.get('global.next')}
              </Button>
            </ConfigProvider>
          </BaseInfoLine>
        </div>
      </div>
    </div>
  );
};

export default BaseInfo;
