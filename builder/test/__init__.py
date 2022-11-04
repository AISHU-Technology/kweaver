from flask import Flask
from common.international import bind_i18n
from unittest import mock

testApp = Flask(__name__)
bind_i18n(testApp)
testApp.app_context().push()
testApp.test_request_context().push()


class MockResponse:
    """
    mock requests返回值
    """

    def __init__(self, status_code, json_data):
        self.status_code = status_code
        self.json_data = json_data
        self.content = str(json_data)

    def json(self):
        if isinstance(self.json_data, mock.Mock):
            return self.json_data()
        return self.json_data


class MockNebulaResponse:
    '''mock nebula的返回值'''

    def __init__(self, error=None, data=None):
        '''
        error传入str
        data传入pandas.DataFrame
        '''
        if error:
            self.error = error
        if data is not None:
            self.data = data

    def error_msg(self):
        return str(self.error)

    def row_size(self):
        return len(self.data)

    def row_values(self, row_index):
        res = []
        for i in range(len(self.data.iloc[row_index])):
            res.append(self.ValueWrapper(self.data.iloc[row_index][i]))
        return res

    def column_values(self, column_name):
        res = []
        for i in range(len(self.data)):
            res.append(self.ValueWrapper(self.data.iloc[i][column_name]))
        return res

    class ValueWrapper():
        def __init__(self, arg):
            self.arg = arg

        def as_string(self):
            return str(self.arg)

        def as_int(self):
            return int(self.arg)
