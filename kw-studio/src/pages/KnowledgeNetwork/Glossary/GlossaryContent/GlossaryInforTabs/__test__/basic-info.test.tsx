import React from 'react';
import { shallow } from 'enzyme';
import BasicInfo from '../BasicInfo';
import GlossaryContext from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';

const init = (props: any) =>
  shallow(
    <GlossaryContext>
      <BasicInfo {...props} />
    </GlossaryContext>
  );

describe('BasicInfoPage', () => {
  it('BasicInfoPage is exists', () => {
    const wrapper = init({
      refreshTerm: () => {}
    });
    expect(wrapper.exists()).toBe(true);
  });
});
