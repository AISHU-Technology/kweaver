host = "10.4.106.255"
port = 3320
user = "anydata"
password = "Qwe123!@#"
database = "anydata"

# 是否打开mysql 日志
mysql_log_open = True

pooled_db_config = {
    'maxconnections': 3,
    'mincached': 1,
    'maxcached': 2,
    'maxshared': 3,
    'blocking': True,
}