import React, { useMemo } from 'react';
import { Button } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import './style.less';

import IconFont from '@/components/IconFont';

const LIST = [
  { key: 'attrSynonyms', label: intl.get('ontoLib.canvasOnto.attributesSynonyms') },
  { key: 'attrDescribe', label: intl.get('ontoLib.canvasOnto.attributesDescribe') }
];

const PartPropCard = (props: any) => {
  const { type = 'node', data, onEdit, readOnly } = props;
  const CURRENT_LIST = useMemo(() => {
    if (type === 'node') return LIST;
    return _.filter(LIST, d => d.key !== 'attrMerge');
  }, [type]);

  const getValue = (key: string, value: any) => {
    if (_.isArray(value)) {
      return _.join(value, '、') || <span className="kw-c-subtext">{`[${intl.get('global.noContent')}]`}</span>;
    }
    if (['attrMerge', 'attrIndex'].includes(key)) {
      return value ? intl.get('cognitiveSearch.on') : intl.get('cognitiveSearch.off');
    }
    return value || <span className="kw-c-subtext">{`[${intl.get('global.noContent')}]`}</span>;
  };

  const getError = (key: string, value: any) => {
    if (_.isString(value)) {
      return validateKeyOfValue(key, value);
    }
    return { [key]: false };
  };

  const validateKeyOfValue = (key: string, value: string) => {
    let isError = false;
    if (key === 'attrSynonyms') {
      const thisValue = value.split('、');
      _.map(_.filter(thisValue, d => d.trim()) as string[], (attrSynonym, synonymIndex) => {
        if (attrSynonym === '') {
          isError = true;
        }
        if (attrSynonym?.length > 50) {
          isError = true;
        }
        if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(attrSynonym)) {
          isError = true;
        }
        if (_.some(thisValue, (d, i) => d === attrSynonym && i !== synonymIndex)) {
          isError = true;
        }
      });
    } else {
      if (value.length > 150) {
        isError = true;
      }
      if (value !== '' && !/^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/.test(value)) {
        isError = true;
      }
    }
    return { [key]: isError };
  };

  const propCardClicked = () => {
    onEdit();
  };

  return (
    <div className="card-view-box">
      <div className="card-view-list">
        {_.map(CURRENT_LIST, ({ key, label }) => {
          const value = getValue(key, data?.[key]);
          const mapValue = getError(key, value);
          return (
            <div key={key} className="card-instance">
              <div className="card-rows">
                <div className="card-label kw-pr-3 kw-c-subtext">
                  {label}
                  {mapValue[key] ? (
                    <IconFont type="graph-warning1" style={{ color: '#f5222d', fontSize: 16 }} />
                  ) : undefined}
                </div>
              </div>
              <div className="card-value" title={_.isString(value) ? value : ''}>
                {value}
              </div>
            </div>
          );
        })}
      </div>
      <div className={readOnly ? 'card-edit-none' : 'card-edit'}>
        <span className="card-edit-btn" onClick={propCardClicked}>
          <IconFont type="graph-editor" style={{ fontSize: 18 }} />
          {intl.get('ontoLib.editTitle')}
        </span>
      </div>
    </div>
  );
};

export default PartPropCard;
