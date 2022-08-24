/**
 * 搜索结果 -- 列表
 */

import React, { memo } from 'react';
import { RightOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import './style.less';

export interface ListResultProps {
  className?: string;
  resData: any[];
  selectedRow: Record<string, any>;
  onReport?: Function;
  onTitleClick?: Function;
  onRowClick?: Function;
}

const ListResult: React.FC<ListResultProps> = props => {
  const { className = '', resData, selectedRow, onReport, onTitleClick, onRowClick } = props;

  return (
    <div className={`${className} kg-search-list-res`}>
      {resData.map((item: any) => {
        const { id, name, tag, color, score, analysis, properties } = item;

        return (
          <div
            className={`res-item ${selectedRow?.id === id && 'checked'}`}
            key={id}
            onClick={() => onRowClick?.(item)}
          >
            <div className="info-box">
              <RightOutlined className="right-icon" />

              <p
                className="file-name ellipsis-one"
                title={name}
                onClick={e => {
                  e.stopPropagation();
                  onTitleClick?.(item);
                }}
              >
                {name}
              </p>

              <div className="pro-tags">
                {/* 命中的实体 */}
                <span className="pro-tag ellipsis-one" title={`class：${tag}`}>
                  class：
                  <span className="circle-span" style={{ backgroundColor: color || '#126ee3' }} />
                  {tag}
                </span>

                {Object.entries(properties).map(([key, value], proIndex) => {
                  return (
                    <span
                      key={`${proIndex}`}
                      className="pro-tag ellipsis-one"
                      title={`${key}：${value}`}
                      dangerouslySetInnerHTML={{ __html: `${key}：${value}` }}
                    />
                  );
                })}

                <div className="operation-box">
                  <span className="op-item">
                    {intl.get('searchConfig.score')}：<span className="score-text">{score}</span>
                  </span>

                  {analysis && (
                    <span className="op-item">
                      {intl.get('searchGraph.report')}：
                      <span
                        className="detail-btn"
                        onClick={e => {
                          e.stopPropagation();
                          onReport?.(item);
                        }}
                      >
                        {intl.get('global.detail')}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default memo(ListResult);
