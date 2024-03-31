import React from 'react';
import { mount } from 'enzyme';
import DataSourceQuery from '../index';

const defaultProps = {
  knData: { id: '2' }
};

jest.mock('@/services/dataSource', () => ({
  dataSourceGet: Promise.resolve({
    count: 13,
    df: [
      {
        connect_type: '',
        create_time: '2023-08-10 16:11:04',
        create_user: '60b63afd-8bb4-4030-a49f-9dbd4e60208f',
        create_user_email: 'mia@aishu.cn',
        create_user_name: 'mia',
        dataType: 'unstructured',
        data_source: 'as7',
        ds_address: 'https://anyshare.aishu.cn',
        ds_auth: '3',
        ds_password: null,
        ds_path: 'KWeaver研发线',
        ds_port: 443,
        ds_user: null,
        dsname: 'anyshare',
        extract_type: 'modelExtraction',
        id: 22,
        json_schema: '',
        knw_id: 2,
        queue: '',
        update_time: '2023-08-15 13:22:25',
        update_user: '60b63afd-8bb4-4030-a49f-9dbd4e60208f',
        update_user_email: 'mia@aishu.cn',
        update_user_name: 'mia',
        vhost: ''
      }
    ]
  })
}));
const init = (props = defaultProps) => mount(<DataSourceQuery {...props} />);

describe('DataSourceQuery', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
