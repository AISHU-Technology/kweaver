import React from 'react';
import classNames from 'classnames';

import HELPER from '@/utils/helper';
import IconFont from '@/components/IconFont';
import { PROMPT_CONFIGS } from '@/enums';

export interface PromptIconProps {
  className?: string;
  style?: React.CSSProperties;
  type?: 'chat' | 'completion' | string;
  size?: number;
  icon?: string | number;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const PromptIcon = (props: PromptIconProps) => {
  const { className, style = {}, type, size = 32, icon = 5, onClick } = props;
  const { color, fontClass } = PROMPT_CONFIGS.getIcon(icon, type);
  const css: React.CSSProperties = {
    flexShrink: 0,
    display: 'inline-flex',
    width: size,
    height: size,
    fontSize: size / 2,
    borderRadius: 4,
    ...style,
    color,
    background: HELPER.hexToRgba(color, 0.06),
    border: `1px solid ${HELPER.hexToRgba(color, 0.15)}`
  };
  return (
    <div className={classNames(className, 'prompt-robot-icon kw-center')} style={css} onClick={onClick}>
      <IconFont type={fontClass} />
    </div>
  );
};

export default PromptIcon;
