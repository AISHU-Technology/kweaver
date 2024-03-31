import React from 'react';
import { mount } from 'enzyme';
import { sleep, act } from '@/tests';
import ConfigureRules from '..';

const defaultProps: any = {
  visible: true,
  selectedItem: { detail: { kg: { id: '1' } } },
  ruleList: [], // 规则列表
  filterType: 'v_filters',
  editRule: {
    name: '名字',
    v_filters: [
      {
        id: '11',
        tag: 'person',
        relation: '',
        type: 'satisfy_all',
        error: false,
        dataSource: {
          alias: 'person',
          name: 'person',
          color: '#50A06A'
        },
        property_filters: [{ proId: '1', name: 'name', property_type: 'string', operation: '大于', op_value: '张三' }],
        selfProperties: [
          { name: 'aaa', type: 'string' },
          { name: 'bbb', type: 'float' },
          { name: 'startTime', type: 'datetime' },
          { name: 'time', type: 'date' },
          { name: 'isCheck', type: 'boolean' }
        ]
      }
    ],
    e_filters: []
  }, // 编辑规则的内容
  ontoData: {
    edge: [
      {
        alias: '包含',
        color: '#c64f58',
        edge_id: 1,
        name: 'contain',
        relation: ['contract', 'contain', 'clause']
      },
      {
        alias: '我方主体',
        color: '#d9534c',
        edge_id: 2,
        name: 'ownerSubject',
        relation: ['contract', 'ownerSubject', 'company']
      },
      {
        alias: '\u5bf9\u65b9\u4e3b\u4f53',
        color: '他方主体',
        edge_id: 3,
        name: 'otherSubject',
        relation: ['contract', 'otherSubject', 'company']
      }
    ],
    entity: [
      {
        alias: '合同',
        color: '#5c539b',
        entity_id: 1,
        icon: 'graph-model',
        name: 'contract',
        x: 739.4772143144112,
        y: 367.6104764514487
      },
      {
        alias: '\u516c\u53f8\u6216\u4eba',
        color: '公司',
        entity_id: 2,
        icon: 'graph-model',
        name: 'company',
        x: 887.5169589001216,
        y: 339.4743194985798
      },
      {
        alias: '条款',
        color: '#68798e',
        entity_id: 3,
        icon: 'graph-model',
        name: 'clause',
        x: 883.8961588858092,
        y: 412.20008316529777
      }
    ]
  }, // 图谱点类和边类数据

  onCancel: jest.fn(),
  onOk: jest.fn() // 点击确定
};

const init = (props = defaultProps) => mount(<ConfigureRules {...props} />);

describe('configureRules', () => {
  it('init wrapper', () => {
    const wrapper = init({ ...defaultProps, filterType: false });
    expect(wrapper.exists()).toBe(true);

    act(() => {
      wrapper.find('.ant-tabs-tab').at(1).simulate('click');
    });
  });
  it('input', () => {
    const wrapper = init();
    act(() => {
      wrapper
        .find('.ruleNameInput')
        .at(0)
        .simulate('change', { target: { value: 'aaaaa' } });
    });
  });
});
