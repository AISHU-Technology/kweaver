import React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars, ScrollbarProps } from 'react-custom-scrollbars';

const defaultColor = 'rgb(184,184,184)';

type ExtendedScrollBarProps = ScrollbarProps & {
  color?: string;
  isShowX?: Boolean;
};

const KwScrollBar: React.FC<ExtendedScrollBarProps> = ({
  color = defaultColor,
  isShowX = 'true',
  onScrollStart,
  ...restProps
}) => {
  const horizontalRenderThumb = ({ style }: { style: React.CSSProperties }) => {
    const thumbStyle: React.CSSProperties = {
      borderRadius: 6,
      backgroundColor: color
    };

    return isShowX !== 'false' ? (
      <div className="kw-custom-scroll-thumb-x" style={{ ...style, ...thumbStyle }} />
    ) : (
      <div className="kw-custom-scroll-thumb-x" style={{ ...style, display: 'none' }} />
    );
  };

  const verticalRenderThumb = ({ style }: { style: React.CSSProperties }) => {
    const thumbStyle: React.CSSProperties = {
      width: 8,
      borderRadius: 6,
      backgroundColor: color
    };

    return <div className="kw-custom-scroll-thumb-y" style={{ ...style, ...thumbStyle }} />;
  };

  return (
    <Scrollbars
      onScrollStart={onScrollStart}
      renderThumbHorizontal={horizontalRenderThumb}
      renderThumbVertical={verticalRenderThumb}
      {...restProps}
    />
  );
};

KwScrollBar.propTypes = {
  color: PropTypes.string,
  isShowX: PropTypes.bool
};

export default KwScrollBar;
