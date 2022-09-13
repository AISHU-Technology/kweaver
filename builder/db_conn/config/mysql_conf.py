host = "10.4.128.208"
port = 3306
user = "root"
password = "anydata123"
database = "test_anydata"

# 是否打开mysql 日志
mysql_log_open = True

pooled_db_config = {
    'maxconnections': 3,
    'mincached': 1,
    'maxcached': 2,
    'maxshared': 3,
    'blocking': True,
}