/**
 * 标注展示
 *
 * @author Eden
 * @date 2021/1/26
 *
 */

import React, { Component } from 'react';
import * as d3 from 'd3';
import intl from 'react-intl-universal';
import { switchIcon, generatePassword } from '@/utils/handleFunction';

import listproperty from '@/assets/images/bz.png';
import './style.less';

const SVGLEFT = 50; // Drawing area left margin
const TEXTLINEHIGHT = 100; // text line height
const CONNECTYOFFSET = 90; // Offset on the y-axis of the connection
const TAGYOFFSET = 40; // Displacement offset due to overlap
const canvasContainerStyles = {
  position: 'relative',
  height: 'calc(100% - 4px)',
  overflow: 'auto'
};

class TagContent extends Component {
  // Generate canvas id，d3 can only specify the canvas container through dom query
  // Reference multiple components on the same page，Duplicate IDs will cause rendering errors
  uniqueCanvasId = generatePassword();

  state = {
    texts: [], // article
    bottomLines: [], // mark underline
    bottomLinesDes: [] // Mark underline description
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

    // The width of the selected text
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
    // tips
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
          ? texts[texts.length - 1] && texts.length * TEXTLINEHIGHT + 150 + texts[texts.length - 1].yOffset
          : 800
      );

    const g = this.svg.append('g');

    // Text that needs to be marked
    g.append('g')
      .selectAll('.text')
      .data(texts)
      .enter()
      .append('text')
      .text(text => {
        return text.word;
      })
      .attr('x', SVGLEFT)
      .attr('y', text => {
        return 80 + text.line * TEXTLINEHIGHT + text.yOffset;
      })
      .attr('text-line', text => {
        return text.line;
      })
      .attr('class', 'tag-word');

    // mark underline
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
        return line.beforeWord + SVGLEFT;
      })
      .attr('y', line => {
        return (
          line.lineIndex * TEXTLINEHIGHT +
          CONNECTYOFFSET +
          texts[line.lineIndex].yOffset +
          line.selectedIndex * TAGYOFFSET
        );
      });

    // Underline description
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
        return text.beforeWord + SVGLEFT;
      })
      .attr('y', text => {
        return text.lineIndex * TEXTLINEHIGHT + 120 + texts[text.lineIndex].yOffset + text.selectedIndex * TAGYOFFSET;
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
                <img src={listproperty} alt="KWeaver" />
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
