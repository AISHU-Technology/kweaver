import React from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { Collapse } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

import { GRAPH_CONFIG } from '@/enums';
import Format from '@/components/Format';

import './style.less';

const DisplayGraphConfig = (props: any) => {
  const { selectedItem } = props;
  const { onChangeData } = props;
  const graphConfig = selectedItem?.graphConfig || {};

  const onChangeGraphConfig = (data: any) => {
    onChangeData({ type: 'graphConfig', data: { ...graphConfig, ...data } });
  };

  return (
    <div className="displayGraphConfigRoot">
      <Format.Title>画布背景</Format.Title>
      <Collapse ghost expandIconPosition="right">
        <Collapse.Panel header="背景颜色" key="1">
          <div className=" kw-align-center settingColor">
            {_.map(GRAPH_CONFIG.BACKGROUND_COLOR_LIST, item => {
              const { key, color } = item;
              return (
                <div
                  key={key}
                  className={classNames('graphBackgroundColor', { selected: graphConfig.color === key })}
                  style={{ backgroundColor: color }}
                  onClick={() => onChangeGraphConfig({ color: key })}
                >
                  <div className="checkOutlined">
                    <CheckOutlined style={{ fontSize: 10, color: '#fff', paddingLeft: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Collapse.Panel>
        <Collapse.Panel header="图案" key="2">
          <div className=" kw-align-center settingImage">
            {_.map(GRAPH_CONFIG.BACKGROUND_IMAGE_LIST, item => {
              const { key, image } = item;
              return (
                <div
                  key={key}
                  className={classNames(
                    'graphBackgroundImage',
                    { empty: !image },
                    { selected: graphConfig.image === key }
                  )}
                  onClick={() => onChangeGraphConfig({ image: key })}
                >
                  {image && <img src={image} style={{ width: '100%', height: '100%' }} />}
                </div>
              );
            })}
          </div>
        </Collapse.Panel>
      </Collapse>
    </div>
  );
};

export default DisplayGraphConfig;
