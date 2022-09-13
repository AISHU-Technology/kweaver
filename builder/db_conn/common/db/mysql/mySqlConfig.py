
#  pymysql 操作数据库
class DbMysqlConfig:

    __CHARSET = 'utf8'      # 字符编码
    __MAX_CONNECTIONS = 30  # 创建连接池的最大数量 ，默认为30
    __MIN_CACHED = 10       # 连接池中空闲连接的初始数量 ,默认为10
    __MAX_CACHED = 20       # 连接池中空闲连接的最大数量，默认为20
    __MAX_SHARED = 0        # 共享连接的最大数量,
    __BLOCKING = True       # 超过最大连接数量时候的表现，为True等待连接数量下降，为False直接报错处理
    __MAX_USAGE = 20       # 单个连接的最大重复使用次数

    '''
         setsession: optional list of SQL commands that may serve to prepare
            the session, e.g. ["set datestyle to ...", "set time zone ..."]
         reset: how connections should be reset when returned to the pool
            (False or None to rollback transcations started with begin(),
            True to always issue a rollback for safety's sake)
    '''
    __SET_SESSION = None
    __RESET = True

    '''
    pooledDB 允许的参数
    '''
    PooledDB_Params_Map = {
        'max_connections': __MAX_CONNECTIONS,
        'min_cached': __MIN_CACHED,
        'max_cached': __MAX_CACHED,
        'max_shared': __MAX_SHARED,
        'blocking': __BLOCKING,
        'max_usage': __MAX_USAGE,
        'set_session': __SET_SESSION,
        'reset': __RESET
    }

    '''
    支持的pyMySQL 参数
    '''
    PY_MYSQL_PARAMS = {
        'unix_socket': None, 'sql_mode': None, 'client_flag': 0,
        'read_default_file': None, 'conv': None, 'use_unicode': None,
        'cursorclass': 'Cursor', 'init_command': None,
        'connect_timeout': 10, 'ssl': None, 'read_default_group': None,
        'compress': None,
        'autocommit': False, 'local_infile': False,
        'max_allowed_packet': 16 * 1024 * 1024, 'defer_connect': False,
        'auth_plugin_map': None, 'read_timeout': None, 'write_timeout': None,
        'bind_address': None, 'binary_prefix': False
    }

    def __init__(self, host=None, user=None, password="", database=None, port=3306,  **kwargs):
        """
        Args:
            host: 数据库ip地址
            database:数据库名称
            user: 用户名
            password: 用户密码
            port: 数据库端口  (default: 3306)
            *args:
            **kwargs: 此参数是pooledDB 和支持的pymysql的参数
        """
        self.host = host
        self.port = port
        self.database = database
        self.user = user
        self.password = password

        self.charset = kwargs.get('charset', self.__CHARSET)
        self.max_connections = kwargs.get('maxconnections', self.__MAX_CONNECTIONS)
        self.min_cached = kwargs.get('mincached', self.__MIN_CACHED)
        self.max_cached = kwargs.get('maxcached',  self.__MAX_CACHED)
        self.max_shared = kwargs.get('maxshared',  self.__MAX_SHARED)
        self.blocking = kwargs.get('blocking', self.__BLOCKING)
        self.max_usage = kwargs.get('maxusage', self.__MAX_USAGE)
        self.set_session = kwargs.get('setsession', self.__SET_SESSION)
        self.reset = kwargs.get('reset', self.__RESET)

        '''
              验证pymysql的参数是否合法
        '''
        __py_mysql_pars = {}
        for k in self.PY_MYSQL_PARAMS:
            if kwargs.get(k) is not None:
                __py_mysql_pars[k] = kwargs.get(k)
        self.pymysql_params = __py_mysql_pars

