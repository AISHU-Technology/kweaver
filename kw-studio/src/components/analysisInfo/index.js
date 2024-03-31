/**
 * 分析报告
 *
 * @author Eden
 * @date 2021/1/26
 *
 */

import React, { Component } from 'react';

import { getCorrectColor } from '@/utils/handleFunction';

import TagContent from './tagContent';
import InfoContent from './infoContent';

import './style.less';

const TAGYOFFSET = 40; // Displacement offset due to overlap

class Analysis extends Component {
  state = {
    texts: [],
    bottomLines: []
  };

  entityColorList = [];

  componentDidMount() {
    this.initData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.reportData !== this.props.reportData) {
      this.initData();
    }
  }

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
   * @description 初始化数据
   */
  initData = () => {
    const { reportData } = this.props;

    let texts = [];
    let bottomLines = [];

    if (reportData && reportData.content) {
      for (let i = 0; i < reportData.content.length; i++) {
        texts = [...texts, { word: reportData.content[i], line: i, yOffset: 0 }];
      }
    }

    if (reportData && reportData.entity) {
      for (let i = 0; i < reportData.entity.length; i++) {
        bottomLines = [
          ...bottomLines,
          {
            beforeWord: this.getWordWidth(reportData.entity[i].before_word),
            color: this.setColor(reportData.entity[i]),
            desWord: `${reportData.entity[i].v_alias}：${reportData.entity[i].v_proper}`,
            endIndex: reportData.entity[i].end_index,
            entity: reportData.entity[i].v_class,
            lineIndex: reportData.entity[i].line_index,
            property: reportData.entity[i].v_proper,
            selectedIndex: reportData.entity[i].repeat_freq,
            startIndex: reportData.entity[i].start_index,
            tagWidth: this.getWordWidth(reportData.entity[i].word_name),
            text: reportData.entity[i].word_name,
            uniqueMark: reportData.entity[i].unique_mark,
            alias: reportData.entity[i].v_alias
          }
        ];

        if (reportData.entity[i].repeat_freq > 0 && reportData.entity[i].line_index + 1 < texts.length) {
          if (reportData.entity[i].repeat_freq * TAGYOFFSET > texts[reportData.entity[i].line_index + 1].yOffset) {
            texts[reportData.entity[i].line_index + 1].yOffset = reportData.entity[i].repeat_freq * TAGYOFFSET;
          }
        }
      }
    }

    for (let i = 1; i < texts.length; i++) {
      texts[i].yOffset = texts[i - 1].yOffset + texts[i].yOffset;
    }

    this.setState({
      texts,
      bottomLines
    });
  };

  /**
   * @description 配置颜色
   */
  setColor = item => {
    const { v_class, v_color } = item;

    for (let i = 0; i < this.entityColorList.length; i++) {
      if (v_class === this.entityColorList[i].v_class) {
        return this.entityColorList[i].color;
      }
    }

    const curColor = getCorrectColor(v_color);

    this.entityColorList = [
      ...this.entityColorList,
      {
        v_class,
        color: curColor
      }
    ];

    return curColor;
  };

  render() {
    const { texts, bottomLines } = this.state;
    const { anylysisTitle } = this.props;

    return (
      <div id="signal-box" className="analysis-info">
        <div className="content-left">
          <TagContent
            texts={texts}
            bottomLines={bottomLines}
            title={anylysisTitle}
            reportData={this.props.reportData}
          />
        </div>
        <div className="content-right">
          <InfoContent bottomLines={bottomLines} />
        </div>
      </div>
    );
  }
}

export default Analysis;
