import React from 'react';
import { mount } from 'enzyme';
import { sleep } from '@/tests';
import SwaggerUI from './index';

// By default `redoc` renders normally, mock it
jest.mock('redoc', () => ({
  RedocStandalone: () => <div className="mock-doc" />
}));
jest.mock('@/services/swagger', () => ({
  swaggerDocGet: jest.fn()
}));

import servicesSwagger from '@/services/swagger';

const mockServiceResponse = (data: any) =>
  (servicesSwagger.swaggerDocGet as any).mockImplementationOnce(() => Promise.resolve(data));
const init = () => mount(<SwaggerUI />);

describe('SwaggerUI', () => {
  it('test failed', async () => {
    mockServiceResponse({ ErrorCode: 'service error' });
    const wrapper = init();
    await sleep();
    wrapper.update();
    expect(wrapper.find('.fail-img').exists()).toBe(true);
  });

  it('test success', async () => {
    mockServiceResponse({
      res: {
        info: {
          description: '欢迎使用KWeaver 1.0 OpenAPI',
          title: 'KWeaver OpenAPI'
        },
        tags: [{ name: 'Studio', description: 'KWeaver管理界面' }],
        paths: {
          '/api/studio/v1/test': {
            get: {
              description: 'test',
              produces: ['application/json'],
              tags: ['Studio']
            }
          }
        }
      }
    });
    const wrapper = init();
    await sleep();
    wrapper.update();
    expect(wrapper.find('.mock-doc').exists()).toBe(true);
  });
});
