import React, { Component } from 'react';
import * as d3 from 'd3';
import intl from 'react-intl-universal';
import { switchIcon, generatePassword } from '@/utils/handleFunction';

import listproperty from '@/assets/images/bz.png';
import './style.less';

const SVG_LEFT = 50; // 绘图区左边距
const TEXT_LINE_HIGHT = 100; // 文字行高
const CONNECT_Y_OFFSET = 90; // 连线y轴上的偏移量
const TAG_Y_OFFSET = 40; // 由于重叠引起的位移偏移量
const canvasContainerStyles = {
  position: 'relative',
  height: 'calc(100% - 4px)',
  overflow: 'auto'
};

class TagContent extends Component {
  // 生成画布id, d3只能通过dom查询指定画布容器, 同一页面引用多个组件, id重复会导致渲染出错
  uniqueCanvasId = generatePassword();

  state = {
    texts: [], // 文章
    bottomLines: [], // 标注下划线
    bottomLinesDes: [] // 标注下划线描述
  };

  componentDidMount() {
    this.initData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.texts !== this.props.texts) {
      this.initData();
    }
  }

  /**
   * @description 初始化数据
   */
  initData = () => {
    const { texts, bottomLines } = this.props;

    d3.select(`#${this.uniqueCanvasId} .svgGraph`).remove();
    this.initGraph(texts, bottomLines, bottomLines);
  };

  /**
   * @description 获取文字宽度
   * @param {string} word 文字
   */
  getWordWidth = word => {
    const parent = document.body;
    const node = document.createElement('span');

    node.setAttribute('id', 'compareWord');
    node.setAttribute('class', 'compare');
    node.innerHTML = word;

    parent.appendChild(node);

    // 框选文字的宽度
    const beforeWord = node.offsetWidth;

    document.getElementById('compareWord').remove();

    return beforeWord;
  };

  /**
   * @description 获取文章宽度
   */
  getMaxWidth = texts => {
    let maxWidth = 0;

    for (let i = 0; i < texts.length; i++) {
      const temp = this.getWordWidth(texts[i].word);

      if (temp > maxWidth) {
        maxWidth = temp;
      }
    }

    return maxWidth;
  };

  /**
   * @description 绘图
   */
  initGraph = (texts, bottomLines, bottomLinesDes) => {
    // tip提示
    const d3Tooltip = d3
      .select(`#${this.uniqueCanvasId}`)
      .append('div')
      .attr('class', 'd3-tooltip-create-qsx-anlysis')
      .style('display', 'none');

    this.svg = d3
      .select(`#${this.uniqueCanvasId}`)
      .append('svg')
      .attr('class', 'svgGraph')
      .attr('width', this.getMaxWidth(texts) + 150)
      .attr(
        'height',
        texts[texts.length - 1]
          ? texts[texts.length - 1] && texts.length * TEXT_LINE_HIGHT + 150 + texts[texts.length - 1].yOffset
          : 800
      );

    const g = this.svg.append('g');

    // 需要标注的文字
    g.append('g')
      .selectAll('.text')
      .data(texts)
      .enter()
      .append('text')
      .text(text => {
        return text.word;
      })
      .attr('x', SVG_LEFT)
      .attr('y', text => {
        return 80 + text.line * TEXT_LINE_HIGHT + text.yOffset;
      })
      .attr('text-line', text => {
        return text.line;
      })
      .attr('class', 'tag-word');

    // 标注下划线
    this.tagLineG = g
      .append('g')
      .selectAll('.bottomLine')
      .data(bottomLines)
      .enter()
      .append('rect')
      .attr('class', 'bottomLine')
      .attr('width', d => {
        return d.tagWidth;
      })
      .attr('height', 10)
      .style('fill', d => {
        return d.color;
      })
      .attr('stroke', d => {
        return d.color;
      })
      .attr('stroke-width', d => {
        return 2;
      })
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('x', line => {
        return line.beforeWord + SVG_LEFT;
      })
      .attr('y', line => {
        return (
          line.lineIndex * TEXT_LINE_HIGHT +
          CONNECT_Y_OFFSET +
          texts[line.lineIndex].yOffset +
          line.selectedIndex * TAG_Y_OFFSET
        );
      });

    // 下划线描述
    this.tagLineDesG = g
      .append('g')
      .selectAll('.text')
      .data(bottomLinesDes)
      .enter()
      .append('text')
      .text(text => {
        const desWidth = this.getWordWidth(text.desWord);

        if (desWidth <= text.tagWidth) {
          return text.desWord;
        }

        return `${text.desWord.substring(0, Math.floor(text.tagWidth / 14) - 1)}...`;
      })
      .attr('x', text => {
        return text.beforeWord + SVG_LEFT;
      })
      .attr('y', text => {
        return (
          text.lineIndex * TEXT_LINE_HIGHT + 120 + texts[text.lineIndex].yOffset + text.selectedIndex * TAG_Y_OFFSET
        );
      })
      .attr('text-line', text => {
        return text.line;
      })
      .style('font-size', '14px')
      .style('fill', '#000')
      .style('cursor', 'pointer')
      .on('mouseover', d => {
        d3Tooltip
          .html(
            d.alias
              ? `<div>
          <div class="name">${[intl.get('createEntity.ecn')]}</div>
          <div class="des">${d.entity}【${d.alias}】</div>
          <div class="nick-name">${[intl.get('createEntity.property')]}</div>
          <div class="des">${d.property}</div>
        </div>`
              : `<div>
        <div class="name">${[intl.get('createEntity.ecn')]}</div>
        <div class="des">${d.entity}</div>
        <div class="nick-name">${[intl.get('createEntity.property')]}</div>
        <div class="des">${d.property}</div>
      </div>`
          )
          .style('display', 'block')
          .style('left', `${d3.event.x + 5}px`)
          .style('top', `${d3.event.y + 20}px`);
      })
      .on('mouseout', d => {
        d3Tooltip.style('display', 'none');
      });
  };

  render() {
    const { title, reportData } = this.props;

    return (
      <div className="tag-content">
        <div className="title">
          <span className="t-icon">{switchIcon('file', title)}</span>
          <span className="word">{title}</span>
        </div>

        <div className="tag-info">
          {reportData && reportData.ErrorCode && reportData.ErrorCode === 'EngineServer.ErrESContentErr' ? (
            <div className="error">
              <div className="icon-box">
                <img src={listproperty} alt="AnyDATA" />
              </div>
              <div className="word">{intl.get('searchGraph.err')}</div>
            </div>
          ) : (
            <div id={`${this.uniqueCanvasId}`} style={{ ...canvasContainerStyles }}></div>
          )}
        </div>
      </div>
    );
  }
}

TagContent.defaultProps = {
  texts: [],
  bottomLines: []
};

export default TagContent;
