import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Input, Checkbox, message } from 'antd';
import classNames from 'classnames';
import HOOKS from '@/hooks';
import NoDataBox from '@/components/NoDataBox';
import servicesSearchConfig from '@/services/searchConfig';
import fullTip from '@/assets/images/fullTip.svg';
import entityIcon from '@/assets/images/entityIcon.svg';
import IconFont from '@/components/IconFont';
import { fuzzyMatch } from '@/utils/handleFunction';
import ConfigGraph from './ConfigGraph';
import DragLine from '@/components/DragLine';
import { convertData } from '../assistFunction';
import { tipContent } from '../../enum';

import './style.less';

// const initHeight = 335;
const otherHeight = 104; // 内容以外的高度
const minHeight = 53;
const maxHeight = 552;
const smallHeight = 95;

const ClassifyContainGraph: React.ForwardRefRenderFunction<any, any> = (
  {
    authData,
    isVisible,
    graphUnderClassify,
    setGraphUnderClassify,
    onShowGraphMessage,
    fullContent,
    setFullContent,
    testData,
    setTestData,
    checked,
    setChecked,
    setIsOpenQA
  },
  ref
) => {
  const { height: winHeight } = HOOKS.useWindowSize(); // 屏幕宽度
  const [nodeAll, setNodeAll] = useState<any>([]); // 所有实体类id
  const [allEntities, setAllEntities] = useState<any>([]); // 全部实体类
  const [checkEntity, setCheckEntity] = useState<any>([]); // 框选select的实体类集合
  const [entityName, setEntityName] = useState<any>([]); // 颜色-实体类名称-实体类显示名称
  const [matchEntityName, setMatchEntityName] = useState<any>([]); // 颜色-实体类名称-实体类显示名称
  const [graphData, setGraphData] = useState<any>([]); // 图谱信息
  const [searchQuery, setSearchQuery] = useState(''); // 搜索
  const [removeEntity, setRemoveEntity] = useState<any>([]); // 取消选择的实体类
  const [isChecked, setIsChecked] = useState(true); // 全部选择框
  const [selectedGraphId, setSelectedGraphId] = useState(0); // 选择的图谱id
  const [scalingHeight, setScalingHeight] = useState((winHeight - otherHeight) / 3);
  const [isOpenOrClose, setIsOpenOrClose] = useState(false); // 开-true 或 关-false的判断
  const [selectedNode, setSelectedNode] = useState<any>([]); // Shift框选和左键点击选中的实体类
  const [operateType, setOperateType] = useState(''); // shift-Shift框选 contextmenu-左键点击
  useImperativeHandle(ref, () => ({ onSave }));

  // 窗口变化, 重新渲染编辑器高度
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setSelectedGraphId(0);
    setGraphData([]);
    if (!_.isEmpty(graphUnderClassify?.kgs?.[0])) {
      onSelectGraph(graphUnderClassify?.kgs?.[0]?.kg_id);
    }
  }, [graphUnderClassify]);

  useEffect(() => {
    setSearchQuery('');
    setMatchEntityName([]);
    setCheckEntity([]);
    setAllEntities([]);
    setRemoveEntity([]);
    setNodeAll([]);
  }, [selectedGraphId]);

  useEffect(() => {
    if (selectedNode?.cancel) {
      onAllCheck({ target: { checked: false } });
      return;
    }
    // 框选中的节点id集合
    const checkedSelected = _.map(selectedNode, (item: any) => item?._cfg?.id);
    onNodeClick(checkedSelected);
  }, [selectedNode, operateType]);

  const handleResize = (e: any) => {
    const height = window.innerHeight;
  };

  /**
   * 选择-获取图谱信息
   */
  const onSelectGraph = async (data: number) => {
    setSelectedGraphId(data);
    try {
      const { res, Description, ErrorCode } = (await servicesSearchConfig.fetchCanvasData(data)) || {};
      if (res) {
        const graphData = convertData(res, data);
        setGraphData(graphData);

        // 颜色-实体类名称-实体类显示名称
        const entityArr = _.map(graphData?.nodes, (item: any) => {
          return {
            name: `${item.alias} (${item.id})`,
            color: item.color,
            id: item.name,
            kg_id: res.id
          };
        });
        setEntityName(entityArr);
        setMatchEntityName(entityArr);

        // 图谱实体类信息(全部)
        const entityAll = _.map(graphData?.nodes, (item: any) => {
          return `${item?.alias} (${item?.id})`;
        });
        // 所有实体类id
        const entitiesId = _.map(graphData?.nodes, (item: any) => {
          return item?.id;
        });

        const cloneFull = _.cloneDeep(fullContent);
        const cloneClassify = _.cloneDeep(graphUnderClassify);
        const checkedClassify = _.filter(cloneFull, (i: any) => cloneClassify?.class_name === i.class_name);
        const checkedEntity = _.filter(checkedClassify?.[0]?.kgs, (item: any) => item.kg_id === data);
        setCheckEntity(checkedEntity?.[0]?.entities);
        setNodeAll(entitiesId);
        setAllEntities(entityAll);
        // 全选框是否选中
        setIsChecked(checkedEntity?.[0]?.entities?.length === entityAll?.length);
      }

      // 图谱被删除(如果分类中只有一个资源且被删除，则该分类也被删除)
      if (ErrorCode === 'Builder.service.ontology.getOtlIdbyKGId.kgidNotExists') {
        setSelectedGraphId(0);
        setSearchQuery('');
        setMatchEntityName([]);
        const allData = _.cloneDeep(testData);
        const deleteGraph = _.filter(allData.props.data_source_scope, (item: any) => item?.kg_id !== data);
        const deleteClassifyGraph = _.map(allData?.props?.full_text?.search_config, (item: any) => {
          item.kgs = _.filter(item?.kgs, (i: any) => i?.kg_id !== data);
          return item;
        });
        let name = '';
        _.map(graphUnderClassify?.kgs, (item: any) => {
          if (item?.kg_id === data) {
            name = item?.kg_name;
          }
        });
        message.error(intl.get('cognitiveSearch.deleteTip', { name }));
        const filterData = _.filter(
          deleteClassifyGraph,
          (item: any) => !_.isEmpty(item?.kgs) || item?.class_name === '全部资源'
        );
        const classifyGraphList = _.cloneDeep(graphUnderClassify);
        // 选择的分类下的出去被删除后的图谱
        const updateGraphUnderClassify = _.filter(classifyGraphList?.kgs, (item: any) => item?.kg_id !== data);
        classifyGraphList.kgs = updateGraphUnderClassify;
        setGraphUnderClassify(_.isEmpty(updateGraphUnderClassify) ? [] : classifyGraphList);
        if (_.isEmpty(updateGraphUnderClassify)) {
          onShowGraphMessage([], 'all');
        }
        allData.props.data_source_scope = deleteGraph;

        allData.props.full_text.search_config = filterData;
        setTestData(allData);
        // 资源为空,配置项中全文检索和图谱qa开关关闭
        if (_.isEmpty(deleteGraph)) {
          setChecked({ ...checked, ...{ checked: false, qAChecked: false } });
          setIsOpenQA(false);
        }
        return;
      }
      Description && message.error(Description);
    } catch (err) {
      //
    }
  };

  /**
   * 画布上节点操作
   */
  const onNodeClick = (ids: any) => {
    // if (graphUnderClassify?.class_name === '全部资源') return;
    // 左键点击
    if (operateType === 'contextmenu') {
      const handleEntities = _.map(checkEntity, (item: any) => item?.split('(')?.[1]?.split(')')?.[0]);
      // 取消勾选
      if (handleEntities.includes(ids[0])) {
        const handleEntity = _.filter(checkEntity, (item: any) => item?.split('(')?.[1]?.split(')')?.[0] === ids[0]);
        onCheckChange({ target: { checked: false } }, handleEntity);
        return;
      }
      // 勾选
      const handleEntity = _.filter(allEntities, (item: any) => item?.split('(')?.[1]?.split(')')?.[0] === ids[0]);
      onCheckChange({ target: { checked: true } }, handleEntity);
      return;
    }

    // Shift框选
    const handleEntity: any = [];
    _.map(ids, (item: any) => {
      _.map(allEntities, (i: any) => {
        if (i?.split('(')?.[1]?.split(')')?.[0] === item) {
          handleEntity.push(i);
        }
      });
    });
    onCheckChange({ target: { checked: true } }, handleEntity);
  };

  /**
   * 搜索
   */
  const onSearch = _.debounce(e => {
    const { value } = e?.target;
    const name = value;
    const matchData = _.filter(entityName, (item: any) => fuzzyMatch(name, item?.name));
    setMatchEntityName(matchData);
  }, 300);

  /**
   * 复选框变化
   */
  const onCheckChange = (isCheck: any, id: any) => {
    const checked = isCheck?.target?.checked;
    const newRemove = checked ? _.filter(removeEntity, i => !id.includes(i)) : [...removeEntity, ...id];
    setRemoveEntity(newRemove);

    const idsArr = checked ? [...new Set([...checkEntity, ...id])] : _.filter(checkEntity, item => !id.includes(item));
    setCheckEntity(idsArr);
    _.isEmpty(idsArr) && setIsChecked(false);
    // 判断全部是否选中
    if (allEntities.length !== idsArr.length) {
      setIsChecked(false);
    } else {
      setIsChecked(true);
    }

    const newFullContent = _.cloneDeep(fullContent);
    const selectedGraph = _.map(newFullContent, (item: any) => {
      if (item?.class_id === graphUnderClassify?.class_id) {
        _.map(item.kgs, (i: any) => {
          if (i.kg_id === selectedGraphId) {
            i.entities = idsArr;
            i.allEntities = allEntities;
          }
          return i;
        });
        return item;
      }
      return item;
    });

    setFullContent(selectedGraph);
  };

  /**
   * 全选框
   */
  const onAllCheck = (e: any) => {
    const checked = e?.target?.checked;
    // 全选
    if (checked) {
      setIsChecked(true);
      setCheckEntity(allEntities);
      setRemoveEntity([]);
      onHandleFullContent('checked');
    } else {
      // 取消全选
      setIsChecked(false);
      setCheckEntity([]);
      setRemoveEntity(allEntities);
      onHandleFullContent('empty');
    }
  };

  /**
   * 选中与否 节点处理
   */
  const onHandleFullContent = (isCheck: string) => {
    const checkChange = _.map(fullContent, (item: any) => {
      if (item?.class_name === graphUnderClassify.class_name) {
        _.map(item?.kgs, (n: any) => {
          if (n.kg_id === selectedGraphId) {
            n.entities = isCheck === 'checked' ? allEntities : [];
            n.allEntities = allEntities;
          }
          return n;
        });
        return item;
      }
      return item;
    });
    setFullContent(checkChange);
  };

  /** 拖动高度变更 */
  const onChangeHeight = (offset: number) => {
    const x = scalingHeight + offset;
    const curHeight = x > maxHeight ? maxHeight : x < minHeight ? minHeight : x;
    setScalingHeight(curHeight);
  };

  /** 拖动高度结束 */
  const onChangeEndHeight = (offset: number) => {
    const x = scalingHeight + offset;
    const curWidth = x > maxHeight ? maxHeight : x < minHeight ? minHeight : x;
    if (curWidth < smallHeight) setScalingHeight(minHeight);
  };

  /**
   * 拖拽按钮操作
   */
  const onDragOperate = () => {
    if (!isOpenOrClose) {
      setScalingHeight(minHeight);
      setIsOpenOrClose(!isOpenOrClose);
      return;
    }
    setScalingHeight((winHeight - otherHeight) / 3);
    setIsOpenOrClose(!isOpenOrClose);
  };

  /**
   * 保存
   */
  const onSave = () => {
    return fullContent;
  };

  const switchStyle = {
    top: scalingHeight + 44
  };

  return (
    <>
      {isVisible ? (
        <div className="classify-contain-graph-root kw-flex kw-w-100">
          <div className="classify-contain-left kw-h-100 kw-w-100">
            {/* 左侧上半部分图谱列表 */}
            <div style={{ height: selectedGraphId ? scalingHeight + 24 : '100%' }} className="left-top">
              <div className="kw-flex concrete-left-box">
                <IconFont
                  type="icon-shangfanye"
                  className="kw-pointer kw-mr-3"
                  onClick={() => onShowGraphMessage([], 'all')}
                />
                <div
                  className="concrete-text kw-ellipsis"
                  title={
                    graphUnderClassify?.class_name === '全部资源'
                      ? intl.get('cognitiveSearch.classify.allResource')
                      : graphUnderClassify?.class_name
                  }
                >
                  {graphUnderClassify?.class_name === '全部资源'
                    ? intl.get('cognitiveSearch.classify.allResource')
                    : graphUnderClassify?.class_name}
                </div>
              </div>
              <div className="graph-left-box kw-pointer">
                {_.map(graphUnderClassify?.kgs, (item: any) => {
                  return (
                    <div
                      key={graphUnderClassify?.class_id + item?.kg_id}
                      className={classNames('kw-flex graph-name', {
                        'click-background': item?.kg_id === selectedGraphId
                      })}
                      onClick={() => onSelectGraph(item.kg_id)}
                    >
                      <IconFont
                        type="icon-color-zhishitupu11"
                        className="kw-mr-2 graph-icon"
                        style={{ fontSize: 16 }}
                      />
                      {/* 无权限的图谱灰质 */}
                      <div
                        className={classNames('kw-ellipsis graph-show-name', {
                          'kw-c-watermark': !_.includes(authData?.data, String(item?.kg_id))
                        })}
                        title={item?.kg_name}
                      >
                        {item?.kg_name}
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedGraphId ? (
                <DragLine
                  className="dragLine"
                  style={{ top: scalingHeight + 40, height: '5px' }}
                  onChange={(x, y) => onChangeHeight(y)}
                  onEnd={(x, y) => onChangeEndHeight(y)}
                  showIcon
                  onDragOperate={onDragOperate}
                  switchStyle={switchStyle}
                  switchName="switchName"
                />
              ) : null}
            </div>

            {/* 左侧下半部分实体类名称 */}
            {selectedGraphId ? (
              <div className="graph-name-left-box" style={{ height: 800 - scalingHeight - 24 }}>
                <div>
                  <div className="entity-title">
                    <div className="entity-left kw-flex">
                      <img src={entityIcon} className="entity-img" />
                      <span className="entity-content">{intl.get('createEntity.ec')}</span>
                    </div>
                    {/* {graphUnderClassify?.class_name === '全部资源' ? null : ( */}
                    <div className="count-right">
                      <span className="kw-c-primary">{checkEntity?.length}</span>/{allEntities?.length}
                    </div>
                    {/* )} */}
                  </div>

                  <Input
                    allowClear={true}
                    value={searchQuery}
                    placeholder={intl.get('cognitiveSearch.searchEntity')}
                    prefix={
                      <IconFont type="icon-sousuo" className="search-icon kw-pointer" style={{ opacity: '0.25' }} />
                    }
                    onChange={e => {
                      e.persist();
                      setSearchQuery(e?.target?.value);
                      onSearch(e);
                    }}
                    className="input-search kw-mt-2 kw-pb-1 kw-mb-2 kw-ml-6"
                  />
                </div>

                {/* 实体类名相关操作及展示 */}
                {searchQuery && _.isEmpty(matchEntityName) ? (
                  <NoDataBox.NO_RESULT />
                ) : (
                  <div className="alias-message" style={{ height: `calc(100% - ${scalingHeight + 118})` }}>
                    {searchQuery && _.isEmpty(matchEntityName) ? null : (
                      <div className="middle-checkbox kw-pb-4 kw-flex" key={intl.get('cognitiveSearch.all')}>
                        <Checkbox onChange={onAllCheck} checked={isChecked} />
                        <div className="kw-flex" style={{ alignItems: 'center', marginLeft: '10px' }}>
                          {intl.get('cognitiveSearch.all')}
                        </div>
                      </div>
                    )}
                    {_.map(matchEntityName, (item: any, index: any) => {
                      return (
                        <div className="checkbox-box kw-flex" key={index}>
                          <Checkbox
                            onChange={isCheck => onCheckChange(isCheck, [item.name])}
                            checked={checkEntity?.includes(item?.name)}
                          />

                          <div className="kw-flex checkbox-row">
                            <div className="middle-circle kw-mr-2" style={{ background: item?.color }}></div>
                            <div className="entity-name kw-ellipsis" title={item?.name}>
                              {item?.name}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* 右侧提示和画布展示 */}
          <div className="classify-contain-right kw-center">
            {_.isEmpty(graphData) ? (
              <>
                <img src={fullTip} className="kw-mr-8" />
                <div className="kw-flex full-tip">
                  {_.map(tipContent, (item: any, index: any) => {
                    return (
                      <div key={index} className="tip-content kw-c-subtext">
                        {item}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <ConfigGraph
                graphData={graphData}
                nodeAll={nodeAll}
                checkEntity={checkEntity}
                setSelectedNode={setSelectedNode}
                setOperateType={setOperateType}
                graphUnderClassify={graphUnderClassify}
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default forwardRef(ClassifyContainGraph);
