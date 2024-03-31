import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classnames from 'classnames';

import { TOTAL_ICONS, GraphIcon, getIconName } from '@/utils/antv6';
import {
  TOTAL_ICONS as TOTAL_ICONS_MORE,
  GraphIcon as GraphIconMore,
  getIconName as getIconNameMore
} from '@/utils/antv6/getIconMore';

import ColorSelectInput from '../ColorSelect/ColorSelectInput';

import './style.less';

const getTotalIcons = () => _.values(TOTAL_ICONS);
const getTotalIconsMore = () => _.values(TOTAL_ICONS_MORE);
const Icon = (props: any) => {
  const { icon, iconColor, modalType } = props;
  const { onChange } = props;

  const onUpdateIcon = (key: string) => {
    onChange({ type: 'icon', icon: key });
  };

  const onChangeColor = ({ type, data }: any) => {
    const { r, g, b, a } = data?.rgb || data?.data?.rgb;
    onChange({ type, [type]: `rgba(${r},${g},${b},${a})` });
  };

  const items = modalType === 'more' ? getTotalIconsMore() : getTotalIcons();

  return (
    <div className="iconRoot">
      <div style={{ height: 300, minHeight: 300, overflow: 'auto' }}>
        <div className="iconContainer">
          <div className={classnames('iconItem', { checked: icon === 'empty' })} onClick={() => onUpdateIcon('empty')}>
            <span>{intl.get('exploreGraph.style.none')}</span>
          </div>
          {_.map(items || [], item => {
            const { font_class } = item;
            return (
              <div
                key={font_class}
                className={classnames('iconItem', { checked: icon === font_class })}
                onClick={() => onUpdateIcon(font_class)}
              >
                {modalType === 'more' ? <GraphIconMore type={font_class} /> : <GraphIcon type={font_class} />}
                <div className="kw-mt-1 kw-ellipsis label">
                  {modalType === 'more' ? getIconNameMore(font_class) : getIconName(font_class)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="selectColorFooter">
        <ColorSelectInput
          panelClassName="selectColorPanel"
          type="iconColor"
          direction="horizontal"
          label={intl.get('exploreGraph.style.fillColor')}
          color={iconColor}
          onChangeColor={onChangeColor}
        />
      </div>
    </div>
  );
};

export default Icon;
