# -*-coding:utf-8-*-
# @Time    : 2020/9/29 17:50
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn

from pyorient import OrientSocket

class PySocket(OrientSocket):
    def __init__(self, host, port, protocol=36, timeout=300):
        """
        Override OrientSocket protocol version number
        to fix PyOrientWrongProtocolVersionException where:
            'Protocol version 37 is not supported yet by this client.'
        """
        super(PySocket, self).__init__(host, port)
        self.protocol = protocol
        self.host = host
        self.port = port
        self.timeout = timeout

    def connect(self):
        """
        Override OrientSocket connect method
        to fix PyOrientWrongProtocolVersionException where:
            'Protocol version 37 is not supported yet by this client.'
        """

        self._socket.settimeout(self.timeout)
        self._socket.connect( (self.host, self.port) )
        _value = self._socket.recv(2)

        if len(_value) != 2:
            self._socket.close()

        self.connected = True