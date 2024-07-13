import React, { useMemo } from 'react';
import { Popover } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
// import Format from '@/components/Format';
import './style.less';
import classNames from 'classnames';

const LIST = [
  { key: 'attrName', label: intl.get('ontoLib.canvasOnto.entityAttrFullName') },
  { key: 'attrDisplayName', label: intl.get('ontoLib.canvasOnto.entityAttrDisplayName') },
  { key: 'attrType', label: intl.get('ontoLib.canvasOnto.entityAttrTypeSimple') },
  { key: 'attrIndex', label: intl.get('ontoLib.canvasOnto.entityAttrIndex') },
  { key: 'attrMerge', label: intl.get('ontoLib.canvasOnto.entityAttrMerge') },
  { key: 'attrSynonyms', label: intl.get('ontoLib.canvasOnto.attributesSynonyms') },
  { key: 'attrDescribe', label: intl.get('ontoLib.canvasOnto.attributesDescribe') }
];

const PropertyViewer = (props: any) => {
  const { type = 'node', node, data, children, onVisibleChange } = props;
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

  return (
    <Popover
      overlayClassName={classNames('onto-pro-viewer', { forceHide: _.isEmpty(data) })}
      placement="bottomRight"
      trigger={['click']}
      destroyTooltipOnHide
      onOpenChange={onVisibleChange}
      content={
        <div>
          {/* <div className="node-title">
            <span className="t-icon kw-mr-2" style={{ background: node?.color }}></span>
            <Format.Title style={{ verticalAlign: 'middle' }}>{node?.name}</Format.Title>
          </div> */}
          <div className="pro-view-list">
            {_.map(CURRENT_LIST, ({ key, label }) => {
              const value = getValue(key, data?.[key]);
              return (
                <div key={key} className="p-rows kw-flex">
                  <div className="p-label kw-pr-3 kw-c-subtext">{label}</div>
                  <div className="p-value kw-ellipsis" title={_.isString(value) ? value : ''}>
                    {value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      }
    >
      {children}
    </Popover>
  );
};

export default PropertyViewer;
