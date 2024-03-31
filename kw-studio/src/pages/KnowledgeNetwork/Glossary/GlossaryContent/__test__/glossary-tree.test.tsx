import React from 'react';
import { shallow } from 'enzyme';
import GlossaryTree from '../GlossaryTree';
import GlossaryContext from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';

const init = (props: any) =>
  shallow(
    <GlossaryContext>
      <GlossaryTree {...props} />
    </GlossaryContext>
  );

describe('GlossaryTreePage', () => {
  it('GlossaryTreePage is exists', () => {
    const props = {
      electedLanguage: '',
      onTreeNodeSelect: () => {},
      showSearch: true,
      checkable: false,
      readOnly: false,
      onCheck: () => {},
      checkedKeys: []
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
