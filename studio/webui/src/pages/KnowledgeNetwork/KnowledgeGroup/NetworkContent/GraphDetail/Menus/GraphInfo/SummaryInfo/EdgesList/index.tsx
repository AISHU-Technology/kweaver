import React from 'react';
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
  const { pagination, onUpdatePagination } = HOOKS.PaginationConfig({ count: items.length, pageSize: 20 });
  const { page, pageSize } = pagination;

  const onChangePagination = (newPagination: any) => {
    onUpdatePagination(newPagination);
  };

  const getCurrentList = (items: any, page: number, size: number) => {
    return items.slice((page - 1) * size, (page - 1) * size + size);
  };

  return (
    <div className="edgesListRoot">
      {_.isEmpty(items) ? (
        <div className="empty">
          <img className="ad-mb-2" src={empty} />
          <Format.Text style={{ textAlign: 'center' }}>{intl.get('graphDetail.noContent')}</Format.Text>
        </div>
      ) : (
        <React.Fragment>
          {_.map(getCurrentList(items, page, pageSize), (item, index) => {
            const { alias, count, color } = item;
            return (
              <div className="row" key={index}>
                <div className="line" style={{ backgroundColor: color }} />
                <Format.Text className="ad-ellipsis ad-pr-1" tip={alias}>
                  {alias}
                </Format.Text>
                <div className="ad-c-subtext">（{HELPER.formatNumberWithComma(count)}）</div>
              </div>
            );
          })}
          <PaginationCommon className="pagination ad-pt-6" paginationData={pagination} onChange={onChangePagination} />
        </React.Fragment>
      )}
    </div>
  );
};

export default EdgesList;
