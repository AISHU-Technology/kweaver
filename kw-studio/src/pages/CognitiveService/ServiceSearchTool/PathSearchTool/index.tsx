import React, { useEffect, useState, useMemo } from 'react';
import { CloseOutlined, LeftOutlined, MoreOutlined } from '@ant-design/icons';
import { Input, Radio, Button, Select } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import ExplainTip from '@/components/ExplainTip';
import NumberInput from '@/components/NumberInput';
import EntitySelector from '../EntitySelector';
import WeightParam from './WeightParam';
import { PARAM_TYPE } from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/ConfigPanel/ConfigureRules/enums';
import { ANALYSIS_SERVICES } from '@/enums';
import ResultPanel, { RESULT_TYPE } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel';
import { LeftDrawer } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components';
import AddTypeSelector, {
  ADD_TYPES_SIMPLE
} from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/AddTypeSelector';
import { getHasNumberAtrClass } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/PathQuery/assistant';

import './style.less';
const { SEARCH_TYPE } = ANALYSIS_SERVICES;
const initParam = {
  direction: 'positive',
  path_type: 0,
  source: {},
  target: {},
  path_decision: 'path_depth',
  steps: 5,
  edges: '',
  property: '',
  default_value: undefined
};
const PathSearchTool = (props: any) => {
  const {
    className,
    isQuickSearch,
    zIndex = 9,
    visible,
    myStyle,
    data,
    hideExpandIcon,
    canvasInstance,
    serviceType,
    ontoData,
    outerResults,
    onChangeOpenLeftKey
  } = props;
  const language = (intl as any).options?.currentLocale;

  const { onSearch, onVisibleChange, onCloseResult } = props;
  const [searchParams, setSearchParams] = useState<any>(initParam);
  const [customVariable, setCustomVariable] = useState<any>([]);
  const [scrollDOM, setScrollDOM] = useState<HTMLDivElement | null>(null);
  const [checkedFilters, setfilters] = useState<any>([]); // 保存搜索的规则
  const [initQuery, setInitQuery] = useState<boolean>(false); // 更新tags。重置搜索
  const [isError, setIsError] = useState<any>({ exploreing: false, defaultValue: false });
  const [addType, setAddType] = useState(ADD_TYPES_SIMPLE.ADD); // 添加方式
  const [scroll, setScrroll] = useState<boolean>(false);

  // 带有数字属性的边类
  const hasNumberAttrClass = useMemo(() => {
    const edgeName = _.map(ontoData?.edge, e => e?.name);
    return getHasNumberAtrClass(ontoData, edgeName);
  }, [ontoData]);

  useEffect(() => {
    initData();
    onChangeSearchParams({ source: {}, target: {} });
    setInitQuery(true);
  }, [data]);

  // 初始化规则及参数数据
  const initData = () => {
    const newFilters = _.cloneDeep(data?.filters) || [];
    const customVariable: any[] = [];
    if (newFilters?.length > 0) {
      // 获取配置的参数
      _.forEach(newFilters, filter => {
        const { e_filters, name } = filter;
        _.forEach(e_filters, e => {
          const { property_filters } = e;
          _.forEach(property_filters, pro => {
            const proId = _.uniqueId('property'); // 添加id
            const { type: paramType, custom_param } = pro || {};
            if (paramType === PARAM_TYPE?._CUSTOMVAR) {
              customVariable.push({ name, proId, custom_param });
            }
            pro.proId = proId;
          });
        });
      });
    }
    setfilters(newFilters);
    setCustomVariable(customVariable);
  };

  // 设置参数
  const onChangeVariable = (e: any, data: any) => {
    const value = e?.target?.value;
    const custom = _.map(customVariable, item => {
      if (item?.proId === data?.proId) {
        return { ...item, op_value: value };
      }
      return item;
    });
    setCustomVariable(custom);
  };

  const handleSelectChange = (data: any) => {
    setInitQuery(false);
    onChangeSearchParams({ ...data });
  };

  // 修改搜索参数
  const onChangeSearchParams = (data: any) => {
    if (data.path_decision === 'weight_property') {
      data.edges = hasNumberAttrClass?.[0]?.name;
      data.property = hasNumberAttrClass?.[0]?.properties?.[0]?.name;
      setScrroll(true);
    }
    if (data.edges) {
      data.property = _.find(hasNumberAttrClass, item => item.name === data.edges)?.properties?.[0]?.name;
    }
    if (data.path_decision === 'path_depth') {
      data.path_decision = 'path_depth';
      data.property = '';
      data.edges = '';
      data.default_value = '';
      setIsError({ ...isError, defaultValue: false });
      setScrroll(false);
    }
    setSearchParams((pre: any) => {
      return { ...pre, ...data };
    });
  };

  const isBtnDisabled = () => {
    return _.isEmpty(searchParams?.source) || _.isEmpty(searchParams?.target);
  };

  // 点击搜索
  const onQuery = () => {
    const idVar = _.keyBy(customVariable, 'proId');
    let filters: any = [];
    const { default_value, path_decision } = searchParams;
    if (!default_value && default_value !== 0 && path_decision === 'weight_property') {
      setIsError({ ...isError, defaultValue: !searchParams.default_value });
      return;
    }

    if (!_.isEmpty(checkedFilters)) {
      filters = _.map(checkedFilters, item => {
        const e_filters = _.map(item?.e_filters, filter => {
          let property_filters = _.map(filter?.property_filters, f => {
            const { proId, type: paramType } = f;
            if (paramType === PARAM_TYPE?._CUSTOMVAR) {
              const value = idVar?.[proId]?.op_value;
              const pro = _.omit(f, 'proId');
              return !_.isEmpty(value) ? { ...pro, op_value: value, type: PARAM_TYPE?._CONSTANT } : '';
            }
            return _.omit(f, 'proId');
          });
          property_filters = _.filter(property_filters, item => !!item);
          return { ...filter, property_filters };
        });
        return { e_filters };
      });
    }
    const source = searchParams?.source?.id;
    const target = searchParams?.target?.id;
    onSearch({ ...searchParams, default_value: String(default_value), filters, source, target }, addType);
  };

  return (
    <div className={classNames(className, 'path-search-tool-root', !visible && 'close')} style={{ ...myStyle, zIndex }}>
      {visible && isQuickSearch && (
        <div
          className="quickSearch"
          style={{ right: language === 'en-US' ? -138 : -116 }}
          onClick={() => onChangeOpenLeftKey?.('search')}
        >
          <IconFont className="kw-mr-2" type="icon-kuaisusousuo" />
          {intl.get('cognitiveService.neighbors.quickSearch')}
        </div>
      )}
      {!hideExpandIcon && (
        <div className="close-bar" onClick={() => onVisibleChange?.(!visible)}>
          <LeftOutlined rotate={visible ? 0 : 180} />
        </div>
      )}
      <div className="content-wrap kw-h-100">
        <div className="t-header kw-space-between">
          <Format.Title>{intl.get('function.query')}</Format.Title>
          <div className="close-mask kw-pointer" onClick={() => onVisibleChange?.(false)}>
            <CloseOutlined />
          </div>
        </div>
        <div className="kw-h-100" style={{ overflowY: 'auto', maxHeight: 'calc(100% - 136px)' }}>
          <div className="kw-center kw-pl-6 kw-pr-6 kw-pt-6">
            <div className="kw-pt-3">
              <div className="circle-icon kw-mb-2" />
              <MoreOutlined style={{ fontSize: 10 }} />
              <div className="circle-icon kw-mt-2 red-bg" />
            </div>
            <div className="kw-w-95 kw-ml-3">
              <EntitySelector
                className="kw-mt-4"
                tags={data?.start_tags}
                excludeNode={searchParams.target}
                initQuery={initQuery}
                canvasInstance={canvasInstance}
                placeholder={intl.get('cognitiveService.paths.selectPlace')}
                multiple={false}
                value={searchParams?.source}
                footer={false}
                onChange={data => handleSelectChange({ source: data?.nodes?.[0] })}
              />

              <EntitySelector
                className="kw-mt-4"
                tags={data?.end_tags}
                excludeNode={searchParams.source}
                initQuery={initQuery}
                canvasInstance={canvasInstance}
                placeholder={intl.get('cognitiveService.paths.selectPlace')}
                multiple={false}
                value={searchParams?.target}
                footer={false}
                onChange={data => handleSelectChange({ target: data?.nodes?.[0] })}
              />
            </div>
          </div>

          {/* 路径类型 全部路径需要 */}
          {serviceType === SEARCH_TYPE.ALL_PATH && (
            <div className="kw-mt-5 kw-pl-6 kw-pr-6">
              <Format.Text>{intl.get('exploreGraph.pathType')}</Format.Text>
              <Select
                className="kw-mt-2 kw-w-100"
                value={searchParams?.path_type}
                onChange={e => onChangeSearchParams({ path_type: Number(e) })}
              >
                {_.map(
                  [
                    { value: 0, label: 'exploreGraph.allTwo' },
                    { value: 1, label: 'exploreGraph.noLoop' }
                  ],
                  op => {
                    return (
                      <Select.Option key={op?.value} value={op?.value}>
                        {intl.get(op?.label)}
                      </Select.Option>
                    );
                  }
                )}
              </Select>
            </div>
          )}
          {/* 路径长度计算维度 最短路径才需要 */}
          {serviceType === SEARCH_TYPE.SHOREST_PATH && (
            <div className="kw-mt-5 kw-pl-6 kw-pr-6">
              <Format.Text className="kw-mb-2">{intl.get('exploreGraph.calculatePath')}</Format.Text>
              <Select
                className="kw-mt-2 kw-w-100"
                value={searchParams?.path_decision}
                onChange={e => onChangeSearchParams({ path_decision: e })}
              >
                {_.map(
                  [
                    { label: 'exploreGraph.pathDeps', value: 'path_depth' },
                    { label: 'exploreGraph.weightAttr', value: 'weight_property' }
                  ],
                  op => {
                    // 关系类型都不含有数值类型的属性，则权重属性置灰展示
                    const disabled = op.value === 'weight_property' && _.isEmpty(hasNumberAttrClass);
                    return (
                      <Select.Option key={op?.value} value={op?.value} disabled={disabled}>
                        {intl.get(op?.label)}
                      </Select.Option>
                    );
                  }
                )}
              </Select>
            </div>
          )}

          {/* 边类型 */}
          {searchParams.path_decision === 'weight_property' && (
            <WeightParam
              className="kw-mt-5 kw-pl-6 kw-pr-6"
              classData={ontoData}
              searchParams={searchParams}
              isError={isError}
              hasNumberAttrClass={hasNumberAttrClass}
              onChange={onChangeSearchParams}
              setIsError={setIsError}
            />
          )}

          <div className="kw-mt-5 kw-pl-6 kw-pr-6">
            <Format.Text>{intl.get('exploreGraph.direction')}</Format.Text>
            <Radio.Group
              className="kw-w-100 kw-flex"
              onChange={e => onChangeSearchParams({ direction: e?.target?.value })}
              value={searchParams?.direction}
            >
              <Radio.Button className="dire-btn" value="positive">
                {intl.get('exploreGraph.positive')}
              </Radio.Button>
              <Radio.Button className="dire-btn" value="reverse">
                {intl.get('exploreGraph.reverse')}
              </Radio.Button>
              <Radio.Button className="dire-btn" value="bidirect">
                {intl.get('exploreGraph.bidirectional')}
              </Radio.Button>
            </Radio.Group>
          </div>

          <div className="kw-pt-5 kw-pl-6 kw-pr-6">
            <AddTypeSelector mode="simple" value={addType} onChange={setAddType} />
          </div>

          {/* 路径深度 */}
          <div className="kw-mt-5 kw-pl-6 kw-pr-6">
            <div>{intl.get('exploreGraph.pathDepth')}</div>
            <NumberInput
              className="kw-mt-2 kw-w-100"
              min={1}
              defaultValue={searchParams?.steps}
              onChange={e => onChangeSearchParams({ steps: e })}
            />
          </div>
          {/* 参数列表 */}
          <div
            ref={setScrollDOM}
            className="filter-param-list kw-pt-5"
            style={{ maxHeight: !scroll ? 'calc(100% - 466px)' : '100%' }}
          >
            {_.map(customVariable, (item, index: number) => {
              const { name, alias, example, description = '' } = item?.custom_param || {};
              const isLast = index === customVariable?.length - 1;
              return (
                <div className={classNames('', { 'kw-pb-5': !isLast })} key={index}>
                  <Format.Text className="kw-ellipsis" style={{ maxWidth: '90%' }}>
                    {alias}
                  </Format.Text>
                  <ExplainTip
                    className="explainTipIcon"
                    title={
                      <>
                        <div>{name}：</div>
                        <div>{description || intl.get('cognitiveService.analysis.noDescription')}</div>
                      </>
                    }
                  />
                  <Input
                    style={{ width: 390 }}
                    value={customVariable?.[index]?.op_value}
                    placeholder={example && `${intl.get('cognitiveService.restAPI.example')}${example || ''}`}
                    onChange={e => onChangeVariable(e, item)}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div
          className={classNames('query-btn', {
            fixed:
              (scrollDOM?.scrollHeight || 0) > (scrollDOM?.clientHeight || 0) ||
              searchParams.path_decision === 'weight_property'
          })}
        >
          <Button style={{ width: '100%' }} disabled={isBtnDisabled()} onClick={onQuery}>
            {intl.get('function.query')}
          </Button>
        </div>
      </div>
      {outerResults?.visible && (
        <LeftDrawer className="custom-search-tool-res" scaling>
          <ResultPanel
            {...(outerResults || {})}
            className="kw-pl-6 kw-pr-6"
            title={intl.get('exploreGraph.pathQuery')}
            selectedItem={canvasInstance}
            from={RESULT_TYPE.pathByServices}
            onBack={() => {
              onVisibleChange?.(true);
              onCloseResult?.();
            }}
            onClose={() => {
              onCloseResult?.();
            }}
          />
        </LeftDrawer>
      )}
    </div>
  );
};
export default PathSearchTool;
