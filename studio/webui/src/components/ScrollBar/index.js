import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';

const defaultColor = 'rgb(184,184,184)';

class ScrollBar extends PureComponent {
  static defaultProps = {
    color: defaultColor,
    isshowx: 'true'
  };

  static propTypes = {
    color: PropTypes.string,
    isshowx: PropTypes.string
  };

  componentDidMount() {
    const verticalTrack =
      this.scrollbars &&
      this.scrollbars.container &&
      this.scrollbars.container.children &&
      this.scrollbars.container.children[2];

    verticalTrack && verticalTrack.style && (verticalTrack.style.zIndex = 200);
  }

  // x轴样式
  horizontalRenderThumb = ({ style, ...props }) => {
    let thumbStyle = {
      borderRadius: 6, // 滚动条圆角
      backgroundColor: this.props.color // 滚动条背景色
    };

    if (this.props.isshowx === 'false') {
      thumbStyle = {
        display: 'none'
      };
    }

    return <div className="ad-custom-scroll-thumb-x" style={{ ...style, ...thumbStyle }} {...props} />;
  };

  // y轴样式
  verticalRenderThumb = ({ style, ...props }) => {
    let thumbStyle = {
      width: 8,
      borderRadius: 6, // 滚动条圆角
      backgroundColor: this.props.color // 滚动条背景色
    };

    // 针对于知识网络搜索结果页面，菜单滚动条的bug，进行特殊处理
    if (document.getElementById('edgeMuster') && document.getElementById('edgeMuster').childNodes.length > 11) {
      const height = (380 * 380) / (document.getElementById('edgeMuster').childNodes.length * 34);

      thumbStyle = {
        borderRadius: 6, // 滚动条圆角
        backgroundColor: this.props.color, // 滚动条背景色
        height
      };
    }

    return <div className="ad-custom-scroll-thumb-y" style={{ ...style, ...thumbStyle }} {...props} />;
  };

  // 滚动到顶部
  scrollTop(top = 0) {
    this.scrollbars && this.scrollbars.scrollTop(top);
  }

  // 包裹的子组件高度变化时(常出现在折叠面板), 滚动条滑块不会自适应变化, 需要触发重新计算滑块高度
  resetTrack() {
    this.scrollbars.handleWindowResize();
  }

  render() {
    const { useModify, ...restProps } = this.props;
    const scrollBarConfig = {
      ref: node => {
        this.scrollbars = node;
      },
      onScrollStart: this.handleScrollStart,
      renderThumbHorizontal: this.horizontalRenderThumb,
      renderThumbVertical: this.verticalRenderThumb,
      ...restProps
    };

    return <Scrollbars {...scrollBarConfig} />;
  }
}

export default ScrollBar;
