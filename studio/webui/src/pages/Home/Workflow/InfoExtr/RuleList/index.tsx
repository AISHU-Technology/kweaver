import React, { memo, useState, useEffect, useRef } from 'react';
import { Input, Button, Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import ScrollBar from '@/components/ScrollBar';
import { tipModalFunc } from '@/components/TipModal';
import { switchIcon, wrapperTitle, formatModel } from '@/utils/handleFunction';
import SearchSelect from './SearchSelect';
import { RuleType } from '../assistFunction';
import { isRuleRepeat } from './assistFunction';
import emptyImg from '@/assets/images/empty.svg';
import './style.less';
import _ from 'lodash';

interface RuleListProps {
  data: Record<string, any>;
  anyDataLang: string;
  onChange: (rules: any[]) => void;
}

const RuleList: React.FC<RuleListProps> = props => {
  const { data, anyDataLang, onChange } = props;
  const ruleScrollRef = useRef<any>(); // 抽取规则的滚动条ref
  const [showSelect, setShowSelect] = useState(false); // 属性字段的select是否显示
  const [inputInfo, setInputInfo] = useState<any>({}); // 属性字段input框focus时提供一些必要参数给select
  const [fieldText, setFieldText] = useState(''); // 属性字段input框的值

  const onEntityChange = (e: any, index: number) => {};

  const onPropertyChange = (e: any, index: number) => {};

  const onAddClick = () => {};

  const onDelRuleClick = async (index: any) => {};

  return (
    <div className="info-extract-rule" id="extract-rule">
      <h3 className="extract-rule-title">
        {intl.get('workflow.information.extrRules')}
        <span className="extract-rule-add-icon">
          <Tooltip title={intl.get('workflow.information.add')}>
            <IconFont type="icon-Add" className="rule-add-icon" onClick={onAddClick} />
          </Tooltip>
        </span>
      </h3>

      <div className="extract-items-box" onScroll={() => {}}>
        <ScrollBar isshowx="false" color="rgb(184,184,184)" className="extract-rules-scroll" ref={ruleScrollRef}>
          {data.extract_rules?.length ? (
            _.map(data.extract_rules, (rule: any, index: number) => {
              return (
                <div className="extract-item" key={rule.id}>
                  <div className="extract-item-form-box">
                    <div className={anyDataLang === 'en-US' ? 'rule-item-EN' : 'rule-item-CN'}>
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
                          onChange={e => onEntityChange(e, index)}
                          // onFocus={e => {
                          //   if (rule.is_model === FROM_MODEL) return e.target.blur();
                          //   if (checkTools.isNewAdd(rules)) {
                          //     setTimeout(() => {
                          //       checkTools.scrollToErr();
                          //     }, 0);
                          //   }
                          // }}
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
                          className={classNames('rule-input', { 'rule-input-error': !!rule.errMsg[1] })}
                          placeholder={intl.get('workflow.information.fieldHolder')}
                          value={rule.property.property_field}
                          disabled={rule.disabled && rule.is_model !== RuleType.FROM_MODEL}
                          readOnly={rule.is_model === RuleType.FROM_MODEL}
                          onChange={e => onPropertyChange(e, index)}
                          onFocus={e => {}}
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
          // onChange={onFieldChange}
        />
      )}
    </div>
  );
};

export default RuleList;
