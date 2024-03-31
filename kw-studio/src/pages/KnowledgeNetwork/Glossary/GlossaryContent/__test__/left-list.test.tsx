import React from 'react';
import { shallow } from 'enzyme';
import LeftList from '../LeftList';
import GlossaryContext from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';

const init = (props: any) =>
  shallow(
    <GlossaryContext>
      <LeftList {...props} />
    </GlossaryContext>
  );

describe('LeftListPage', () => {
  it('LeftListPage is exists', () => {
    const props = {};
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
