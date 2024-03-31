import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Checkbox, Pagination, Tooltip } from 'antd';
import { RightOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import SearchInput from '@/components/SearchInput';
import IconFont from '@/components/IconFont';
import NoDataBox from '@/components/NoDataBox';
import { GraphIcon } from '@/utils/antv6';
import './style.less';

export type ListRef = {
  scrollTo: (index: number) => void;
};

export interface GraphNodeListProps {
  type: 'node' | 'edge' | string;
  data: any[];
  selectedValues: any[];
  errorMark?: string[];
  rowKey: string | ((item: any) => any);
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (item: any) => void;
  onCheck?: (isChecked: boolean, item: any) => void;
  onSearch?: (value: string) => void;
  onDelete?: (item: any) => void;
}

const GraphNodeList: React.ForwardRefRenderFunction<ListRef, GraphNodeListProps> = (
  {
    type, // 实体 | 关系
    data, // 列表数据
    selectedValues, // 勾选的数据id
    errorMark = [], // 重复的id标记
    rowKey, // 渲染key
    page, // 页码
    pageSize, // 分页数
    total, // 总数
    onRowClick, // 点击每一项的回调
    onCheck, // 勾选的回调
    onSearch, // 搜索的回调
    onPageChange, // 翻页的回调
    onDelete // 删除的回调
  },
  ref
) => {
  const scrollRef = useRef<HTMLDivElement>();

  /**
   * 暴露内部方法
   */
  useImperativeHandle(ref, () => ({
    /**
     * 滚动到指定项
     * @param index 指定项索引
     */
    scrollTo: (index: number) => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollTop = index * 54;
    }
  }));

  const debounceSearch = _.debounce(value => {
    onSearch?.(value);
  }, 300);

  return (
    <div className="summary-graph-node-list-root">
      <div className="search-wrap">
        <SearchInput
          autoWidth
          placeholder={intl.get(`createEntity.${type === 'node' ? 'entitySearchTip' : 'edgeSearchTip'}`)}
          onChange={e => {
            e.persist();
            debounceSearch(e.target.value);
          }}
        />
      </div>
      <div ref={scrollRef as any} className="list-scroll-wrap">
        <div className="scroll-box">
          {_.map(data, item => {
            const { alias, color, icon, sourceAlias, targetAlias } = item;
            const key = typeof rowKey === 'string' ? item[rowKey] : rowKey?.(item);
            const isChecked = _.includes(selectedValues, key);
            const isErr = _.includes(errorMark, key);

            return (
              <div
                key={key}
                className={classNames('list-item kw-align-center kw-pointer', { checked: isChecked, error: isErr })}
              >
                <div
                  className="check-wrap"
                  onClick={e => {
                    e.preventDefault();
                    onCheck?.(!isChecked, item);
                  }}
                >
                  <Checkbox checked={isChecked} />
                </div>
                <div className="info-wrap kw-space-between" onClick={() => onRowClick?.(item)}>
                  <div
                    className={classNames('node-icon', type === 'node' ? 'circle' : '')}
                    style={{ background: color }}
                  >
                    <GraphIcon type={icon} className="icon-svg" />
                  </div>
                  <div className="node-info">
                    <div className="node-name kw-ellipsis" title={alias}>
                      {alias}
                    </div>
                    {type === 'edge' && (
                      <div className="kw-align-center kw-c-subtext">
                        <div className="start-node kw-ellipsis" title={sourceAlias}>
                          {sourceAlias}
                        </div>
                        &nbsp;&gt;&nbsp;
                        <div className="end-node kw-ellipsis" title={targetAlias}>
                          {targetAlias}
                        </div>
                      </div>
                    )}
                  </div>

                  <span
                    className="delete-mask kw-ml-2"
                    onClick={e => {
                      e.stopPropagation();
                      onDelete?.(item);
                    }}
                  >
                    <IconFont type="icon-lajitong" />
                  </span>

                  {isErr && (
                    <Tooltip
                      title={intl.get('createEntity.configError')}
                      getPopupContainer={triggerNode => triggerNode.parentElement!}
                      destroyTooltipOnHide
                    >
                      <ExclamationCircleOutlined className="kw-c-error kw-ml-2" />
                    </Tooltip>
                  )}

                  <RightOutlined className="kw-ml-2 kw-mr-1" />
                </div>
              </div>
            );
          })}

          <Pagination
            className="kw-mt-3 kw-mb-3"
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={onPageChange}
            hideOnSinglePage
            showLessItems
            showTitle={false}
            showSizeChanger={false}
          />

          {!data.length && <NoDataBox.NO_RESULT />}
        </div>
      </div>
    </div>
  );
};

export default forwardRef(GraphNodeList);
