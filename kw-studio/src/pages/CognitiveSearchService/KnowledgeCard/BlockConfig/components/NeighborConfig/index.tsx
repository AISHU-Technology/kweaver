import React, { useState, useMemo, useEffect } from 'react';
import { Select, Radio, Tooltip, message, Checkbox } from 'antd';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import NumberInput from '@/components/NumberInput';
import ExplainTip from '@/components/ExplainTip';
import IconFont from '@/components/IconFont';
import RequireLabel from '../RequireLabel';
import ColorDropDown from '../ColorDropDown';
import SelectorEmpty from '../SelectorEmpty';
import './style.less';

import SearchRuleList from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/SearchRuleList';
import ConfigureRules from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/ConfigPanel/ConfigureRules';
import SelectConfigTags from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/ConfigPanel/SelectConfigTags';

import KNOWLEDGE_CARD from '../../../enums';
import { RelatedLabelType, RelatedDocumentType1, RelatedDocumentType2 } from '../../../types';

type ConfigFields = RelatedLabelType & RelatedDocumentType1 & RelatedDocumentType2;

export interface NeighborConfigProps {
  className?: string;
  type: string;
  node: Record<string, any>;
  ontoData?: Record<string, any>;
  data: ConfigFields;
  onChange: (newData: Partial<ConfigFields>) => void;
}

const getDocProList = (type: string) => {
  return type === KNOWLEDGE_CARD.RELATED_DOCUMENT_1
    ? [
        {
          key: 'endNodeProperty1',
          label: intl.get('knowledgeCard.endProTitle')
        }
      ]
    : [
        {
          key: 'endNodeProperty1',
          label: intl.get('knowledgeCard.endPro1')
        },
        {
          key: 'endNodeProperty2',
          label: intl.get('knowledgeCard.endPro2')
        }
      ];
};

const NodeOption = (props: { node?: Record<string, any> }) => (
  <>
    <span
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        height: 12,
        width: 12,
        borderRadius: '50%',
        background: props.node?.color
      }}
    />
    <span
      className="kw-ellipsis kw-ml-2"
      title={props.node?.alias}
      style={{ display: 'inline-block', verticalAlign: 'middle', maxWidth: 240 }}
    >
      {props.node?.alias}
    </span>
  </>
);

const NeighborConfig = (props: NeighborConfigProps) => {
  const { className, type, node, ontoData, data, onChange: _onChange } = props;
  const { search_config } = data;
  const [rulesModalVisible, setRulesModalVisible] = useState<boolean>(false); // 配置搜索规则弹窗
  const [editRule, setEditRule] = useState<any>({}); // 编辑规则
  const [rules, setRules] = useState<any>(() => {
    const dataObj: any = {};
    const nodeMap = _.keyBy(ontoData?.entity, 'name');
    const edgeMap = _.keyBy(ontoData?.edge, 'name');
    _.forEach(search_config.filters, item => {
      _.forEach(item.v_filters, v => {
        const vData = { ...v, dataSource: nodeMap[v.tag], selfProperties: nodeMap[v.tag]?.properties };
        if (dataObj[v.ruleName]?.v_filters) {
          dataObj[v.ruleName].searchRules.v_filters.push(vData);
        } else {
          dataObj[v.ruleName] = {
            name: v.ruleName,
            searchRules: {
              ...(dataObj[v.ruleName]?.searchRules || {}),
              v_filters: [vData]
            }
          };
        }
      });
      _.forEach(item.e_filters, e => {
        const eData = { ...e, dataSource: edgeMap[e.tag], selfProperties: edgeMap[e.tag]?.properties };
        if (dataObj[e.ruleName]?.e_filters) {
          dataObj[e.ruleName].searchRules.e_filters.push(eData);
        } else {
          dataObj[e.ruleName] = {
            name: e.ruleName,
            searchRules: {
              ...(dataObj[e.ruleName]?.searchRules || {}),
              e_filters: [eData]
            }
          };
        }
      });
    });
    return _.values(dataObj);
  });
  const [colorType, setColorType] = useState<'inherit' | 'custom'>(
    data.labelColor === 'inherit' ? 'inherit' : 'custom'
  );
  const endPropertyOptions = useMemo(() => {
    if (!data.entity) return [];
    const endNode = _.find(ontoData?.entity, node => node.name === data.entity);
    return _.map(endNode?.properties, pro => ({ value: pro.name, label: pro.alias }));
  }, [ontoData?.entity, data.entity]);

  useEffect(() => {
    setColorType(data.labelColor === 'inherit' ? 'inherit' : 'custom');
  }, [data.labelColor]);

  /**
   * 更新前拦截, 重置错误信息
   * @param newData
   */
  const onChange = (newData: Partial<ConfigFields>) => {
    const correctKeys: string[] = [];
    _.entries(newData).forEach(([key, value]) => {
      if (key === 'entities' && !_.some(value, v => !v)) {
        correctKeys.push(key);
        return;
      }
      value && correctKeys.push(key);
    });
    _onChange({ ...newData, error: _.omit(data.error, correctKeys) });
  };

  /**
   * 修改邻居查询配置
   * @param data
   */
  const changeSearchConfig = (data: Partial<ConfigFields['search_config']>) => {
    onChange({ search_config: { ...search_config, ...data } });
  };

  /**
   * 修改配色方案
   */
  const onColorTypeChange = (type: 'inherit' | 'custom') => {
    setColorType(type);
    if (type === 'inherit') {
      onChange({ labelColor: 'inherit' });
    } else {
      onChange({ labelColor: 'rgba(18, 110, 227, 1)' });
    }
  };

  /**
   * 修改配置规则
   */
  const onConfigRules = (rule: any) => {
    let newRules = [...rules];
    if (editRule?.name) {
      newRules = _.map(newRules, item => {
        if (item?.name === editRule?.name) return { ...item, ...rule };
        return item;
      });
      setEditRule({});
      message.success(intl.get('graphList.editSuccess'));
    } else {
      newRules.unshift(rule);
      message.success(intl.get('graphList.addSuccess'));
    }
    const filters = getFilters(newRules);
    setRules(newRules);
    changeSearchConfig({ filters });
  };

  /**
   * 编辑规则
   * @param item
   */
  const onEditRule = (item: any) => {
    setEditRule(item);
    setRulesModalVisible(true);
  };

  /**
   * 删除规则
   * @param name
   */
  const onDeleteRule = (name: string) => {
    const newRules = _.filter(rules, item => item?.name !== name);
    const filters = getFilters(newRules);
    setRules(newRules);
    changeSearchConfig({ filters });
    message.success(intl.get('global.deleteSuccess'));
  };

  const getFilters = (rules: any[]) => {
    return _.map(rules, item => {
      const e_filters = _.map(item?.searchRules?.e_filters, filter => {
        const { type, edge_class, relation } = filter;
        const property_filters = _.map(filter?.property_filters, f => {
          const { name, operation, op_value, custom_param, type, time_param } = f;
          return { name, operation, op_value, custom_param, type, time_param };
        });
        return { ruleName: item.name, relation, edge_class, type, property_filters };
      });
      const v_filters = _.map(item?.searchRules?.v_filters, filter => {
        const { type, tag, relation } = filter;
        const property_filters = _.map(filter?.property_filters, f => {
          const { name, operation, op_value, custom_param, type, time_param } = f;
          return { name, operation, op_value, custom_param, type, time_param };
        });
        return { ruleName: item.name, relation, tag, type, property_filters };
      });
      return { e_filters, v_filters };
    });
  };

  return (
    <div className={classNames(className, 'knw-card-neighbor-config')}>
      {/* 起点实体类型 */}
      <RequireLabel label={intl.get('knowledgeCard.startNode')} />
      <Select className="kw-w-100" value={'startNode'} disabled>
        <Select.Option key="startNode">
          <NodeOption node={node} />
        </Select.Option>
      </Select>

      {/* 终点实体类型 */}
      <RequireLabel className="kw-mt-5" label={intl.get('knowledgeCard.endNode')} />
      {type === KNOWLEDGE_CARD.RELATED_LABEL ? (
        <>
          <SelectConfigTags
            className={classNames({ 'error-selector': !!data.error?.entities })}
            classList={ontoData?.entity}
            value={data.entities}
            onChange={tags => onChange({ entities: tags })}
            getPopupContainer={(triggerNode: any) => triggerNode.parentElement}
            showSearch
          />
          <div className="kw-c-error" style={{ minHeight: 20, lineHeight: '20px' }}>
            {data.error?.entities}
          </div>
        </>
      ) : (
        <>
          <Select
            className={classNames('kw-w-100', { 'error-selector': !!data.error?.entity })}
            placeholder={intl.get('global.pleaseSelect')}
            showSearch
            optionFilterProp="label"
            value={data.entity || undefined}
            onChange={v => onChange({ entity: v })}
            notFoundContent={<SelectorEmpty />}
            getPopupContainer={triggerNode => triggerNode.parentElement}
          >
            {_.map(ontoData?.entity, item => (
              <Select.Option key={item.name} label={item.alias}>
                <NodeOption node={item} />
              </Select.Option>
            ))}
          </Select>
          <div className="kw-c-error" style={{ minHeight: 20, lineHeight: '20px' }}>
            {data.error?.entity}
          </div>
        </>
      )}

      {/* 终点实体展示属性 */}
      {[KNOWLEDGE_CARD.RELATED_DOCUMENT_1, KNOWLEDGE_CARD.RELATED_DOCUMENT_2].includes(type) &&
        _.map(getDocProList(type), item => {
          return (
            <React.Fragment key={item.key}>
              <RequireLabel label={item.label} />
              <Select
                className={classNames('kw-w-100', { 'error-selector': !!data.error?.[item.key] })}
                placeholder={intl.get('global.pleaseSelect')}
                showSearch
                optionFilterProp="label"
                options={endPropertyOptions}
                value={data[item.key] || undefined}
                onChange={v => onChange({ [item.key]: v })}
                notFoundContent={<SelectorEmpty />}
                getPopupContainer={triggerNode => triggerNode.parentElement}
              />
              <div className="kw-c-error" style={{ minHeight: 20, lineHeight: '20px' }}>
                {data.error?.[item.key]}
              </div>
            </React.Fragment>
          );
        })}

      {/* 图片链接 */}
      {type === KNOWLEDGE_CARD.RELATED_DOCUMENT_2 && (
        <>
          <RequireLabel label={intl.get('knowledgeCard.imgLink')} />
          <Select
            className={classNames('kw-w-100', { 'error-selector': !!data.error?.imageUrl })}
            placeholder={intl.get('global.pleaseSelect')}
            showSearch
            optionFilterProp="label"
            options={endPropertyOptions}
            value={data.imageUrl || undefined}
            onChange={v => onChange({ imageUrl: v })}
            notFoundContent={<SelectorEmpty />}
            getPopupContainer={triggerNode => triggerNode.parentElement}
          />
          <div className="kw-c-error" style={{ minHeight: 20, lineHeight: '20px' }}>
            {data.error?.imageUrl}
          </div>
        </>
      )}

      {/* 词条颜色 */}
      {type === KNOWLEDGE_CARD.RELATED_LABEL && (
        <>
          <RequireLabel label={intl.get('knowledgeCard.tagColor')} />
          <div className="kw-flex kw-mb-5">
            <Select className="kw-flex-item-full-width kw-w-100" value={colorType} onChange={onColorTypeChange}>
              <Select.Option key="inherit">{intl.get('knowledgeCard.entityColor')}</Select.Option>
              <Select.Option key="custom">{intl.get('knowledgeCard.custom')}</Select.Option>
            </Select>
            {colorType !== 'inherit' && (
              <ColorDropDown
                className=" kw-ml-2"
                color={data.labelColor === 'inherit' ? '#126ee3' : data.labelColor}
                onChange={color => onChange({ labelColor: color.rgba })}
              />
            )}
          </div>
        </>
      )}

      {/* 数量限制 */}
      <RequireLabel label={intl.get('knowledgeCard.limit')} />
      <NumberInput
        className="kw-w-100"
        value={data.limit}
        max={data.type === KNOWLEDGE_CARD.RELATED_LABEL ? 10 : 5}
        min={1}
        onChange={value => onChange({ limit: value as number })}
      />

      {/* 关系拓展深度 */}
      <RequireLabel className="kw-mt-5" label={intl.get('exploreGraph.SearchDepth')} />
      <NumberInput
        className="kw-w-100"
        value={search_config.steps}
        min={1}
        onChange={value => changeSearchConfig({ steps: value as number })}
      />

      {/* 关系类方向 */}
      <RequireLabel className="kw-mt-5" label={intl.get('exploreGraph.direction')} />
      <Radio.Group
        className="kw-w-100"
        value={search_config.direction}
        onChange={e => changeSearchConfig({ direction: e.target.value })}
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

      {/* 返回结果 */}
      <div className="kw-mt-5 kw-mb-2">{intl.get('analysisService.result')}</div>
      <Checkbox checked={search_config.final_step} onChange={e => changeSearchConfig({ final_step: e.target.checked })}>
        {intl.get('analysisService.finalStepLabel').split('|')[0]}
        <span className="kw-c-primary">{search_config.steps}</span>
        {intl.get('analysisService.finalStepLabel').split('|')[1]}
      </Checkbox>

      {/* 规则配置 */}
      <div className="kw-mt-7">
        <div className="kw-space-between">
          <div>
            {intl.get('exploreGraph.searchRules')}
            <ExplainTip className="kw-ml-2 kw-pointer" title={intl.get('exploreGraph.rulesTip')} />
          </div>
          <div>
            <Tooltip title={intl.get('exploreGraph.addRulesTip')}>
              <IconFont
                type="icon-Add"
                className={classNames('kw-pointer')}
                onClick={() => {
                  setRulesModalVisible(true);
                }}
              />
            </Tooltip>
          </div>
        </div>
        <div className="kw-mt-2">
          <SearchRuleList searchRules={rules} checkable={false} onEdit={onEditRule} onDelete={onDeleteRule} />
        </div>
      </div>

      <ConfigureRules
        visible={rulesModalVisible}
        editRule={editRule}
        ruleList={rules}
        ontoData={ontoData}
        onCancel={() => {
          setEditRule({});
          setRulesModalVisible(false);
        }}
        onOk={onConfigRules}
      />
    </div>
  );
};

export default NeighborConfig;
