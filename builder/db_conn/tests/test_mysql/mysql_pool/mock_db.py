"""This module serves as a mock object for the DB-API 2 module"""

threadsafety = 2


class Error(Exception):
    pass


class DatabaseError(Error):
    pass


class OperationalError(DatabaseError):
    pass


class InterfaceError(DatabaseError):
    pass


class InternalError(DatabaseError):
    pass


class ProgrammingError(DatabaseError):
    pass


def connect(database=None, user=None):
    return Connection(database, user)


class Connection:

    has_ping = False
    num_pings = 0

    def __init__(self, database=None, user=None):
        self.database = database
        self.user = user
        self.valid = False
        if database == 'error':
            raise OperationalError
        self.open_cursors = 0
        self.num_uses = 0
        self.num_queries = 0
        self.num_pings = 0
        self.session = []
        self.valid = True

    def close(self):
        if not self.valid:
            raise InternalError
        self.open_cursors = 0
        self.num_uses = 0
        self.num_queries = 0
        self.session = []
        self.valid = False

    def commit(self):
        if not self.valid:
            raise InternalError
        self.session.append('commit')

    def rollback(self):
        if not self.valid:
            raise InternalError
        self.session.append('rollback')

    def ping(self):
        cls = self.__class__
        cls.num_pings += 1
        if not cls.has_ping:
            raise AttributeError
        if not self.valid:
            raise OperationalError

    def cursor(self, name=None):
        if not self.valid:
            raise InternalError
        return Cursor(self, name)


class Cursor:

    def __init__(self, con, name=None):
        self.con = con
        self.valid = False
        if name == 'error':
            raise OperationalError
        self.result = None
        self.inputsizes = []
        self.outputsizes = {}
        con.open_cursors += 1
        self.valid = True

    def close(self):
        if not self.valid:
            raise InternalError
        self.con.open_cursors -= 1
        self.valid = False

    def execute(self, operation):
        if not self.valid or not self.con.valid:
            raise InternalError
        self.con.num_uses += 1
        if operation.startswith('select '):
            self.con.num_queries += 1
            self.result = operation[7:]
        elif operation.startswith('set '):
            self.con.session.append(operation[4:])
            self.result = None
        elif operation == 'get sizes':
            self.result = (self.inputsizes, self.outputsizes)
            self.inputsizes = []
            self.outputsizes = {}
        else:
            raise ProgrammingError

    def fetchone(self):
        if not self.valid:
            raise InternalError
        result = self.result
        self.result = None
        return result

    def callproc(self, procname):
        if not self.valid or not self.con.valid or not procname:
            raise InternalError
        self.con.num_uses += 1

    def setinputsizes(self, sizes):
        if not self.valid:
            raise InternalError
        self.inputsizes = sizes

    def setoutputsize(self, size, column=None):
        if not self.valid:
            raise InternalError
        self.outputsizes[column] = size

    def __del__(self):
        if self.valid:
            self.close()