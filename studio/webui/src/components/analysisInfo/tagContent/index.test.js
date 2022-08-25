import React from 'react';
import { shallow } from 'enzyme';
import TagContent from './index';

it('renders without crashing', () => {
  shallow(<TagContent />);
});

describe('function test', () => {
  const wrapper = shallow(<TagContent />);
  const instance = wrapper.instance();

  wrapper.setProps({
    text: [{ word: 'test' }],
    bottomLines: [
      {
        beforeWord: 406,
        color: '#D8707A',
        desWord: 'label：name',
        endIndex: 30,
        entity: 'label',
        lineIndex: 1,
        property: 'name',
        selectedIndex: 0,
        startIndex: 29,
        tagWidth: 28,
        text: '电子',
        uniqueMark: 0
      }
    ],
    bottomLinesDes: [
      {
        beforeWord: 406,
        color: '#D8707A',
        desWord: 'label：name',
        endIndex: 30,
        entity: 'label',
        lineIndex: 1,
        property: 'name',
        selectedIndex: 0,
        startIndex: 29,
        tagWidth: 28,
        text: '电子',
        uniqueMark: 0
      }
    ]
  });

  expect(instance.initData()).toBe();

  expect(instance.getWordWidth('text')).toBe(0);
});
