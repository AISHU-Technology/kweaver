import React, { useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import HOOKS from '@/hooks';
import Format from '@/components/Format';
import PaginationCommon from '@/components/PaginationCommon';

import './style.less';
import { Divider } from 'antd';

type PropertyType = {
  name: string;
  type: string;
  alias?: string;
};
type PropertyListType = {
  items: PropertyType[];
};
const PropertyList = (props: PropertyListType) => {
  const { items = [] } = props;
  const { pagination, onUpdatePagination } = HOOKS.PaginationConfig({ count: items.length, pageSize: 5 });
  const { page, pageSize } = pagination;

  useEffect(() => {
    onUpdatePagination({ page: 1, pageSize: 5, count: items.length });
  }, [items]);

  const onChangePagination = (newPagination: any) => {
    onUpdatePagination(newPagination);
  };

  const getCurrentList = (items: any, page: number, size: number) => {
    return items.slice((page - 1) * size, (page - 1) * size + size);
  };

  return (
    <div className="propertyListRoot">
      <div className="properties kw-align-center kw-pb-3 kw-mb-2">
        <Format.Title>{intl.get('graphDetail.properties')}</Format.Title>
        <Format.Text className="kw-c-subtext">（{items.length}）</Format.Text>
      </div>
      {_.isEmpty(items) ? (
        <Format.Text className="kw-w-100 kw-c-subtext " align="center">
          {intl.get('graphDetail.noContent')}
        </Format.Text>
      ) : (
        <React.Fragment>
          {_.map(getCurrentList(items, page, pageSize), (item: PropertyType, index) => {
            return (
              <>
                <div key={index} className="kw-pb-4 kw-space-between">
                  <div className="kw-flex-column kw-flex-item-full-width">
                    <span className="kw-c-header" title={item.name}>
                      {item.name}
                    </span>
                    <span className="kw-c-subtext" title={item.alias}>
                      {item.alias}
                    </span>
                  </div>
                  <div className="imitationInput">
                    <Format.Text>{item?.type}</Format.Text>
                  </div>
                </div>
                <Divider className="kw-mt-0 kw-mb-2" />
              </>
            );
          })}
          <PaginationCommon
            className="kw-mt-4"
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
