import React, { useMemo, useState } from 'react';
import { Dropdown } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classnames from 'classnames';

import { TOTAL_ICONS, GraphIcon, getIconName } from '@/utils/antv6';
import {
  TOTAL_ICONS as TOTAL_ICONS_MORE,
  GraphIcon as GraphIconMore,
  getIconName as getIconNameMore
} from '@/utils/antv6/getIconMore';
import { fuzzyMatch } from '@/utils/handleFunction';
import SearchInput from '@/components/SearchInput';

import StyleInput from '../StyleInput';
import '../baseStyle.less';

const getTotalIcons = () => _.values(TOTAL_ICONS);
const getTotalIconsMore = () => _.values(TOTAL_ICONS_MORE);

export interface IconDropdownProps {
  className?: string;
  style?: React.CSSProperties;
  icon: string;
  modalType: 'more' | string;
  readOnly?: boolean;
  onChange: (icon: string) => void;
}

const IconDropdown = (props: IconDropdownProps) => {
  const { className, style, icon, modalType, readOnly, onChange } = props;
  const [visible, setVisible] = useState(false);
  const [DOM, setDOM] = useState<HTMLDivElement | null>(null);
  const ICON_LIST = useMemo(() => {
    return modalType === 'more' ? getTotalIconsMore() : getTotalIcons();
  }, [modalType]);
  const [showIcons, setShowIcons] = useState(() => [...ICON_LIST]);
  const [isSearchResult, setIsSearchResult] = useState(false); // 搜索结果需要隐藏 `无`

  const onUpdateIcon = (icon: string) => {
    onChange(icon);
  };

  const debounceSearch = _.debounce(value => {
    if (!value) {
      setShowIcons([...ICON_LIST]);
      setIsSearchResult(false);
      return;
    }
    const getName = modalType === 'more' ? getIconNameMore : getIconName;
    const matchData = ICON_LIST.filter(item => fuzzyMatch(value, getName(item.font_class) || ''));
    setShowIcons(matchData);
    setIsSearchResult(true);
  }, 200);

  return (
    <Dropdown
      trigger={['click']}
      open={visible}
      onOpenChange={v => !readOnly && setVisible(v)}
      overlay={
        <div className="onto-styles-dropdown" style={{ width: DOM?.clientWidth }}>
          <div className="iconContainer">
            <div style={{ padding: 20 }}>
              <SearchInput
                autoWidth
                placeholder={intl.get('exploreGraph.style.iconPlace')}
                onChange={e => {
                  e.persist();
                  debounceSearch(e.target.value);
                }}
              />
            </div>
            <div className="scroll-wrap">
              <div className="icon-list-box">
                {!showIcons.length && <div className="kw-c-subtext">{intl.get('global.noContent')}</div>}

                {/* `无` 按钮, 使用户可以置空icon */}
                {!!showIcons.length && !isSearchResult && (
                  <div
                    className={classnames('iconItem', { checked: icon === 'empty' })}
                    onClick={() => onUpdateIcon('empty')}
                  >
                    <span>{intl.get('exploreGraph.style.none')}</span>
                  </div>
                )}

                {_.map(showIcons, item => {
                  const { font_class } = item;
                  const title = modalType === 'more' ? getIconNameMore(font_class) : getIconName(font_class);
                  return (
                    <div
                      key={font_class}
                      className={classnames('iconItem', { checked: icon === font_class })}
                      onClick={() => onUpdateIcon(font_class)}
                    >
                      {modalType === 'more' ? <GraphIconMore type={font_class} /> : <GraphIcon type={font_class} />}
                      <div className="kw-mt-1 kw-ellipsis label" title={title}>
                        {title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div ref={setDOM} className={classnames(className)} style={style}>
        <StyleInput
          label={intl.get('exploreGraph.style.icon')}
          type="icon"
          data={icon}
          arrowRotate={visible ? 180 : 0}
          focused={visible}
          readOnly={readOnly}
        />
      </div>
    </Dropdown>
  );
};

export default IconDropdown;
