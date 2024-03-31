class ExceptLevel(object):
    ERROR = 0
    WARN = 1


class ExceptionDelegateObject(object):
    def __init__(self, key, prop_tuple):
        self.key = key
        self.propTuple = prop_tuple


class ExceptionDelegateMap(object):
    except_delegate_meta = {
        'ADBaseException': ('BASE_PROVIDER', 0),
        'DataTransformException': ('DataTransform_PROVIDER', 1)

    }

    @classmethod
    def get(cls, exception_class):
        for exceptionKey, providerInfo in cls.except_delegate_meta.items():
            if exceptionKey in exception_class.__mro__:
                return providerInfo
        # Return to the underlying provider by default
        return cls.except_delegate_meta['ADBaseException']


class ExceptionDelegate(object):
    def __init__(self, exception_class, error_info_tuple):
        # (0:Module name, 1:Module ID, 2:Exception level type, 3:Exception value, 4:Exception error message)
        provider, provider_id = ExceptionDelegateMap.get(exception_class)
        error_type, error_value, error_msg = error_info_tuple

        self.provider = provider
        self.provider_id = provider_id
        self.error_type = error_type
        self.error_value = error_value
        self.error_msg = error_msg
        self.error_id = self.gen_error_id(error_type, provider_id, error_value)

    @staticmethod
    def gen_error_id(error_type, provider_id, error_value):
        """
        error_id generate
        :param error_type: [error：0 | warning：1]
        :param provider_id: [Distinction between modules (0, 2047)]
        :param error_value: [Intra module exception differentiation string]
        :return:
        """

        def valid(level, provider, value):
            exp_level_section = (0, 1)
            module_provider_section = (0, 2047)
            return (isinstance(value, str) and
                    module_provider_section[1] >= provider >= module_provider_section[0] and
                    exp_level_section[1] >= level >= exp_level_section[0])

        is_valid = valid(error_type, provider_id, error_value)
        if not is_valid:
            raise RuntimeError('invalid arguments')
        return 0 << 31 | 1 << 29 | 1 << 28 | error_type << 27 | provider_id << 16


class ADBaseException(Exception):
    def __init__(self, error_info_tuple):
        """
        Base class for all service exceptions
        :param tuple error_info_tuple: (<msgid>, <error_value>)
        """
        self.delegate = ExceptionDelegate(self.__class__, error_info_tuple)

        super(ADBaseException, self).__init__(self.delegate.error_msg.encode('utf-8'))
