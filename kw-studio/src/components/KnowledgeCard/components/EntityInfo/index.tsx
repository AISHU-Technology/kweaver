import React, { useMemo, useState, useEffect } from 'react';
import { Space, Skeleton, Typography } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';

import { GraphIcon } from '@/utils/antv6';
import { EntityInfoProps } from '../../types';

import './style.less';

type ComponentConfig = {
  icon: string;
  title: string;
  labelColor: string;
  description: string;
  properties: any[];
};

const EntityInfo = (props: EntityInfoProps) => {
  const { mode, componentConfig, skeleton, loading } = props;
  const { nodes, config } = componentConfig;
  const [innerLoading, setInnerLoading] = useState(true);
  const skeletonLoading = skeleton === false ? false : innerLoading;

  useEffect(() => setInnerLoading(!!loading), [loading]);
  const data = nodes[0] || {};

  const source = useMemo(() => {
    const result: ComponentConfig = {
      icon: data?.icon,
      title: intl.get('knowledgeCard.title'),
      labelColor: '#fff',
      description: intl.get('global.desc'),
      properties: []
    };
    result.labelColor =
      config?.labelColor === 'inherit' ? data?.fill_color || data?.color || '#fff' : config?.labelColor;
    let properties: any[] = data.properties;
    if (properties?.[0]?.props) {
      properties = _.flattenDeep(_.map(properties, p => p.props));
    }
    _.forEach(properties, item => {
      if (item.name === config?.title && item?.value) result.title = item?.value;
      if (item.name === config?.description && item?.value) result.description = item?.value;
    });
    const propertiesKV = _.keyBy(properties, 'name');
    _.forEach(config?.properties, (pro, index) => {
      const matchPro = _.cloneDeep(propertiesKV[pro.name]);
      if (matchPro) {
        mode === 'develop' && (matchPro.value = intl.get('knowledgeCard.attrValue'));
        result.properties.push(matchPro);
      }
      if (mode === 'develop' && !matchPro) {
        result.properties.push({
          name: intl.get('knowledgeCard.attribute') + (index + 1),
          alias: intl.get('knowledgeCard.attribute') + (index + 1),
          value: intl.get('knowledgeCard.attrValue')
        });
      }
    });

    if (data?.alias && result?.description) setInnerLoading(false);
    return result;
  }, [componentConfig]);
  const { icon, title, labelColor, description, properties } = source || {};

  const [ellipsis, setEllipsis] = useState(false);
  const [paragraphKey, setParagraphKey] = useState(0);

  return (
    <div className="entityInfoRoot">
      <Skeleton loading={skeletonLoading} active paragraph={{ rows: 1 }}>
        <div className="titleAndTag">
          <div className="componentTitle kw-ellipsis" title={title}>
            {title}
          </div>
          <div className="titleTag" style={{ borderColor: labelColor }}>
            {!!icon && icon !== 'empty' && <GraphIcon className="tagIcon" type={icon} style={{ color: labelColor }} />}
            <span
              className="kw-ellipsis"
              title={data?.alias || intl.get('graphDetail.entityAlias')}
              style={{ color: labelColor }}
            >
              {data?.alias || intl.get('graphDetail.entityAlias')}
            </span>
          </div>
        </div>
      </Skeleton>

      <Skeleton loading={skeletonLoading} active paragraph={{ rows: 0 }}>
        <div className="description">
          <Typography.Paragraph
            className="kw-mb-0"
            key={paragraphKey}
            ellipsis={{
              rows: 4,
              expandable: true,
              onEllipsis: ellipsis => {
                setEllipsis(ellipsis);
              }
            }}
          >
            {description || '--'}{' '}
            {ellipsis && (
              <span className="paragraphButton" onClick={() => setParagraphKey(paragraphKey + 1)}>
                {intl.get('global.unExpand')}
              </span>
            )}
          </Typography.Paragraph>
        </div>
      </Skeleton>

      {_.isEmpty(properties) ? null : (
        <Skeleton loading={skeletonLoading} active paragraph={{ rows: 1 }}>
          <div className="properties">
            <Space style={{ width: '100%' }} direction="vertical" size={12}>
              {_.map(properties, (item, index) => {
                const { alias, value } = item;
                return (
                  <div className="propertyItem" key={index}>
                    <span className="itemTitle">{alias}：</span>
                    <span className="itemValue" title={String(value)}>
                      {value || '--'}
                    </span>
                  </div>
                );
              })}
            </Space>
          </div>
        </Skeleton>
      )}
    </div>
  );
};

export default (props: EntityInfoProps & { visible?: boolean }) => {
  const { visible = true, ...other } = props;
  if (!visible) return null;
  return <EntityInfo {...other} />;
};
