import React from 'react';
import { Select, Empty } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import kongImg from '@/assets/images/kong.svg';

const NodeSelector = (props: any) => {
  const { data, classList, className, isDisabled, onChange, ...others } = props;

  // convert Selector renderer
  const options = () => {
    return _.map(classList, (item: any) => {
      return {
        ...item,
        value: item?.name,
        label: (
          <div className="kw-align-center">
            <div className="kw-mr-2" style={{ height: 16, width: 16, borderRadius: '50%', background: item?.color }} />

            <div className="kw-ellipsis" style={{ width: 262 }} title={item?.alias}>
              {item?.alias || item?.name}
            </div>
          </div>
        )
      };
    });
  };

  // Default Display
  const getValue = () => {
    if (!data?.name) return;

    return {
      value: data?.name,
      label: (
        <div className="kw-align-center">
          <div className="kw-mr-2" style={{ height: 16, width: 16, borderRadius: '50%', background: data?.color }} />
          <div className="kw-ellipsis" style={{ width: 262 }} title={data?.alias}>
            {data?.alias}
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
      notFoundContent={<Empty image={kongImg} description={intl.get('exploreGraph.noEntity')} />}
      {...others}
    />
  );
};
export default NodeSelector;
