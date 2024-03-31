import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Select, message } from 'antd';

import { PERMISSION_KEYS } from '@/enums';
import serviceModelLibrary from '@/services/modelLibrary';
import servicesPermission from '@/services/rbacPermission';

const CoverSelectModel = (props: any) => {
  const { onChange } = props;
  const { form } = props;

  const [items, setItems] = useState<any>([]);
  const [optionsList, setOptionsList] = useState<any>([]);

  useEffect(() => {
    getItems();
  }, []);

  const getItems = async () => {
    try {
      const postData = {
        page: '1',
        size: '500',
        rule: 'update_time',
        order: 'desc',
        perm: 'display'
      };
      const result = await serviceModelLibrary.modelGet(postData); // 查询列表
      if (!result?.res?.model_infos) return;
      // 添加临时的筛选字段，供前端筛选
      const _items = _.map(result.res.model_infos, item => {
        const _rel = item?.name;
        return { ...item, _rel };
      });

      // const dataIds = _.map(_items, (item: any) => String(item.id));
      // const permissionPostData = { dataType: PERMISSION_KEYS.TYPE_MODEL, dataIds };
      // const permissionResult = await servicesPermission.dataPermission(permissionPostData); // 根据列表查询权限
      // if (!permissionResult?.res) return;
      // const codesData = _.keyBy(permissionResult?.res, 'dataId');
      setItems(_items);
      setOptionsList(_items);
    } catch (error) {
      const { type, response, data } = error;
      if (type === 'message') return message.error(response?.Description || '');
      message.error(data?.Description || 'Error');
    }
  };

  const options = _.map(optionsList, item => ({ label: item?.name, value: item?.id, data: item }));

  return (
    <Select
      showSearch={true}
      filterOption={(input: string, option: any) => _.includes(option?.data?._rel, input)}
      placeholder={intl.get('modelLibrary.pleaseSelectModel')}
      onChange={(value, item: any) => {
        const { name, tags, description } = item?.data || {};
        form.setFieldsValue({ name, tags, description });
        onChange(value);
      }}
      options={options}
    />
  );
};

export default CoverSelectModel;
