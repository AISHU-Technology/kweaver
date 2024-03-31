import React, { useEffect, useState } from 'react';
import { CloseOutlined, LeftOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Input, Radio, Button, Checkbox } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import ExplainTip from '@/components/ExplainTip';
import NumberInput from '@/components/NumberInput';
import EntitySelector from '../EntitySelector';
import { PARAM_TYPE } from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/ConfigPanel/ConfigureRules/enums';
import ResultPanel, { RESULT_TYPE } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel';
import { LeftDrawer } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components';
import AddTypeSelector, {
  ADD_TYPES_SIMPLE
} from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/AddTypeSelector';
import './style.less';

const NeighborSearchTool = (props: any) => {
  const {
    className,
    zIndex = 9,
    isQuickSearch,
    readOnly,
    visible,
    myStyle,
    data,
    outerResults,
    hideExpandIcon,
    canvasInstance
  } = props;
  const { onSearch, onVisibleChange, onCloseResult, onChangeOpenLeftKey } = props;
  const [searchParams, setSearchParams] = useState<any>({
    direction: 'positive',
    steps: 1,
    final_step: false,
    nodes: []
  });
  const language = (intl as any).options?.currentLocale;

  const [customVariable, setCustomVariable] = useState<any>([]);
  const [scrollDOM, setScrollDOM] = useState<HTMLDivElement | null>(null);
  const [checkedFilters, setfilters] = useState<any>([]); // 保存搜索的规则
  const [initQuery, setInitQuery] = useState<boolean>(false); // 更新tags。重置搜索
  // const dataRef = useRef<any>(); // 保存data, 防止频繁触发更新
  const [addType, setAddType] = useState(ADD_TYPES_SIMPLE.ADD); // 添加方式

  useEffect(() => {
    setSearchParams({ direction: 'positive', steps: 1, final_step: false, nodes: [] });
  }, []);

  useEffect(() => {
    initData();
    onChangeSearchParams({ ..._.pick(data, 'direction', 'steps', 'final_step'), nodes: [] });
    setInitQuery(true);
  }, [data]);

  // 初始化规则及参数数据
  const initData = () => {
    const newFilters = _.cloneDeep(data?.filters) || [];
    const customVariable: any[] = [];
    if (newFilters?.length > 0) {
      // 获取配置的参数
      _.forEach(newFilters, filter => {
        const { e_filters, v_filters, name } = filter;
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
        _.forEach(v_filters, v => {
          const { property_filters, name } = v;
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
    onChangeSearchParams({ nodes: data?.nodes });
  };

  // 修改搜索参数
  const onChangeSearchParams = (data: any) => {
    setSearchParams({ ...searchParams, ...data });
  };

  const isBtnDisabled = () => {
    return _.isEmpty(searchParams?.nodes);
  };

  // 点击搜索
  const onQuery = () => {
    const { nodes, steps, direction, final_step } = searchParams;
    const vids = _.map(nodes, n => n?.id);
    const idVar = _.keyBy(customVariable, 'proId');
    let filters: any = [];

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
        const v_filters = _.map(item?.v_filters, filter => {
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
        return { e_filters, v_filters };
      });
    }
    onSearch({ vids, filters, steps, direction, final_step }, addType);
  };

  return (
    <div
      className={classNames(className, 'neighbor-search-tool-root', !visible && 'close')}
      style={{ ...myStyle, zIndex }}
    >
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

        <div ref={setScrollDOM} className="scroll-container">
          <div className="kw-pl-6 kw-pr-6 kw-pt-6">
            <div className="kw-pb-2">
              <Format.Title className="kw-mr-2">{intl.get('cognitiveService.neighbors.startPoint')}</Format.Title>
              {searchParams?.nodes?.length}
            </div>
            <EntitySelector
              readOnly={readOnly}
              tags={data?.tags}
              initQuery={initQuery}
              canvasInstance={canvasInstance}
              placeholder={intl.get('cognitiveService.neighbors.searchEntity')}
              multiple={true}
              value={searchParams?.nodes}
              footer={false}
              onChange={data => handleSelectChange(data)}
            />
          </div>
          <div className="kw-pt-5 kw-pl-6 kw-pr-6">
            <Format.Text>{intl.get('exploreGraph.SearchDepth')}</Format.Text>
            <NumberInput
              className="kw-mt-2 kw-w-100"
              readOnly={readOnly}
              min={1}
              value={searchParams?.steps}
              onBlur={e => onChangeSearchParams({ steps: e })}
              onChange={e => onChangeSearchParams({ steps: e })}
            />
            <div style={{ height: 24 }} className={searchParams?.steps >= 3 ? 'kw-mb-2' : ''}>
              {searchParams?.steps >= 3 && (
                <>
                  <ExclamationCircleOutlined className="kw-c-warning" />
                  <span className="kw-ml-2">{intl.get('exploreGraph.moreStepTip')}</span>
                </>
              )}
            </div>
          </div>
          <div className="kw-pl-6 kw-pr-6">
            <Format.Text>{intl.get('exploreGraph.direction')}</Format.Text>
            <Radio.Group
              className="kw-w-100"
              onChange={e => !readOnly && onChangeSearchParams({ direction: e?.target?.value })}
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

          {/* 参数列表 */}
          <div className="filter-param-list kw-pt-5">
            {_.map(customVariable, (item, index: number) => {
              const { name, alias, example, description = '' } = item?.custom_param || {};
              const isLast = index === customVariable?.length - 1;
              return (
                <div className={!isLast ? 'kw-pb-5' : ''} key={index}>
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
                    readOnly={readOnly}
                    value={customVariable?.[index]?.op_value}
                    placeholder={example && `${intl.get('cognitiveService.restAPI.example')}${example || ''}`}
                    onChange={e => onChangeVariable(e, item)}
                  />
                </div>
              );
            })}
          </div>

          <div className="kw-pt-5 kw-pl-6 kw-pr-6">
            <AddTypeSelector readOnly={readOnly} mode="simple" value={addType} onChange={setAddType} />
          </div>
          <div className="kw-mt-5 kw-pl-6 kw-pr-6">
            <Format.Title block strong={4} className="kw-mb-2">
              {intl.get('analysisService.result')}
            </Format.Title>
            <Checkbox
              checked={searchParams.final_step}
              onChange={e => !readOnly && onChangeSearchParams({ final_step: e.target.checked })}
            >
              {intl.get('analysisService.finalStepLabel').split('|')[0]}
              <span className="kw-c-primary">{searchParams.steps}</span>
              {intl.get('analysisService.finalStepLabel').split('|')[1]}
            </Checkbox>
          </div>
        </div>

        <div
          className={classNames('query-btn', {
            fixed: (scrollDOM?.scrollHeight || 0) > (scrollDOM?.clientHeight || 0)
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
            title={intl.get('exploreGraph.neighbor')}
            selectedItem={canvasInstance}
            from={RESULT_TYPE.neighborByServices}
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
export default NeighborSearchTool;
