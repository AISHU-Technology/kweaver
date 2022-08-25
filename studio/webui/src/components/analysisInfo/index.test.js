import React from 'react';
import { shallow } from 'enzyme';
import Analysis from './index';

it('renders without crashing', () => {
  shallow(<Analysis />);
});

describe('function test', () => {
  const wrapper = shallow(<Analysis />);
  const instance = wrapper.instance();

  expect(instance.getWordWidth('test')).toBe(0);

  wrapper.setProps({
    reportData: {
      content: [
        '预告：21日直播周杰伦新片《刺陵》见面会新浪娱乐讯 1月21日（周三）16时15，周杰伦( 听歌)主…多个版本，但始终没有得到确认。1月21日，片方将在北京举行的发布会上正式揭晓谜底，请网友拭目以待。'
      ],
      entity: [],
      name: '娱乐6023.txt'
    }
  });

  expect(instance.initData()).toBe();

  wrapper.setProps({
    reportData: {
      name: '新建文本文档 (2).txt',
      content: ['abcd'],
      entity: [
        {
          word_name: 'abcd',
          v_class: 'label',
          v_proper: 'name',
          start_index: 0,
          end_index: 3,
          line_index: 0,
          selected_index: 0,
          before_word: '',
          unique_mark: 0,
          repeat_freq: 0
        }
      ]
    }
  });

  expect(instance.initData()).toBe();
});
