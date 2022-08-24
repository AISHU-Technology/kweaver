import React from 'react';
import { shallow } from 'enzyme';
import intl from 'react-intl-universal';
import ExportModal from './index';

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<ExportModal />);
  });
});

describe('function test', () => {
  const wrapperShallow = shallow(<ExportModal />);
  const instance = wrapperShallow.instance();

  test('test basic function', () => {
    expect(instance.openLoading()).toBe();
    expect(instance.closedLoading()).toBe();
    expect(instance.getTabContent('entity')).toBeTruthy();
    expect(instance.getTabContent('source')).toBeTruthy();
    expect(instance.getTabContent('model')).toBeTruthy();

    wrapperShallow.setState({
      selectedTag: 'entity'
    });

    expect(instance.setTitle()).toContain(intl.get('createEntity.selectO'));

    wrapperShallow.setState({
      selectedTag: 'source'
    });

    expect(instance.setTitle()).toContain(intl.get('createEntity.dataName'));

    wrapperShallow.setState({
      selectedTag: 'model'
    });

    expect(instance.setTitle()).toContain(intl.get('createEntity.selectModel'));
  });
});
