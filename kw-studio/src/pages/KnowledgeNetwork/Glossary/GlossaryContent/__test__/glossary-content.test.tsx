import React from 'react';
import { shallow } from 'enzyme';
import GlossaryContent from '../index';
import GlossaryContext from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';

const init = (props: any) =>
  shallow(
    <GlossaryContext>
      <GlossaryContent {...props} />
    </GlossaryContext>
  );

describe('GlossaryContentPage', () => {
  it('GlossaryContentPage is exists', () => {
    const props = {
      closeDetailPage: () => {},
      openCreateModal: () => {},
      onChangePageSign: () => {},
      handleChangeSelectKn: () => {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
