/* eslint-disable max-lines */
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Modal,
  message,
  Tooltip,
  Input,
  Checkbox,
  Button,
  Collapse,
  ConfigProvider,
  Select,
  InputNumber,
  Form
} from 'antd';
import { QuestionCircleOutlined, PlusOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import classnames from 'classnames';
import { useSelector, useDispatch } from 'react-redux';
import { changeReset } from '@/reduxConfig/action/knowledgeGraph';
import SearchInput from '@/components/SearchInput';
import Format from '@/components/Format';
import HOOKS from '@/hooks';
import IconFont from '@/components/IconFont';
import { ONLY_KEYBOARD } from '@/enums';
import { getParam, fuzzyMatch, getCorrectColor } from '@/utils/handleFunction';
import NoDataBox from '@/components/NoDataBox';
import UniversalModal from '@/components/UniversalModal';
import intl from 'react-intl-universal';
import servicesSearchConfig from '@/services/searchConfig';
import Empty from '@/assets/images/empty.svg';
import configEmpty from '@/assets/images/strategyEmpty.svg';
import './style.less';
import { checkProperty, initConfs, graphListChange, removeEmptyProperty } from '../../assistFunction';

const { Panel } = Collapse;

const TIP_CONTENT = [
  intl.get('cognitiveSearch.firstStep'),
  intl.get('cognitiveSearch.secondStep'),
  intl.get('cognitiveSearch.thirdStep'),
  intl.get('cognitiveSearch.forStep'),
  intl.get('cognitiveSearch.firthStep')
];

export const FullTextContentSecond = forwardRef((props: any, ref) => {
  const {
    authData,
    onHandleCancel,
    kgqaData,
    kgqaConfig,
    setKgqaConfig,
    isOpenQA,
    setTextIsDisable,
    limitNum,
    thresholdNum,
    onSaveDefault,
    setIsQAConfigError,
    setKgqaData,
    visible
  } = props;

  useImperativeHandle(ref, () => ({
    onSave
  }));

  const searchInput = useRef<any>();
  // graph
  const [graphList, setGraphList] = useState<any[]>([]); // 可配置的图谱列表
  const [graphId, setGraphId] = useState(''); // 选择的图谱id
  const [confs, setConfs] = useState<any>([]);
  // entity
  const [nodeAll, setNodeAll] = useState<any>([]); // 实体类 type 集合
  const [entityAll, setEntityAll] = useState<any>([]); // 实体类id展示
  const [currentEntityType, setCurrentEntityType] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // 搜索的内容
  const [checked, setChecked] = useState(true);
  const [customSep, setCustomSep] = useState('');
  const [synonymsList, setSynonymsList] = useState<any>({});
  const [selectedChecked, setSelectedChecked] = useState<any>([]); // 勾选的实体类\
  const [graphQaContent, setGraphQaContent] = useState<any>([]); // 图谱当前页面qa勾选实体类保存
  const [form] = Form.useForm();
  const defaultSep = [
    { value: ';', label: ';' },
    { value: ',', label: ',' },
    { value: '|', label: '|' },
    { value: '/', label: '/' },
    { value: 'custom', label: `${intl.get('cognitiveSearch.graphQA.custom')}` }
  ];
  const NAME_TEST =
    /(^[\u4e00-\u9fa5_a-zA-Z0-9=~!@#$&%^&*()_+`'"{}[\];:,.?<>|/~！@#￥%…&*·（）—+。={}|【】：；‘’“”、《》？，。/\n\\+\s]+$)|-/;

  const reduxDispatch = useDispatch();
  const isReset = useSelector((state: any) => state.getIn(['graphQA', 'isReset']));

  useEffect(() => {
    // 问答配置 权限校验
  }, []);

  useEffect(() => {
    // 第一步没添加资源，对于isSwitchDisable的操作要改
    if (!kgqaData) return;
    const confsArr = initConfs(kgqaData);
    kgqaData.props.saveConfs = {
      confs: confsArr,
      limit: kgqaData.props.limit,
      // thresholdNum: kgqaData.props.threshold
      threshold: kgqaData.props.threshold
    };
    setConfs(confsArr);
    setGraphQaContent(kgqaData);
    initSaveConfs();
    initGraphList();
  }, []);

  useEffect(() => {
    const entityAllTrue = entityAll.filter((item: any) => {
      return item.selected;
    });
    if (nodeAll.length === entityAllTrue.length) {
      setChecked(true);
    } else {
      setChecked(false);
    }
    if (entityAll.length) {
      saveCurrentGraph();
    }
  }, [entityAll]);

  useEffect(() => {
    if (confs.length && graphList.length) {
      const graphListNew = graphListChange(confs, graphList);
      setGraphList(graphListNew);
    }
  }, [confs]);

  const initGraphList = () => {
    const graphMenu = kgqaData?.props?.data_source_scope;
    setGraphList(graphMenu);
  };

  const initSaveConfs = async () => {
    // 所有的graphqa
    if (isReset) {
      return false;
    }
    const copyData = _.cloneDeep(kgqaData);
    let entityConfs: any = [];
    // 先走默认
    if (copyData?.props?.saveConfs?.confs?.length) {
      entityConfs = copyData?.props?.saveConfs?.confs;
    }
    // 再走手动修改
    if (kgqaConfig?.confs?.length) {
      entityConfs = kgqaConfig?.confs;
    }
    if (entityConfs.length === 0) {
      return false;
    }
    const tmp: any = {};
    _.forEach(entityConfs, confs_item => {
      const { entity_name_props } = confs_item;
      _.forEach(entity_name_props, entity_name_props_item => {
        const { entity, synonyms } = entity_name_props_item;
        if (synonyms.length) {
          tmp[entity] = _.map(synonyms, synonyms_item => {
            const { property, sep, isCustom, customSep } = synonyms_item;
            return { property, sep: isCustom ? 'custom' : sep, isCustom, customSep };
          });
        }
      });
    });
    setSynonymsList(tmp);
  };

  /**
   * 搜索
   */
  const onSearch = _.debounce(e => {
    const { value } = e.target;
    const name = value;
    const matchData = _.filter(nodeAll, (item: any) => fuzzyMatch(name, item?.name));
    setSearchQuery(name);
    setEntityAll(matchData);
    if (matchData.length === 1) {
      setCurrentEntityType(matchData[0].type);
    }
  }, 300);

  /**
   * 复选框变化
   */
  const onCheckChange = (isCheck: any, type: any) => {
    const checked = isCheck?.target?.checked;
    const entityArr = _.map(entityAll, (entities_item: any) => {
      if (entities_item.type === type) {
        return { ...entities_item, selected: checked };
      }
      return entities_item;
    });
    const checkedArr = _.filter(entityArr, (item: any) => item?.selected);
    setSelectedChecked(checkedArr);
    setEntityAll(entityArr);
    const copyConfs = _.cloneDeep(graphQaContent?.props?.confs);
    const updateConfs = _.map(copyConfs, (item: any) => {
      if (item?.kg_id === String(graphId)) {
        item.entities = entityArr;
        return item;
      }
      return item;
    });
    const updateSaveConfs = _.map(graphQaContent?.props?.saveConfs?.confs, (item: any) => {
      if (item?.kg_id === String(graphId)) {
        item.entity_name_props = entityArr;
        return item;
      }
      return item;
    });
    graphQaContent.props.confs = updateConfs;
    graphQaContent.props.saveConfs.confs = updateSaveConfs;
    setGraphQaContent(graphQaContent);
  };

  /**
   * 全选框
   */
  const onAllCheck = (e: any) => {
    const checked = e?.target?.checked;
    const entityArr = _.map(entityAll, (entities_item: any) => {
      return { ...entities_item, selected: checked };
    });
    const checkedArr = _.filter(entityArr, (item: any) => item?.selected);
    setSelectedChecked(checkedArr);
    setEntityAll(entityArr);

    const copyConfs = _.cloneDeep(graphQaContent?.props?.confs);
    const updateConfs = _.map(copyConfs, (item: any) => {
      if (item?.kg_id === String(graphId)) {
        item.entities = entityArr;
        return item;
      }
      return item;
    });

    const updateSaveConfs = _.map(graphQaContent?.props?.saveConfs?.confs, (item: any) => {
      if (item?.kg_id === String(graphId)) {
        item.entity_name_props = entityArr;
        return item;
      }
      return item;
    });
    graphQaContent.props.confs = updateConfs;
    graphQaContent.props.saveConfs.confs = updateSaveConfs;
    setGraphQaContent(graphQaContent);
  };

  const onChange = (e: any) => {};

  /**
   * 图谱资源点击
   */
  const onSelectGraph = async (index: number, kgId: string, isManual: any) => {
    setGraphId(kgId);
    setCurrentEntityType('');

    let entities: any = [];

    const copyData = _.cloneDeep(graphQaContent);
    _.map(copyData?.props?.confs, (confs_item: any) => {
      if (String(confs_item.kg_id) === String(kgId)) {
        entities = confs_item.entities;
      }
    });
    let entityArr = _.map(entities, (entities_item: any) => {
      const { default_property, type, properties, selected = true, colour, alias } = entities_item;
      return {
        ...entities_item,
        color: getCorrectColor(colour),
        selected,
        std: default_property,
        entity: type,
        properties: properties.map((item: any) => ({ ...item, value: item.name, label: item.name })),
        synonyms: [],
        name: `${type} (${alias})`
      };
    });
    if (!isReset) {
      let entityConfs: any = [];
      // 先走默认
      if (copyData?.props?.saveConfs?.confs?.length) {
        entityConfs = copyData?.props?.saveConfs?.confs;
      }
      // 再走手动修改
      if (kgqaConfig?.confs?.length) {
        entityConfs = kgqaConfig?.confs;
      }
      if (entityConfs.length > 0) {
        let saveEntities: any = [];
        _.forEach(entityConfs, (confs_item: any) => {
          if (String(confs_item.kg_id) === String(kgId)) {
            saveEntities = confs_item.entity_name_props;
          }
        });
        if (saveEntities?.length) {
          entityArr = _.map(entityArr, (entities_item: any) => {
            const std = saveEntities.filter((i: any) => i.entity === entities_item.entity)[0].std;
            const selected = saveEntities.filter((i: any) => i.entity === entities_item.entity)[0].selected;
            return {
              ...entities_item,
              selected,
              std
            };
          });
        }
      }
    }
    setEntityAll(entityArr);
    const checkedArr = _.filter(entityArr, (item: any) => item?.selected);
    setSelectedChecked(checkedArr);
    setNodeAll(entityArr);
    if (isManual) {
      saveCurrentGraph();
    }
  };

  /**
   * 保存
   */
  const onSave = async () => {
    return form.validateFields().then(async values => {
      const confsNew = saveCurrentGraph();
      if (!checkProperty(confsNew)) {
        message.warning(intl.get('cognitiveSearch.graphQA.checkPropertyError'));
        setIsQAConfigError(true);
        return false;
      }
      const kgqaConfigData = {
        limit: parseInt(limitNum),
        threshold: parseFloat(thresholdNum),
        confs: graphQaContent?.props?.saveConfs?.confs,
        switch: isOpenQA,
        ans_organize: kgqaConfig?.ans_organize
      };

      kgqaData.props = { ...kgqaData.props, limit: parseInt(limitNum), threshold: parseFloat(thresholdNum) };

      setIsQAConfigError(false);
      setKgqaConfig((pre: any) => ({ ...pre, ...kgqaConfigData }));
      setKgqaData({ ...kgqaData });
      // // onHandleCancel(true);
      reduxDispatch(changeReset(false));
      return true;
    });
  };

  const saveCurrentGraph = () => {
    const currentGraph = {
      kg_id: graphId,
      selected: true,
      entity_name_props: entityAll.map((item: any) => {
        const { entity, selected, std } = item;
        let synonyms: any = [];
        if (synonymsList[entity] && synonymsList[entity].length) {
          synonymsList[entity].forEach((synonymsItem: any) => {
            const { customSep, isCustom, property, sep } = synonymsItem;
            synonyms = [...synonyms, { property, sep: isCustom ? customSep : sep, isCustom, customSep }];
          });
        }
        return { entity, selected, std, synonyms };
      })
    };
    const findIndex = _.map(confs, (item: any) => {
      if (item?.kg_id === currentGraph?.kg_id) {
        item.entity_name_props = currentGraph?.entity_name_props;
        return item;
      }
      return item;
    });
    const confsNew = [...findIndex];
    const cloneSaveConfs = _.cloneDeep(graphQaContent?.props?.saveConfs?.confs);

    const confsCopy = _.map(cloneSaveConfs, (item: any) => {
      if (item?.kg_id === String(currentGraph?.kg_id)) {
        item.entity_name_props = currentGraph?.entity_name_props;
        return item;
      }
      return item;
    });

    graphQaContent.props.saveConfs.confs = confsCopy;
    setGraphQaContent(graphQaContent);
    return confsCopy;
  };

  /**
   * 新增同义词
   */
  const addNewSynonym = () => {
    const tmp: any = {
      property: null,
      sep: null,
      isCustom: false,
      customSep: ''
    };
    const typeSynonyms = synonymsList[currentEntityType] ? synonymsList[currentEntityType] : [];
    const synonymsListNew = {
      ...synonymsList,
      [currentEntityType]: [...typeSynonyms, tmp]
    };
    setSynonymsList(synonymsListNew);
  };

  /**
   * 删除同义词
   */
  const deleteSynonymItem = (index: number) => {
    const typeSynonyms = synonymsList[currentEntityType];
    typeSynonyms.splice(index, 1);
    const synonymsListNew = {
      ...synonymsList,
      [currentEntityType]: [...typeSynonyms]
    };
    setSynonymsList(synonymsListNew);
    saveCurrentGraph();
  };

  /**
   * 同义词填入变化
   */
  const changeSynonymsProperty = (index: number, value: string) => {
    const typeSynonyms = synonymsList[currentEntityType];
    typeSynonyms[index].property = value;
    const synonymsListNew = {
      ...synonymsList,
      [currentEntityType]: [...typeSynonyms]
    };
    setSynonymsList(synonymsListNew);
    saveCurrentGraph();
  };

  /**
   * 改变分隔符
   */
  const changeSeparator = (index: number, value: string) => {
    const typeSynonyms = synonymsList[currentEntityType];
    if (value === 'custom') {
      typeSynonyms[index].isCustom = true;
    } else {
      typeSynonyms[index].isCustom = false;
      typeSynonyms[index].customSep = '';
    }
    typeSynonyms[index].sep = value;
    const synonymsListNew = {
      ...synonymsList,
      [currentEntityType]: [...typeSynonyms]
    };
    setSynonymsList(synonymsListNew);
    saveCurrentGraph();
  };

  const changeCusomSep = (e: any, index: number) => {
    const value = e.target.value;
    setCustomSep(value);
    const typeSynonyms = synonymsList[currentEntityType];
    typeSynonyms[index].customSep = value;
    const synonymsListNew = {
      ...synonymsList,
      [currentEntityType]: [...typeSynonyms]
    };
    setSynonymsList(synonymsListNew);
  };

  const handleSelectEntityRow = (type: string) => {
    setCurrentEntityType(type);
  };

  const handleChangeProperty = (value: string) => {
    const entityArr = _.map(entityAll, (entities_item: any) => {
      if (entities_item.type === currentEntityType) {
        return { ...entities_item, std: value };
      }
      return entities_item;
    });
    const checkedArr = _.filter(entityArr, (item: any) => item?.selected);
    setSelectedChecked(checkedArr);
    setEntityAll(entityArr);
    saveCurrentGraph();
  };

  return (
    <>
      {visible ? (
        <div className="full-text-qa-wrapper kw-flex">
          <div className="kw-flex second-step-box">
            <div className="file-left">
              {/* 左侧资源图谱 */}
              <Collapse defaultActiveKey={['0']} onChange={onChange} className="infoDrawer">
                <div className="full-title titleOpen">
                  <Format.Title className="full-content">
                    {intl.get('cognitiveSearch.graphQA.graphResource')}
                  </Format.Title>
                </div>
                {graphList?.map((i: any, index: any) => {
                  return (
                    <div className="ant-collapse-content" key={i?.kg_id + index}>
                      <p
                        key={i?.kg_id}
                        className={classnames('kw-flex', graphId === i?.kg_id ? 'select-light' : 'not-select')}
                        onClick={() => {
                          if (!_.includes(authData, i?.kg_id)) return;
                          onSelectGraph(index, i?.kg_id, true);
                        }}
                      >
                        <IconFont type="icon-color-zhishitupu11" className="graph-icon" style={{ fontSize: 16 }} />
                        <span
                          title={i?.kg_name}
                          className={classnames('kw-ellipsis graph-name kw-mr-2', {
                            'kw-c-watermark': !_.includes(authData, i?.kg_id)
                          })}
                        >
                          {i?.kg_name}
                        </span>
                        <div className="icon-look-out">
                          {i?.error && (
                            <Tooltip
                              placement="top"
                              className="icon-caution"
                              arrowPointAtCenter
                              title={intl.get('cognitiveSearch.graphQA.stdIsEmptyGraphTip')}
                            >
                              <ExclamationCircleOutlined style={{ color: '#F5222D' }} />
                            </Tooltip>
                          )}
                          <IconFont type="icon-fanye" className="icon-arrow" />
                        </div>
                      </p>
                    </div>
                  );
                })}
              </Collapse>
            </div>

            {!graphId ? (
              <div className="no-complete-search kw-center">
                <img src={configEmpty} alt="empty" />
                <div className="full-tip">
                  {_.map(TIP_CONTENT, (item: any, index: any) => {
                    return (
                      <div key={index} className="tip-content kw-c-subtext">
                        {item}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* 中间-实体类列表 */}
                <div className="file-middle">
                  <div className="file-middle-head">
                    <div className="middle-title">{intl.get('cognitiveSearch.graphQA.entityList')}</div>
                    <div className="middle-text">
                      <span className="kw-c-primary">{selectedChecked?.length}</span>/<span>{nodeAll?.length}</span>
                    </div>
                  </div>

                  <div className="middle-select">
                    <SearchInput
                      ref={searchInput}
                      allowClear={true}
                      placeholder={intl.get('cognitiveSearch.searchEntity')}
                      prefix={
                        <IconFont type="icon-sousuo" className="search-icon kw-pointer" style={{ opacity: '0.25' }} />
                      }
                      onChange={e => {
                        e.persist();
                        onSearch(e);
                      }}
                      className="input-second-middle kw-mt-2 kw-pb-1 kw-mb-2 kw-ml-5"
                    />
                    {searchQuery && _.isEmpty(entityAll) ? (
                      <NoDataBox.NO_RESULT />
                    ) : (
                      <div className="middle-height">
                        {(searchQuery && _.isEmpty(entityAll)) || _.isEmpty(entityAll) ? null : (
                          <div className="middle-checkbox kw-pr-4 kw-pb-4" key={intl.get('cognitiveSearch.all')}>
                            <Checkbox onChange={onAllCheck} checked={checked}>
                              <div className="kw-flex" style={{ alignItems: 'center' }}>
                                {intl.get('cognitiveSearch.all')}
                              </div>
                            </Checkbox>
                          </div>
                        )}
                        {_.map(entityAll, (item: any, index: any) => {
                          return (
                            <div
                              className={classnames('middle-checkbox kw-pr-4 kw-pointer', {
                                'middle-checkbox-select': item.type === currentEntityType
                              })}
                              key={item.type}
                              onClick={() => handleSelectEntityRow(item.type)}
                            >
                              <Checkbox
                                onChange={isCheck => onCheckChange(isCheck, item.type)}
                                checked={item.selected}
                              ></Checkbox>
                              <div className="kw-flex kw-ml-2" style={{ alignItems: 'center' }} key={item.type}>
                                <div className="middle-circle kw-mr-2" style={{ background: item.color }}></div>
                                <div title={item.name} className="kw-ellipsis graph-name kw-mr-2">
                                  {item.name}
                                </div>
                                <div className="icon-look-out-middle">
                                  {!item?.std && (
                                    <Tooltip
                                      placement="top"
                                      arrowPointAtCenter
                                      className="icon-caution"
                                      title={intl.get('cognitiveSearch.graphQA.stdIsEmptyEntityTip')}
                                    >
                                      <ExclamationCircleOutlined style={{ color: '#F5222D' }} />
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="file-right">
                  {!currentEntityType ? (
                    <div className="no-complete-search kw-center">
                      <img src={configEmpty} alt="empty" />
                      <div className="full-tip">
                        {_.map(TIP_CONTENT, (item: any, index: any) => {
                          return (
                            <div key={index} className="tip-content kw-c-subtext">
                              {item}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="blank-title kw-mb-2">{intl.get('cognitiveSearch.graphQA.attribute')}</div>
                      <div className="graphqa-config-container">
                        <div className="graphqa-config-name">
                          <h3>
                            <strong>*</strong>
                            {intl.get('cognitiveSearch.graphQA.selectstd')}
                            <Tooltip
                              placement="top"
                              arrowPointAtCenter
                              className="kw-ml-2"
                              title={intl.get('cognitiveSearch.graphQA.selectstdTip')}
                            >
                              <QuestionCircleOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />
                            </Tooltip>
                          </h3>
                          {entityAll[_.findIndex(entityAll, { type: currentEntityType })] && (
                            <Select
                              placeholder={intl.get('cognitiveSearch.graphQA.UniqueLabelledAttr')}
                              defaultValue={entityAll[_.findIndex(entityAll, { type: currentEntityType })].std}
                              style={{ width: '100%' }}
                              key={entityAll[_.findIndex(entityAll, { type: currentEntityType })].std}
                              options={entityAll[_.findIndex(entityAll, { type: currentEntityType })].properties}
                              onSelect={(val: string) => handleChangeProperty(val)}
                            />
                          )}
                        </div>
                        <div className="graphqa-config-synonym">
                          <Form form={form}>
                            <h3>
                              {intl.get('cognitiveSearch.graphQA.selectSynonym')}
                              <Tooltip
                                placement="top"
                                arrowPointAtCenter
                                className="kw-ml-2"
                                title={intl.get('cognitiveSearch.graphQA.selectSynonymTip')}
                              >
                                <QuestionCircleOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />
                              </Tooltip>
                            </h3>
                            <ul>
                              {synonymsList[currentEntityType] &&
                                synonymsList[currentEntityType].map(
                                  (
                                    { property = null, sep = null, isCustom = false, customSep = '' },
                                    index: number
                                  ) => {
                                    const currentEntity =
                                      entityAll[_.findIndex(entityAll, { type: currentEntityType })];
                                    let entityProperties = currentEntity.properties;
                                    // 剔除标准属性
                                    entityProperties = entityProperties.filter((item: any) => {
                                      return item.name !== currentEntity.std;
                                    });
                                    // 剔除之前出现过的属性
                                    synonymsList[currentEntityType].forEach((synonymsItem: any) => {
                                      if (synonymsItem.property) {
                                        entityProperties = entityProperties.filter(
                                          (item: any) => item.name !== synonymsItem.property
                                        );
                                      }
                                    });

                                    return (
                                      <li key={index}>
                                        <Select
                                          placeholder={intl.get('cognitiveSearch.graphQA.selectAttribute')}
                                          style={{ width: 198, marginRight: 12 }}
                                          value={property}
                                          onChange={(val: string) => changeSynonymsProperty(index, val)}
                                          options={entityProperties}
                                        />
                                        <Select
                                          placeholder={intl.get('cognitiveSearch.graphQA.selectDelimiters')}
                                          style={{ width: isCustom ? 93 : 198, marginRight: 9 }}
                                          value={sep}
                                          onChange={(val: string) => changeSeparator(index, val)}
                                          options={defaultSep}
                                        />
                                        {isCustom && (
                                          <Form.Item
                                            name="name"
                                            rules={[
                                              { max: 2, message: intl.get('global.lenErr', { len: 2 }) },
                                              { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
                                            ]}
                                            style={{ display: 'inline-block', margin: '0px' }}
                                          >
                                            <Input
                                              placeholder={intl.get('cognitiveSearch.graphQA.delimiter')}
                                              style={{ width: 93, marginRight: 13 }}
                                              value={customSep}
                                              onChange={(e: any) => changeCusomSep(e, index)}
                                            />
                                          </Form.Item>
                                        )}
                                        <IconFont
                                          type="icon-lajitong"
                                          className="icon"
                                          style={{ fontSize: 14, cursor: 'pointer' }}
                                          onClick={() => deleteSynonymItem(index)}
                                        ></IconFont>
                                      </li>
                                    );
                                  }
                                )}
                            </ul>
                          </Form>
                        </div>

                        <div className="add-synonym">
                          <PlusOutlined />
                          <span onClick={() => addNewSynonym()}>{intl.get('cognitiveSearch.graphQA.addSynonym')}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
});

export default FullTextContentSecond;
