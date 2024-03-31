import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import KnowledgeCard from '../index';

jest.mock('../BlockComponents', () => {
  const BlockComponents = () => null;
  BlockComponents.displayName = 'BlockComponents';
  return BlockComponents;
});
jest.mock('../BlockConfig', () => {
  const BlockConfig = () => null;
  BlockConfig.displayName = 'BlockConfig';
  return BlockConfig;
});
jest.mock('../BlockPreview', () => {
  const BlockPreview = () => null;
  BlockPreview.displayName = 'BlockPreview';
  return BlockPreview;
});
jest.mock('../BlockSource', () => {
  const BlockSource = () => null;
  BlockSource.displayName = 'BlockSource';
  return BlockSource;
});

const defaultProps = {
  type: 'card',
  knwId: 1,
  data: [],
  graphSources: [],
  onExit: jest.fn(),
  onSave: jest.fn()
};
const init = (props = defaultProps) => mount(<KnowledgeCard {...props} />);

describe('KnowledgeCard', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
