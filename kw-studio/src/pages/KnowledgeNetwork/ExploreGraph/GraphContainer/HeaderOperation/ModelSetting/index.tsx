import React from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Radio, Space } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

import { GRAPH_CONFIG } from '@/enums';
import Format from '@/components/Format';

import './style.less';

const SettingBlock = (props: any) => {
  const { title, style = {}, className } = props;

  return (
    <div className={classnames(className, 'kw-mb-4')} style={style}>
      {title && (
        <Format.Text className="kw-mb-2" style={{ display: 'block' }}>
          {title}
        </Format.Text>
      )}
      <div className="kw-align-center">{props.children}</div>
    </div>
  );
};

const ModelSetting = (props: any) => {
  const { graphConfig, onChangeData } = props;

  const onChangeGraphConfig = (data: any) => {
    onChangeData({ type: 'graphConfig', data: { ...graphConfig, ...data } });
  };

  return (
    <div
      className="modelSettingRoot"
      onClick={(event: any) => {
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation(); // 可控 Popover, 禁止冒泡
        return false;
      }}
    >
      <div className="kw-pb-3 kw-mb-5 kw-border-b">
        <Format.Title>{intl.get('exploreGraph.setting')}</Format.Title>
      </div>
      <div>
        <Format.Title className="kw-mb-2" style={{ display: 'block' }}>
          {intl.get('exploreGraph.legend')}
        </Format.Title>
        <SettingBlock>
          <Radio.Group
            size="small"
            value={graphConfig?.hasLegend}
            onChange={(e: any) => {
              const value = e.target.value;
              onChangeGraphConfig({ hasLegend: value });
            }}
          >
            <Space direction="vertical">
              <Radio value={true}>{intl.get('exploreGraph.legendOpen')}</Radio>
              <Radio value={false}>{intl.get('exploreGraph.legendClose')}</Radio>
            </Space>
          </Radio.Group>
        </SettingBlock>
      </div>
      <div className="kw-mt-8">
        <Format.Title className="kw-mb-2" style={{ display: 'block' }}>
          {intl.get('exploreGraph.background')}
        </Format.Title>
        <SettingBlock className="settingColor" title={intl.get('exploreGraph.backgroundColor')}>
          {_.map(GRAPH_CONFIG.BACKGROUND_COLOR_LIST, item => {
            const { key, color } = item;
            return (
              <div
                key={key}
                className={classnames('graphBackgroundColor', { selected: graphConfig.color === key })}
                style={{ backgroundColor: color }}
                onClick={() => onChangeGraphConfig({ color: key })}
              >
                <div className="checkOutlined">
                  <CheckOutlined style={{ fontSize: 10, color: '#fff', paddingLeft: 2 }} />
                </div>
              </div>
            );
          })}
        </SettingBlock>
        <SettingBlock className="settingImage" title={intl.get('exploreGraph.pattern')}>
          {_.map(GRAPH_CONFIG.BACKGROUND_IMAGE_LIST, item => {
            const { key, image } = item;
            return (
              <div
                key={key}
                className={classnames(
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
        </SettingBlock>
      </div>
    </div>
  );
};

export default ModelSetting;
