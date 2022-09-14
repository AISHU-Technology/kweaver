import React from 'react';
import { shallow } from 'enzyme';
import DataInfo from './index';

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(
      <DataInfo
        props={{
          selectedElement: {
            entity_id: 1,
            source_table: ['1', '2', '3']
          }
        }}
      />
    );
  });

  test('test render Button with isIncorrect', () => {
    const wrapperShallow = shallow(
      <DataInfo
        props={{
          selectedElement: {
            entity_id: 1,
            source_table: ['1', '2', '3']
          }
        }}
      />
    );

    const button = wrapperShallow.find('.add-edges');

    expect(button.length).toBe(0);
  });
});

describe('function test', () => {
  const wrapperShallow = shallow(<DataInfo />);
  const instance = wrapperShallow.instance();

  test('test function deleteInfo', () => {
    expect(
      shallow(
        <DataInfo
          props={{
            selectedElement: {
              entity_id: 1,
              source_table: ['1', '2', '3']
            }
          }}
        />
      )
        .instance()
        .deleteInfo()
    ).toBe();

    expect(
      shallow(
        <DataInfo
          props={{
            selectedElement: {
              edge_id: 1,
              source_table: ['1', '2', '3']
            }
          }}
        />
      )
        .instance()
        .deleteInfo()
    ).toBe();
  });

  test('test function relatedFile', () => {
    expect(
      shallow(
        <DataInfo
          props={{
            selectedElement: {
              entity_id: 1,
              source_table: ['1', '2', '3']
            }
          }}
        />
      )
        .instance()
        .relatedFile()
    ).toBeTruthy();
  });

  test('test function isSwitchAll', () => {
    wrapperShallow.setState({
      property: [
        ['name', 'string', true],
        ['confidence', 'float', true],
        ['adlabel_kcid', 'string', true],
        ['kc_topic_tags', 'string', true],
        ['type_as', 'boolean', true],
        ['type_sa', 'boolean', true],
        ['type_nw', 'boolean', true],
        ['type_kc', 'boolean', true]
      ]
    });

    expect(instance.isSwitchAll()).toBeTruthy();
  });

  test('test function switchAllIndex', () => {
    wrapperShallow.setState({
      property: [
        ['name', 'string', true],
        ['confidence', 'float', true],
        ['adlabel_kcid', 'string', true],
        ['kc_topic_tags', 'string', true],
        ['type_as', 'boolean', true],
        ['type_sa', 'boolean', true],
        ['type_nw', 'boolean', true],
        ['type_kc', 'boolean', true]
      ]
    });

    expect(instance.switchAllIndex(true)).toBe();
    expect(instance.switchAllIndex(false)).toBe();
  });

  test('test function checkInputData', () => {
    wrapperShallow.setState({
      property: [
        ['name', 'string', true],
        ['', 'string', true]
      ],
      page: 1
    });

    expect(instance.checkInputData('', 1)).toBe();

    wrapperShallow.setState({
      property: [
        ['name', 'string', true],
        ['@', 'string', true]
      ],
      page: 1
    });

    expect(instance.checkInputData('@', 1)).toBe();

    wrapperShallow.setState({
      property: [
        ['name', 'string', true],
        ['1', 'string', true]
      ],
      page: 1
    });

    expect(instance.checkInputData('1', 1)).toBe();

    wrapperShallow.setState({
      property: [
        ['name', 'string', true],
        [
          '1das1das1das1das1das1das1das1das1das1das1das1das1d…s1das1das1das1das1das1das1das1das1das1das1das1das',
          'string',
          true
        ]
      ],
      page: 1
    });

    expect(
      instance.checkInputData(
        '1das1das1das1das1das1das1das1das1das1das1das1das1d…s1das1das1das1das1das1das1das1das1das1das1das1das',
        1
      )
    ).toBe();
  });

  test('test function deleteProperty', () => {
    wrapperShallow.setState({
      property: [
        ['name', 'string', true],
        ['confidence', 'float', true],
        ['adlabel_kcid', 'string', true],
        ['kc_topic_tags', 'string', true],
        ['type_as', 'boolean', true],
        ['type_sa', 'boolean', true],
        ['type_nw', 'boolean', true],
        ['type_kc', 'boolean', true]
      ],
      page: 1,
      checkData: { content: '', currentIndex: 0, isIncorrect: false }
    });

    expect(instance.deleteProperty(7)).toBe();

    wrapperShallow.setState({
      property: [
        ['name', 'string', true],
        ['confidence', 'float', true],
        ['adlabel_kcid', 'string', true],
        ['kc_topic_tags', 'string', true],
        ['type_as', 'boolean', true],
        ['type_sa', 'boolean', true],
        ['type_nw', 'boolean', true],
        ['type_kc', 'boolean', true]
      ],
      page: 1,
      checkData: { content: '', currentIndex: 7, isIncorrect: true }
    });

    expect(instance.deleteProperty(7)).toBe();

    wrapperShallow.setState({
      property: [
        ['name', 'string', true],
        ['confidence', 'float', true],
        ['adlabel_kcid', 'string', true],
        ['kc_topic_tags', 'string', true],
        ['type_as', 'boolean', true],
        ['type_sa', 'boolean', true],
        ['type_nw', 'boolean', true],
        ['type_kc', 'boolean', true]
      ],
      page: 1,
      checkData: { content: '', currentIndex: 6, isIncorrect: true }
    });

    expect(instance.deleteProperty(7)).toBe();
  });

  test('test function changeColor', () => {
    expect(instance.changeColor('#ffffff')).toBe();
  });

  test('test function addProperty', () => {
    wrapperShallow.setState({
      property: [
        ['name', 'string', true],
        ['confidence', 'float', true],
        ['adlabel_kcid', 'string', true],
        ['kc_topic_tags', 'string', true],
        ['type_as', 'boolean', true],
        ['type_sa', 'boolean', true],
        ['type_nw', 'boolean', true],
        ['type_kc', 'boolean', true]
      ],
      page: 1,
      checkData: { content: '', currentIndex: 0, isIncorrect: false }
    });

    expect(instance.addProperty()).toBe();
  });

  test('test function changeSelect', () => {
    wrapperShallow.setState({
      property: [
        ['name', 'string', true],
        ['confidence', 'float', true],
        ['adlabel_kcid', 'string', true],
        ['kc_topic_tags', 'string', true],
        ['type_as', 'boolean', true],
        ['type_sa', 'boolean', true],
        ['type_nw', 'boolean', true],
        ['type_kc', 'boolean', true]
      ],
      page: 1,
      checkData: { content: '', currentIndex: 0, isIncorrect: false }
    });

    expect(instance.changeSelect(10, 1)).toBe();
  });

  test('test function changeInput', () => {
    wrapperShallow.setState({
      property: [
        ['name', 'string', true],
        ['confidence', 'float', true],
        ['adlabel_kcid', 'string', true],
        ['kc_topic_tags', 'string', true],
        ['type_as', 'boolean', true],
        ['type_sa', 'boolean', true],
        ['type_nw', 'boolean', true],
        ['type_kc', 'boolean', true]
      ],
      page: 1,
      checkData: { content: '', currentIndex: 0, isIncorrect: false }
    });

    expect(instance.changeInput(10, 1, 1)).toBe();
  });
});
