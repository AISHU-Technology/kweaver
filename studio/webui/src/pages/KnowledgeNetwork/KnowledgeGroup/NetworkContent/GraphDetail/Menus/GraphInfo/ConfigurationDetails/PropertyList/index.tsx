import React, { useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import HOOKS from '@/hooks';
import Format from '@/components/Format';
import PaginationCommon from '@/components/PaginationCommon';

import './style.less';

type PropertyType = {
  name: string;
  type: string;
};
type PropertyListType = {
  items: PropertyType[];
};
const PropertyList = (props: PropertyListType) => {
  const { items = [] } = props;
  const { pagination, onUpdatePagination } = HOOKS.PaginationConfig({ count: items.length, pageSize: 4 });
  const { page, pageSize } = pagination;

  useEffect(() => {
    onUpdatePagination({ page: 1, pageSize: 4, count: items.length });
  }, [items]);

  const onChangePagination = (newPagination: any) => {
    onUpdatePagination(newPagination);
  };

  const getCurrentList = (items: any, page: number, size: number) => {
    return items.slice((page - 1) * size, (page - 1) * size + size);
  };

  return (
    <div className="propertyListRoot">
      <div className="properties ad-align-center ad-pb-3 ad-mb-2">
        <Format.Title>Properties</Format.Title>
        <Format.Text className="ad-c-subtext">（{items.length}）</Format.Text>
      </div>
      {_.isEmpty(items) ? (
        <Format.Text className="ad-w-100 ad-c-subtext " align="center">
          {intl.get('graphDetail.noContent')}
        </Format.Text>
      ) : (
        <React.Fragment>
          {_.map(getCurrentList(items, page, pageSize), (item: PropertyType, index) => {
            return (
              <div key={index} className="ad-pb-4">
                <div className="ad-pb-2">
                  <Format.Text>{item?.name}</Format.Text>
                </div>
                <div className="imitationInput">
                  <Format.Text>{item?.type?.toUpperCase()}</Format.Text>
                </div>
              </div>
            );
          })}
          <PaginationCommon
            className="ad-mt-2"
            paginationData={pagination}
            onChange={onChangePagination}
            antProps={{ showTotal: null }}
          />
        </React.Fragment>
      )}
    </div>
  );
};

export default PropertyList;
