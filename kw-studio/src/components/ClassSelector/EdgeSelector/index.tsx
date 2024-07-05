import _ from 'lodash';
import React from 'react';
import classNames from 'classnames';
import { Select, Empty } from 'antd';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import kongImg from '@/assets/images/kong.svg';

const EdgeSelector = (props: any) => {
  const { data, classList, className, isDisabled, entities, onChange, ...others } = props;

  const getEntityAlias = (name: any) => {
    if (!name) return;

    const result = _.find(entities, item => item?.name === name)?.alias;
    return result || '--';
  };

  const options = () => {
    return _.map(classList, (item: any) => {
      const startalias = getEntityAlias(item?.relation?.[0]);
      const endalias = getEntityAlias(item?.relation?.[2]);
      return {
        ...item,
        value: item?.edge_id,
        startalias,
        endalias,
        label: (
          <div style={{ height: 52 }}>
            <div className="kw-align-center">
              <div className="kw-mr-2" style={{ height: 4, width: 16, background: item?.color }} />
              <div className="kw-ellipsis" style={{ width: 262 }} title={item?.alias}>
                {item?.alias || item?.name}
              </div>
            </div>
            <div className="kw-align-center kw-c-subtext kw-pl-6" style={{ fontSize: 12 }}>
              <div className="kw-ellipsis" style={{ maxWidth: 100 }} title={startalias}>
                {startalias}
              </div>
              <IconFont className="arrow" type="icon-fanye" />
              <div className="kw-ellipsis" style={{ maxWidth: 100 }} title={endalias}>
                {endalias}
              </div>
            </div>
          </div>
        )
      };
    });
  };

  const getValue = () => {
    if (!data?.name) return;
    const labels = data?.alias;

    return {
      value: data?.edge_id,
      label: (
        <div className="kw-align-center">
          <div className="kw-mr-2" style={{ height: 4, width: 16, background: data?.color }} />
          <div className="kw-ellipsis" style={{ width: 262 }} title={labels}>
            {labels}
          </div>
        </div>
      )
    };
  };

  return (
    <Select
      className={classNames('kw-w-100', className)}
      placeholder={intl.get('exploreGraph.selectName')}
      showArrow
      labelInValue
      disabled={isDisabled}
      optionLabelProp="children"
      listHeight={32 * 5}
      maxTagCount={1}
      options={options()}
      value={getValue()}
      placement="bottomLeft"
      onChange={(_, option: any) => {
        onChange({ ...option, label: '' });
      }}
      dropdownRender={menu => <>{menu}</>}
      notFoundContent={<Empty image={kongImg} description={intl.get('exploreGraph.noRelation')} />}
      {...others}
    />
  );
};
export default EdgeSelector;
