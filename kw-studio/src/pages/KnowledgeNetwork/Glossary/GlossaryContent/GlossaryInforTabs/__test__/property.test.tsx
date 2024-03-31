import React from 'react';
import { shallow } from 'enzyme';
import Property from '../Property';
import GlossaryContext from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';

const init = (props: any) =>
  shallow(
    <GlossaryContext>
      <Property {...props} />
    </GlossaryContext>
  );

describe('PropertyPage', () => {
  it('PropertyPage is exists', () => {
    const wrapper = init({
      setSelectedNodeByTerm: () => {}
    });
    expect(wrapper.exists()).toBe(true);
  });
});
