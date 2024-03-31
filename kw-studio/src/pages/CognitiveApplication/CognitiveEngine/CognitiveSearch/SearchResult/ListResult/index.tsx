import React, { memo } from 'react';
import { RightOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import './style.less';

export interface ListResultProps {
  className?: string;
  resData: any[];
  selectedRow: Record<string, any>;
  onRowClick?: Function;
}

const ListResult: React.FC<ListResultProps> = props => {
  const { className = '', resData, selectedRow, onRowClick } = props;

  return (
    <div className={`${className} kg-search-list-res`}>
      {resData.map((item: any) => {
        const { id, name, tag, color, score, properties, default_property } = item;
        const title = default_property?.v || default_property?.value || name;
        return (
          <div
            className={`res-item ${selectedRow?.id === id && 'checked'}`}
            key={id}
            onClick={() => onRowClick?.(item)}
          >
            <div className="info-box">
              <RightOutlined className="right-icon" />

              <p className="file-name ellipsis-one" title={title}>
                {title}
              </p>

              <div className="pro-tags">
                {/* 命中的实体 */}
                <span className="pro-tag ellipsis-one" title={`class：${tag}`}>
                  class：
                  <span className="circle-span" style={{ backgroundColor: color || '#126ee3' }} />
                  {tag}
                </span>

                {_.map(properties, (pro, proIndex) => {
                  return (
                    <span
                      key={`${proIndex}`}
                      className={`${
                        ['_ds_id_', '_timestamp_'].includes(pro.alias || pro.name)
                          ? 'tag-display'
                          : 'pro-tag ellipsis-one'
                      }`}
                      title={`${pro.alias || pro.name}：${pro.value}`}
                      dangerouslySetInnerHTML={{ __html: `${pro.alias || pro.name}：${pro.value}` }}
                    />
                  );
                })}
                <div className="operation-box">
                  <span className="op-item">
                    {intl.get('searchConfig.score')}：<span className="score-text">{score}</span>
                  </span>
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
