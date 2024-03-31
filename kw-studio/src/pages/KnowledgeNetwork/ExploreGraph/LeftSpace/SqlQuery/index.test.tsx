import React from 'react';
import { mount } from 'enzyme';
import store from '@/reduxConfig/store';
import { Provider } from 'react-redux';

import Sql from '.';

const defaultProps = {
  leftDrawerKey: 'sql',
  selectedItem: { key: '111', detail: { authorKgView: '111', kg: { kg_id: '11' } }, current: {} },
  onChangeData: jest.fn(),
  sqlHistory: {},
  ad_updateSqlHistory: jest.fn(),
  onCloseLeftDrawer: jest.fn()
};

jest.mock('@/services/visualAnalysis', () => ({
  customSearch: () =>
    Promise.resolve({
      res: [
        {
          nodes: [
            {
              id: 'e77e6d221df33f50de791b3cf7aa1f2b',
              alias: 'company_1',
              color: '#d9534c',
              class_name: 'company_1',
              icon: '',
              default_property: {
                name: 'id',
                value: '1',
                alias: 'id'
              },
              tags: ['company_1'],
              properties: [
                {
                  tag: 'company_1',
                  props: [
                    {
                      key: 'id',
                      value: '1',
                      alias: 'id',
                      type: 'string',
                      disabled: false,
                      checked: false
                    },
                    {
                      key: 'name',
                      value: '爱数',
                      alias: 'name',
                      type: 'string',
                      disabled: false,
                      checked: false
                    },
                    {
                      key: 'location',
                      value: '北京',
                      alias: 'location',
                      type: 'string',
                      disabled: false,
                      checked: false
                    }
                  ]
                }
              ]
            }
          ],
          statement: 'MATCH (V) RETURN V LIMIT 2'
        }
      ]
    })
}));
const init = (props = defaultProps) =>
  mount(
    <Provider store={store}>
      <Sql {...props} />
    </Provider>
  );

describe('sql', () => {
  it('init wrapper', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
