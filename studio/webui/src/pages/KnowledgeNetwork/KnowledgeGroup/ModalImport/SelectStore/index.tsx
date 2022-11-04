import React, { useState } from 'react';
import _ from 'lodash';
import { Select, message } from 'antd';

import serverStorageManagement from '@/services/storageManagement';

import './index.less';

type SelectStoreType = {
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
};

const SelectStore = React.forwardRef((props: SelectStoreType, ref: any) => {
  const { placeholder = '请选择', value = '' } = props;
  const { onChange } = props;

  const [isFetching, setIsFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [source, setSource] = useState({ items: [], count: 0 });

  const getStore = async (page = 1) => {
    try {
      setIsFetching(true);
      const postData = { page, size: -1, orderField: 'created', order: 'DESC', type: 'nebula', name: '' };
      const result = await serverStorageManagement.graphDBGetList(postData);
      const { df, data, total, count } = result?.res || {};
      const _list = df || data || [];
      const _count = total || count || 0;
      const newList = page === 1 ? _list : source.items.concat(_list);
      setSource({ items: newList, count: _count });
      setIsFetching(false);
    } catch (error) {
      setIsFetching(false);
      const { type = '', response = {} } = (error || {}) as any;
      if (type === 'message') message.error(response?.Description || '');
    }
  };

  const selectScroll = (e: any) => {
    if (source.items.length === source.count || isFetching === true) return;
    const { clientHeight, scrollHeight, scrollTop } = e.target;
    if (scrollTop + clientHeight > scrollHeight - 50) {
      setIsFetching(true);
      const nextPage = page + 1;
      setPage(nextPage);
      getStore(nextPage);
    }
  };

  const onChangeSelect = (value: string) => {
    if (onChange) onChange(value);
  };

  const onDropdownVisibleChange = (isOpen: boolean) => {
    if (isOpen) getStore();
  };

  return (
    <Select
      ref={ref}
      className="selectRoot"
      loading={isFetching}
      placeholder={placeholder}
      value={value || undefined}
      onChange={onChangeSelect}
      onPopupScroll={selectScroll}
      onDropdownVisibleChange={onDropdownVisibleChange}
    >
      {_.map(source.items, item => {
        const { id, name } = item;
        return (
          <Select.Option key={id} value={id}>
            {name}
          </Select.Option>
        );
      })}
    </Select>
  );
});

export default SelectStore;
