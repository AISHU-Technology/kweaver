import React, { useEffect, useState } from 'react';
import { Input, Tabs, message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import HOOKS from '@/hooks';

import TemplateModal from '@/components/TemplateModal';
import UniversalModal from '@/components/UniversalModal';
import ExplainTip from '@/components/ExplainTip';
import Format from '@/components/Format';
import RuleList from './RuleList';
import { VFilter, EFilter, TypeConfigureRules, TYPEFILTER } from './type';
import { FILTER_TYPE, defaultOperator } from './enums';
import './style.less';

const ConfigureRules = (props: TypeConfigureRules) => {
  const { visible, ontoData, ruleList, editRule, filterType, onCancel, onOk } = props;
  const [tabKeys, setTabKeys] = useState<TYPEFILTER>(FILTER_TYPE.v);
  const [searchRules, setSearchRules] = useState<{ v_filters?: VFilter[]; e_filters?: EFilter[] }>({});

  /** 规则名字的校验 */
  const rules = {
    name: [
      {
        required: true,
        message: intl.get('global.noNull') // 不能为空
      },
      {
        pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
        message: intl.get('global.onlyNormalName')
      },
      { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
      {
        validator: (value: any) => {
          const names = _.filter(
            _.map(ruleList, rule => rule.name),
            item => item !== editRule?.name
          );
          if (_.includes(names, value)) throw new Error(intl.get('global.repeatName'));
        }
      }
    ]
  };

  const [field, errors, { setFields, setFieldsErr, onSubmit }]: any = HOOKS.useForm(['name'], { rules });

  useEffect(() => {
    // 初始化编辑规则
    if (editRule?.name) {
      const { searchRules, name } = _.cloneDeep(editRule);
      setFields({ name });
      setSearchRules({ v_filters: searchRules?.v_filters, e_filters: searchRules?.e_filters });
    } else {
      onAddRuleGroup();
    }
  }, [editRule]);

  useEffect(() => {
    // 只设置点或边
    if (filterType) setTabKeys(filterType);
  }, [filterType]);

  /** 新增组 */
  const onAddRuleGroup = () => {
    if (!filterType) return;
    const ontoType = filterType === FILTER_TYPE?.v ? 'entity' : 'edge';
    const id = _.uniqueId('tag');
    const data = ontoData?.[ontoType]?.[0];
    const config: any = {
      id,
      relation: defaultOperator?.AND,
      type: defaultOperator.SATISFY_ALL,
      error: false,
      dataSource: data,
      property_filters: [],
      selfProperties: data?.properties
    };
    if (ontoType === 'entity') {
      config.tag = data?.name;
      setSearchRules({ v_filters: [config], e_filters: searchRules?.e_filters });
    }
    if (ontoType === 'edge') {
      config.edge_class = data?.name;
      setSearchRules({ v_filters: searchRules?.v_filters, e_filters: [config] });
    }
  };

  const onCheckName = (isOk = false) => {
    onSubmit()
      .then((values: Record<string, any>) => {
        if (_.isEmpty(searchRules?.v_filters) && _.isEmpty(searchRules?.e_filters)) {
          return message.error(intl.get('exploreGraph.rulesCannotEmpty'));
        }
        const error = _.filter(searchRules?.e_filters, f => f?.error);
        if (!_.isEmpty(error)) return message.error(intl.get('exploreGraph.deletedRelation'));

        if (isOk) onSure();
      })
      .catch((err: any) => {});
  };

  /** 规则变化 */
  const onChangeRules = (rules: any) => {
    const rule = _.cloneDeep(searchRules);
    rule[tabKeys] = rules;

    setSearchRules(rule);
  };

  /**
   * 点击确定
   */
  const onSure = () => {
    const data = { name: field.name, searchRules, error: false };
    onOk(data);
    onCancel();
  };

  return (
    <UniversalModal
      title={editRule?.name ? intl.get('exploreGraph.editRule') : intl.get('exploreGraph.addRules')}
      visible={visible}
      width={1000}
      zIndex={1052}
      className="configureRulesModal"
      onCancel={onCancel}
      onOk={() => onCheckName(true)}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: () => onCheckName(true) }
      ]}
    >
      <div className="configureRules-content" style={{ height: !filterType ? 497 : 455 }}>
        <div className="ruleName">
          <div className="kw-mb-2">
            <span className="kw-c-error">*</span>
            <Format.Title>{intl.get('exploreGraph.ruleName')}</Format.Title>
          </div>
          <Input
            className={`ruleNameInput ${errors.name && 'err'}`}
            placeholder={intl.get('exploreGraph.rulenamePlace')}
            value={field.name}
            onChange={e => {
              setFields({ name: e.target.value });
            }}
            onPressEnter={() => onCheckName()}
          />
          {errors.name && <span className="err-msg">{errors.name || ''}</span>}
        </div>

        <div>
          {!filterType ? (
            <Tabs activeKey={tabKeys} onChange={(e: any) => setTabKeys(e)}>
              <Tabs.TabPane tab={intl.get('exploreGraph.entityClass')} key={FILTER_TYPE?.v}>
                <div className="ruleListWrapper">
                  <RuleList
                    hasTip={!!filterType}
                    filterType={tabKeys}
                    ontoData={ontoData}
                    searchRules={searchRules}
                    onChangeRules={onChangeRules}
                  />
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab={intl.get('exploreGraph.relationClass')} key={FILTER_TYPE.e}>
                <div className="ruleListWrapper">
                  <RuleList
                    hasTip={!!filterType}
                    filterType={tabKeys}
                    ontoData={ontoData}
                    searchRules={searchRules}
                    onChangeRules={onChangeRules}
                  />
                </div>
              </Tabs.TabPane>
            </Tabs>
          ) : (
            <div className="ruleListWrapper kw-mt-5">
              <RuleList
                hasTip={!!filterType}
                filterType={tabKeys}
                ontoData={ontoData}
                searchRules={searchRules}
                onChangeRules={onChangeRules}
              />
            </div>
          )}
        </div>
      </div>
    </UniversalModal>
  );
};

export default (props: TypeConfigureRules) => {
  const { visible } = props;
  if (visible) return <ConfigureRules {...props} />;
  return null;
};
