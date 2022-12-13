import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Input, Tooltip, message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import ScrollBar from '@/components/ScrollBar';
import { tipModalFunc } from '@/components/TipModal';
import SearchSelect from './SearchSelect';
import { RuleKey, RuleType, ExtractType, createRule } from '../assistFunction';
import { verifyFunc, hasErr, deleteRule, verifyLast } from './assistFunction';
import emptyImg from '@/assets/images/empty.svg';
import './style.less';

interface RuleListProps {
  data: Record<string, any>;
  anyDataLang: string;
  onChange: (rules: any[], action: 'change' | 'add') => void;
}

const RuleList: React.ForwardRefRenderFunction<unknown, RuleListProps> = (props, ref) => {
  const { data, anyDataLang, onChange } = props;
  const containerRef = useRef<HTMLDivElement>();
  const ruleScrollRef = useRef<any>(); // 抽取规则的滚动条ref
  const [showSelect, setShowSelect] = useState(false); // 属性字段的select是否显示
  const [inputInfo, setInputInfo] = useState<any>({}); // 属性字段input框focus时提供一些必要参数给select
  const [fieldText, setFieldText] = useState(''); // 属性字段input框的值

  useImperativeHandle(ref, () => ({
    scrollToErr
  }));

  useEffect(() => {
    ruleScrollRef.current?.scrollbars?.scrollToTop();
  }, [data.selfId]);

  /**
   * 修改规则
   * @param value
   * @param index 修改的索引
   * @param type 实体 | 属性
   */
  const onRuleChange = (value: string, index: number, type: string) => {
    const rules = [...data.extract_rules];
    type === RuleKey.NAME && (rules[index].entity_type = value);
    type === RuleKey.PROPERTY && (rules[index].property.property_field = value);
    const [errMsg, hasErr] = verifyFunc(rules, index, value, type);
    rules[index].errMsg = errMsg;
    rules.forEach((r, i) => (r.disabled = hasErr ? i !== index : false));
    onChange(rules, 'change');
    type === RuleKey.PROPERTY && setFieldText(value);
  };

  const onAddClick = () => {
    const rules = [...data.extract_rules];
    const { isErr, index } = hasErr(rules);

    if (isErr) {
      onChange(rules, 'change');
      scrollToErr(index);
      return;
    }

    let name = data.name;

    if (data.extract_type !== ExtractType.MODEL) {
      const nameList = data.name.split('.');
      nameList.length > 1 && (name = nameList.slice(0, -1).join(''));
    }

    rules.push(createRule({ ruleType: RuleType.NOT_MODEL, name, property: '' }));
    onChange(rules, 'add');
    setTimeout(() => {
      ruleScrollRef.current?.scrollbars?.scrollToBottom();
    }, 0);
  };

  const onDelRuleClick = async (index: number) => {
    const rules = [...data.extract_rules];

    if (rules[index].is_model === RuleType.FROM_MODEL) return;

    const isOk = await tipModalFunc({
      title: intl.get('workflow.information.isDelRuleTitle'),
      content: intl.get('workflow.information.isDelRuleText')
    });

    if (!isOk) return;

    const newRules = deleteRule(rules, index);
    onChange(newRules, 'change');
    message.success(intl.get('workflow.information.ruleDelSuccess'));
  };

  const onEntityFocus = (e: any) => {
    const rules = [...data.extract_rules];
    const isErr = verifyLast(rules);
    if (!isErr) return;
    onChange(rules, 'change');
    scrollToErr(rules.length - 1);
  };

  const onPropertyFocus = (e: any, index: number) => {
    const rules = [...data.extract_rules];
    const isErr = verifyLast(rules);
    if (isErr) {
      onChange(rules, 'change');
      scrollToErr(rules.length - 1);
      return;
    }

    setFieldText(e.target.value);
    setInputInfo({ id: `field${rules[index].id}`, index });
    setShowSelect(true);
  };

  const onPropertyBlur = () => {
    setShowSelect(false);
    setFieldText('');
  };

  /**
   * @description 属性字段select改变时回调函数
   * @param value 选中的值
   */
  const onFieldChange = (value: string) => {
    const { index } = inputInfo;
    onRuleChange(value, index, RuleKey.PROPERTY);
    onPropertyBlur();
  };

  const scrollToErr = (index = 0) => {
    if (!containerRef.current || !ruleScrollRef.current) return;
    const ruleNode = containerRef.current.querySelector('.extract-item');
    if (!ruleNode) return;
    ruleScrollRef.current.scrollbars.scrollTop((ruleNode.clientHeight + 20) * index);
  };

  return (
    <div
      className={classNames('info-extract-rule', { 'EN-style': anyDataLang === 'en-US' })}
      id="extract-rule"
      ref={containerRef as any}
    >
      <h3 className="extract-rule-title">
        {intl.get('workflow.information.extrRules')}
        <span className="extract-rule-add-icon">
          <Tooltip title={intl.get('workflow.information.add')}>
            <IconFont type="icon-Add" className="rule-add-icon" onClick={onAddClick} />
          </Tooltip>
        </span>
      </h3>

      <div className="extract-items-box" onScroll={() => inputInfo.id && onPropertyBlur()}>
        <ScrollBar isshowx="false" color="rgb(184,184,184)" className="extract-rules-scroll" ref={ruleScrollRef}>
          {data.extract_rules?.length ? (
            _.map(data.extract_rules, (rule: any, index: number) => {
              return (
                <div className="extract-item" key={rule.id}>
                  <div className="extract-item-form-box">
                    <div className="rule-item">
                      <div className="rule-name-box">
                        <label className="rule-label">{intl.get('workflow.information.property')}</label>
                      </div>

                      <div className="rule-input-box">
                        <Input
                          className={classNames('rule-input', { 'rule-input-error': !!rule.errMsg[0] })}
                          autoComplete="off"
                          placeholder={intl.get('workflow.information.nameHolder')}
                          value={rule.entity_type}
                          disabled={rule.disabled && rule.is_model !== RuleType.FROM_MODEL}
                          readOnly={rule.is_model === RuleType.FROM_MODEL}
                          onChange={e => onRuleChange(e.target.value, index, RuleKey.NAME)}
                          onFocus={onEntityFocus}
                        />
                        <span className="entity-err-info">{rule.errMsg[0]}</span>
                      </div>
                    </div>

                    <div className="rule-line" />

                    <div className="rule-item">
                      <div className="rule-name-box">
                        <label className="rule-label">{intl.get('workflow.information.propertyField')}</label>
                      </div>

                      <div className="rule-input-box">
                        <Input
                          id={`field${rule.id}`}
                          autoComplete="off"
                          className={classNames('rule-input', { 'rule-input-error': !!rule.errMsg[1] })}
                          placeholder={intl.get('workflow.information.fieldHolder')}
                          value={rule.property.property_field}
                          disabled={rule.disabled && rule.is_model !== RuleType.FROM_MODEL}
                          readOnly={rule.is_model === RuleType.FROM_MODEL}
                          onChange={e => onRuleChange(e.target.value, index, RuleKey.PROPERTY)}
                          onFocus={e => onPropertyFocus(e, index)}
                          onBlur={onPropertyBlur}
                        />
                        <span className="field-err-info">{rule.errMsg[1]}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`${rule.is_model === RuleType.FROM_MODEL ? 'model-item-delete' : 'extract-item-delete'}`}
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      onDelRuleClick(index);
                    }}
                  >
                    <IconFont type="icon-lajitong" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-rule">
              <img src={emptyImg} alt="nodata" />
              <p className="no-rule-word">{intl.get('workflow.information.noRule')}</p>
            </div>
          )}
        </ScrollBar>
      </div>

      {/* 属性字段 */}
      {showSelect && (
        <SearchSelect
          visible={showSelect}
          selectData={data.selectRules || []}
          searchText={fieldText}
          pid={'extract-rule'}
          inputId={inputInfo.id}
          onChange={onFieldChange}
        />
      )}
    </div>
  );
};

export default forwardRef(RuleList);
