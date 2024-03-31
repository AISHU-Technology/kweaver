import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import HOOKS from '@/hooks';
import HELPER from '@/utils/helper';
import Format from '@/components/Format';
import PaginationCommon from '@/components/PaginationCommon';
import { GraphIcon } from '@/utils/antv6';

import empty from '@/assets/images/empty.svg';
import './style.less';

type NodeType = {
  name: string;
  count: number;
  color: string;
  icon: string;
};
type NodesListInterface = {
  items: NodeType[];
};

const NodesList = (props: NodesListInterface) => {
  const { items } = props;
  const { pagination, onUpdatePagination } = HOOKS.PaginationConfig({ count: items.length, pageSize: 100 });
  const { page, pageSize } = pagination;

  const onChangePagination = (newPagination: any) => {
    onUpdatePagination(newPagination);
  };

  const getCurrentList = (items: any, page: number, size: number) => {
    return items.slice((page - 1) * size, (page - 1) * size + size);
  };

  return (
    <div className="nodesListRoot">
      {_.isEmpty(items) ? (
        <div className="empty">
          <img className="kw-mb-2" src={empty} />
          <Format.Text style={{ textAlign: 'center' }}>
            {intl.get('graphDetail.noContentPleaseConfiguration')}
          </Format.Text>
        </div>
      ) : (
        <React.Fragment>
          {_.map(getCurrentList(items, page, pageSize), (item, index) => {
            const { alias, count, color, fill_color, icon } = item;
            return (
              <div className="row" key={index}>
                <div className="point kw-center" style={{ backgroundColor: color || fill_color }}>
                  <GraphIcon type={icon} className="icon-svg" />
                </div>
                <Format.Text className="kw-ellipsis kw-pr-1" tip={alias}>
                  {alias}
                </Format.Text>
                <div className="kw-c-subtext">（{HELPER.formatNumberWithComma(count)}）</div>
              </div>
            );
          })}
          {pagination?.count > 100 && (
            <PaginationCommon
              className="pagination kw-pt-6"
              paginationData={pagination}
              onChange={onChangePagination}
            />
          )}
        </React.Fragment>
      )}
    </div>
  );
};

export default NodesList;
