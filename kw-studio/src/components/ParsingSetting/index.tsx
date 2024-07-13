/**
 * 解析规则设置
 */
import React, { useEffect } from 'react';
import { Input } from 'antd';

import intl from 'react-intl-universal';
import _ from 'lodash';

import './style.less';

/**
 * 解析规则placeholder
 */
const PARSE_INTL: Record<any, string> = {
  delimiter: intl.get('createEntity.fields'),
  quotechar: intl.get('createEntity.quote'),
  escapechar: intl.get('createEntity.escape')
};

const ParsingSetting = (props: any) => {
  const {
    parsingChange,
    onChange,
    setRequestId,
    requestId,
    requestIdRef,
    setParsingChange,
    parsingFileSet,
    selectedKey,
    defaultParsingRule,
    editData,
    onBlur
  } = props;

  useEffect(() => {
    let cloneData: any = [];
    if (editData) {
      const isParsing = editData?.files?.[0]?.delimiter;
      if (isParsing && _.isEmpty(parsingFileSet)) {
        cloneData = [
          {
            key: editData?.files?.[0]?.file_source,
            parsing: {
              delimiter: editData?.files?.[0]?.delimiter,
              quotechar: editData?.files?.[0]?.quotechar,
              escapechar: editData?.files?.[0]?.escapechar
            }
          }
        ];
      } else {
        cloneData = _.cloneDeep(parsingFileSet);
      }
    } else {
      cloneData = _.cloneDeep(parsingFileSet);
    }

    const keyAll = _.filter(cloneData, (item: any) => item?.key === selectedKey);
    if (!_.isEmpty(keyAll)) {
      setParsingChange(keyAll?.[0]?.parsing);
    } else {
      const { delimiter, quotechar, escapechar } = defaultParsingRule;
      setParsingChange({ delimiter, quotechar, escapechar });
    }
  }, [selectedKey, parsingFileSet]);

  /**
   * 解析规则变化
   */
  const onHandleInputChange = (value: string, type: string) => {
    setRequestId(requestId + 1);
    requestIdRef.current.id += 1;
    switch (type) {
      case 'delimiter':
        setParsingChange({ ...parsingChange, delimiter: value });
        onChange(type, value);
        break;
      case 'quotechar':
        setParsingChange({ ...parsingChange, quotechar: value });
        onChange(type, value);
        break;
      case 'escapechar':
        setParsingChange({ ...parsingChange, escapechar: value });
        onChange(type, value);
        break;
      default:
        break;
    }
  };

  return (
    <div className="components-parsing-setting-root kw-pb-5 kw-mb-5">
      <div className="parsing-rule-title">{intl.get('createEntity.parseRules')}</div>
      <div className="kw-flex">
        {_.map(['delimiter', 'quotechar', 'escapechar'], (item: any, index: number) => {
          return (
            <div key={index} className="kw-mr-4">
              <span className="kw-mr-2">{PARSE_INTL[item]}</span>
              <Input
                placeholder={defaultParsingRule[item]}
                onChange={e => onHandleInputChange(e?.target?.value, item)}
                autoComplete="off"
                value={parsingChange[item]}
                className="parsing-input"
                onBlur={onBlur}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ParsingSetting;
