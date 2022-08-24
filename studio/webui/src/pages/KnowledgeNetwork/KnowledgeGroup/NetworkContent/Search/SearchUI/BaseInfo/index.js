/**
 * 基本信息
 * @author Jason.ji
 * @date 2022/01/11
 *
 */

import React, { memo } from 'react';
import ScrollBar from '@/components/ScrollBar';
import './style.less';

const BaseInfo = props => {
  const { color, name, properties = [] } = props.data;

  return (
    <div className="search-res-base-info">
      <ScrollBar isshowx="false" className="base-scroll">
        <div className="scroll-wrapper">
          <p className="title">
            <span className="circle-span" style={{ backgroundColor: color }}></span>
            <span className="cl-name ellipsis-one" title={name}>
              {name}
            </span>
          </p>
          {properties.map((item, index) => {
            const { n, v } = item;

            return (
              <div key={`${index}`} className="row">
                <p className="pro ellipsis-one" title={n}>
                  {n}
                </p>
                <p className="value ellipsis-one" title={v}>
                  {v}
                </p>
              </div>
            );
          })}
        </div>
      </ScrollBar>
    </div>
  );
};

BaseInfo.defaultProps = {
  data: {}
};

export default memo(BaseInfo);
