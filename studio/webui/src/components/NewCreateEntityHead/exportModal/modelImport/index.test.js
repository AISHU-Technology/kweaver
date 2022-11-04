import React from 'react';
import { shallow, mount } from 'enzyme';
import intl from 'react-intl-universal';

import store from '@/reduxConfig/store';

import { showError, handleDataSourceData } from './assistFunction';

import ModelImport from './index';

const init = (props = {}) => {
  const root = mount(<ModelImport store={store} {...props} />);
  const wrapper = root.find('ModelImport').at(0);

  return wrapper;
};

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<ModelImport store={store} />);
  });
});

describe('function test', () => {
  const wrapper = init();
  const instance = wrapper.instance();

  test('test basic function', () => {
    expect(instance.getSelectList()).toMatchObject({});

    expect(instance.selectModel('AI')).toMatchObject({});

    expect(instance.renderGraph('AI')).toMatchObject({});

    expect(
      instance.renderGraphT(
        {
          res: {
            entity_list: [
              'person',
              'enterprise',
              'job_title',
              'production',
              'Text',
              'lead_investor',
              'acquirer',
              'algorithm_proposer',
              'algorithm',
              'paper',
              'conference',
              'location'
            ],
            entity_main_table_dict: [
              { entity: 'person', main_table: [] },
              { entity: 'enterprise', main_table: [] },
              { entity: 'job_title', main_table: [] },
              { entity: 'production', main_table: [] },
              { entity: 'Text', main_table: [] },
              { entity: 'lead_investor', main_table: [] },
              { entity: 'acquirer', main_table: [] },
              { entity: 'algorithm_proposer', main_table: [] },
              { entity: 'algorithm', main_table: [] },
              { entity: 'paper', main_table: [] },
              { entity: 'conference', main_table: [] },
              { entity: 'location', main_table: [] }
            ],
            entity_property_dict: [
              {
                entity: 'person',
                property: [['name', 'string']]
              },
              {
                entity: 'enterprise',
                property: [['name', 'string']]
              },
              {
                entity: 'job_title',
                property: [['name', 'string']]
              },
              {
                entity: 'production',
                property: [['name', 'string']]
              },
              {
                entity: 'Text',
                property: [['name', 'string']]
              },
              {
                entity: 'lead_investor',
                property: [
                  ['name', 'string'],
                  ['financing_amount', 'string']
                ]
              }
            ],
            extract_type: 'modelExtraction',
            model: 'AImodel',
            relation_main_table_dict: [],
            relation_property_dict: [
              {
                edge: 'work_on',
                property: [['name', 'string']]
              },
              {
                edge: 'position',
                property: [['name', 'string']]
              }
            ],
            entity_relation_set: [
              ['person', 'work_on', 'enterprise'],
              ['person', 'position', 'job_title'],
              ['enterprise', 'develop', 'production'],
              ['enterprise', 'financing', 'Text'],
              ['enterprise', 'invest', 'enterprise'],
              ['lead_investor', 'lead', 'enterprise'],
              ['acquirer', 'take_over', 'enterprise'],
              ['algorithm_proposer', 'propose', 'algorithm'],
              ['person', 'publish', 'paper'],
              ['paper', 'journal', 'Text'],
              ['enterprise', 'purchased_by', 'enterprise'],
              ['conference', 'venue', 'location'],
              ['enterprise', 'hold', 'conference']
            ]
          }
        },
        'AImodel'
      )
    ).toBe();

    expect(instance.customizeRenderEmpty()).toBeTruthy();
  });
});

describe('assistFunction test', () => {
  test('test assistFunction', () => {
    expect(
      handleDataSourceData(
        {
          entity_list: [
            'person',
            'enterprise',
            'job_title',
            'production',
            'Text',
            'lead_investor',
            'acquirer',
            'algorithm_proposer',
            'algorithm',
            'paper',
            'conference',
            'location'
          ],
          entity_main_table_dict: [
            { entity: 'person', main_table: [] },
            { entity: 'enterprise', main_table: [] },
            { entity: 'job_title', main_table: [] },
            { entity: 'production', main_table: [] },
            { entity: 'Text', main_table: [] },
            { entity: 'lead_investor', main_table: [] },
            { entity: 'acquirer', main_table: [] },
            { entity: 'algorithm_proposer', main_table: [] },
            { entity: 'algorithm', main_table: [] },
            { entity: 'paper', main_table: [] },
            { entity: 'conference', main_table: [] },
            { entity: 'location', main_table: [] }
          ],
          entity_property_dict: [
            {
              entity: 'person',
              property: [['name', 'string']]
            },
            {
              entity: 'enterprise',
              property: [['name', 'string']]
            },
            {
              entity: 'job_title',
              property: [['name', 'string']]
            },
            {
              entity: 'production',
              property: [['name', 'string']]
            },
            {
              entity: 'Text',
              property: [['name', 'string']]
            },
            {
              entity: 'lead_investor',
              property: [
                ['name', 'string'],
                ['financing_amount', 'string']
              ]
            }
          ],
          extract_type: 'modelExtraction',
          model: 'AImodel',
          relation_main_table_dic: [],
          relation_property_dict: [
            {
              edge: 'work_on',
              property: [['name', 'string']]
            },
            {
              edge: 'position',
              property: [['name', 'string']]
            }
          ],
          entity_relation_set: [
            ['person', 'work_on', 'enterprise'],
            ['person', 'position', 'job_title'],
            ['enterprise', 'develop', 'production'],
            ['enterprise', 'financing', 'Text'],
            ['enterprise', 'invest', 'enterprise'],
            ['lead_investor', 'lead', 'enterprise'],
            ['acquirer', 'take_over', 'enterprise'],
            ['algorithm_proposer', 'propose', 'algorithm'],
            ['person', 'publish', 'paper'],
            ['paper', 'journal', 'Text'],
            ['enterprise', 'purchased_by', 'enterprise'],
            ['conference', 'venue', 'location'],
            ['enterprise', 'hold', 'conference']
          ]
        },
        {}
      )
    ).toMatchObject({});

    expect(showError(500001)).toBe();
    expect(showError(500002)).toBe();
    expect(showError(500006)).toBe();
    expect(showError(500009)).toBe();
    expect(showError(500010)).toBe();
    expect(showError(500011)).toBe();
  });
});
