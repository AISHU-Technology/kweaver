export default jest.mock('react-router-dom', () => ({
  useHistory: () => ({ push: jest.fn(), location: { pathname: '', search: '' }, listen: jest.fn() }),
  useLocation: () => ({ pathname: '', search: '' }),
  withRouter: () => jest.fn(),
  Switch: ({ children }: any) => children,
  Route: ({ component, render }: any) => component || render?.(),
  Redirect: () => null,
  Prompt: () => null
}));
