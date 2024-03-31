import React from 'react';
import { mount } from 'enzyme';
import ExtendedEdge from '.';
import { act, sleep } from '@/tests';

const defaultProps = {
  onCloseMenu: jest.fn(),
  selectedNode: {
    getModel: () => {
      return { id: '111' };
    }
  },
  selectedItem: { detail: { kg: { kg_id: 1 }, authorKgView: true }, source: {} },
  extend: { current: { isShow: true } },
  onChangeData: jest.fn(),
  openTip: jest.fn()
};
jest.mock('@/services/explore', () => ({
  getInOrOut: () =>
    Promise.resolve({
      res: {
        in_e: [],
        out_e: [
          { edge_class: 'acted_by', color: '#ecb763', count: '78', alias: '主演' },
          { edge_class: 'direct', color: '#3a4673', count: '1', alias: '导演' },
          { edge_class: 'produced_by', color: '#d9534c', count: '1', alias: '出品公司' }
        ]
      }
    }),
  expandEdges: () =>
    Promise.resolve({
      res: [
        {
          search_id: 'ee36c16fb7baf76f8b8a0bf38df6522f',
          id: '32cf53305d18a20b2d0108d747e5802d',
          class: 'person',
          color: '#2a908f',
          alias: '人物',
          icon: 'graph-model',
          default_property: { n: 'name', v: '苏舟' },
          properties: [
            { n: '_ds_id_', v: '1' },
            { n: '_name_', v: '_name_' },
            { n: '_timestamp_', v: '1679448527' },
            { n: 'birthday', v: '' },
            { n: 'height', v: '' },
            { n: 'minority', v: '' },
            { n: 'name', v: '苏舟' }
          ],
          in_e: [
            {
              id: 'direct:"ee36c16fb7baf76f8b8a0bf38df6522f"-\u003e"32cf53305d18a20b2d0108d747e5802d"',
              class: 'direct',
              alias: '导演',
              color: '#3a4673',
              name: '__NULL__',
              properties: [
                { n: '_name_', v: '_name_' },
                { n: '_timestamp_', v: '__NULL__' },
                { n: 'name', v: 'direct' }
              ]
            }
          ],
          out_e: null
        }
      ]
    })
}));
const init = (props = defaultProps) => mount(<ExtendedEdge {...props} />);

describe('render', () => {
  it('init render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });

  it('expand edges', async () => {
    const wrapper = init();
    await sleep(20);
    wrapper.update();
    act(() => {
      wrapper.find('.kw-space-between').at(1).simulate('click');
    });
  });
});
