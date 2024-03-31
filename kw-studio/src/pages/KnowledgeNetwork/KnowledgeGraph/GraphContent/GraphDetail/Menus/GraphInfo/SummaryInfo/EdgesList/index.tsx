import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import HOOKS from '@/hooks';
import HELPER from '@/utils/helper';
import Format from '@/components/Format';
import PaginationCommon from '@/components/PaginationCommon';

import empty from '@/assets/images/empty.svg';
import './style.less';

type EdgeType = {
  alias: string;
  count: number;
  color: string;
};
type EdgeListInterface = {
  items: Array<EdgeType>;
};

const EdgesList = (props: EdgeListInterface) => {
  const { items } = props;
  const { pagination, onUpdatePagination } = HOOKS.PaginationConfig({ count: items.length, pageSize: 100 });
  const { page, pageSize } = pagination;
  const [edges, setEdges] = useState<any>([]);

  useEffect(() => {
    if (_.isEmpty(items)) return;
    const itemKV = _.keyBy(items, 'name');
    const newEdges = _.map(_.keys(itemKV), key => itemKV[key]);
    setEdges(newEdges);
    onChangePagination({ count: newEdges?.length });
  }, [JSON.stringify(items)]);

  const onChangePagination = (newPagination: any) => {
    onUpdatePagination(newPagination);
  };

  const getCurrentList = (edges: any, page: number, size: number) => {
    return edges.slice((page - 1) * size, (page - 1) * size + size);
  };

  return (
    <div className="edgesListRoot">
      {_.isEmpty(edges) ? (
        <div className="empty">
          <img className="kw-mb-2" src={empty} />
          <Format.Text style={{ textAlign: 'center' }}>{intl.get('graphDetail.noContent')}</Format.Text>
        </div>
      ) : (
        <React.Fragment>
          {_.map(getCurrentList(edges, page, pageSize), (item, index) => {
            const { alias, count, color } = item;
            return (
              <div className="row" key={index}>
                <div className="line" style={{ backgroundColor: color }} />
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

export default EdgesList;
