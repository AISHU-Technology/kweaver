PORT_EXP="^[1-9]$|(^[1-9][0-9]$)|(^[1-9][0-9][0-9]$)|(^[1-9][0-9][0-9][0-9]$)|(^[1-5][0-9][0-9][0-9][0-9]$)|(^[6][0-5][0-5][0-3][0-5]$)"
EMPTY_EXP="^[\s\S]*.*[^\ ][\s\S]*$"
CONFIG_DIR=/kweaver/deploy/kw-k8s/conf/kwconfig
CONFIG_FILE=/kweaver/deploy/kw-k8s/conf/kwconfig/kwconfig.yaml
CONFIG_BAK=/kweaver/deploy/kw-k8s/conf/kwconfig/kwconfig.yaml.bak

installYQ(){
  if [ ! -x "$(command -v yq)" ]; then
    tar -zxf /kweaver/deploy/kw-k8s/conf/yq_linux_amd64.tar.gz -C /kweaver/deploy/kw-k8s/conf/ && chmod +x /kweaver/deploy/kw-k8s/conf/yq_linux_amd64 && mv /kweaver/deploy/kw-k8s/conf/yq_linux_amd64 /usr/local/bin/yq
  fi
}

checkParameters() {
  exitStatus=0
  while [ $exitStatus = 0 ]
  do
    if [[ $3 ]] ; then
      read -r -s -p "$1" input
    else
      read -r -p "$1" input
    fi

    if [[ $input =~ $2 ]] ;then
      tempInput=$input
      exitStatus+=1
    else
	  echo -en "\033[31;1mThe input is incorrect, please try again.\n\033[0m"
    fi
  done
}

customMode() {
	if [[ ! -d "$CONFIG_DIR" ]]; then
	  mkdir $CONFIG_DIR
	fi
	if [[ ! -f "$CONFIG_FILE" ]]; then
	  OPERATE_TYPE="new_type"
	  touch $CONFIG_FILE
	else
	  if [[ -f "$CONFIG_BAK" ]]; then
		rm -rf $CONFIG_BAK
	  fi
	  for((;;))
      do
		echo -en "\033[32;1m\n1-Edit DB config file\n\033[0m"
		echo -en "\033[32;1m2-Create DB new config file\n\033[0m"
		echo -en "\033[32;1mFind the default configuration file, please select a custom mode: [1-2]: \033[0m"
		read type
		if [ "$type" == "1" ];then
	      OPERATE_TYPE="edit_type"
		  break
		elif [ "$type" == "2" ];then
		  OPERATE_TYPE="new_type"
		  mv $CONFIG_FILE $CONFIG_BAK
		  touch $CONFIG_FILE
		  chmod 777 $CONFIG_FILE
		  break
		else
		  echo -en "\033[31;1mPlease enter the correct mode number.\n\033[0m"
		fi
	  done
	fi  
}

editYaml() {
	if [ "$1" = "mariadb" ] || [ "$1" = "mongodb" ]; then
	  # mariadb & mongodb
	  yq -i '."'"$1"'".host = "'"$2"'" | ."'"$1"'".port = '"$3"' | ."'"$1"'".user = "'"$4"'" | ."'"$1"'".password = "'"$5"'" | ."'"$1"'".database = "'"$6"'"' $CONFIG_FILE
	else
	  if [ "$2" = "stand-alone" ]; then
        # redis stand-alone
        yq -i '."'"$1"'".mode = "'"$2"'" | ."'"$1"'".host = "'"$3"'" | ."'"$1"'".port = '"$4"' | ."'"$1"'".user = "'"$5"'" | ."'"$1"'".password = "'"$6"'"' $CONFIG_FILE
        yq -i '(."'"$1"'".[] | select(. == "")) = ~' $CONFIG_FILE
      elif [ "$2" = "sentinel" ]; then
        # redis sentinel
        for (( i = 0; i < ${#sentinel_add[*]}; i++ )); do
          yq -i '."'"$1"'".mode = "'"$2"'" | ."'"$1"'".master_name = "'"$3"'" | ."'"$1"'".["sentinel"] += [{"host":"'"${sentinel_add[$i]}"'","port":'"${sentinel_port[$i]}"'}] | ."'"$1"'".sentinel_user = "'"$4"'" | ."'"$1"'".sentinel_password = "'"$5"'" | ."'"$1"'".user = "'"$6"'" | ."'"$1"'".password = "'"$7"'"' $CONFIG_FILE
        done
        yq -i '(."'"$1"'".[] | select(. == "")) = ~' $CONFIG_FILE
      else
        # redis cluster
        yq -i '."'"$1"'".mode = "'"$2"'" | ."'"$1"'".["'"$7"'"] += [{"host":"'"$3"'","port":'"$4"',"user":"'"$5"'","password":"'"$6"'"}]' $CONFIG_FILE
        yq -i '(."'"$1"'".[].[].[] | select(. == "")) = ~' $CONFIG_FILE
      fi
	fi
}

editDBConfig() {
	echo "Configure custom $1 database:"
	checkParameters "Enter $1 host: " "$EMPTY_EXP"
	add=$tempInput
	checkParameters "Enter $1 port: " "$PORT_EXP"
	port=$tempInput
	checkParameters "Enter $1 account: " "$EMPTY_EXP"
	user=$tempInput
	checkParameters "Enter $1 password: " "$EMPTY_EXP" "-s"
	pwd=$tempInput
	echo -e "\r"
	checkParameters "Enter $1 database: " "$EMPTY_EXP"
	db=$tempInput
	echo -e "\n"
	# mariadb & mongodb parameters: $1:db $2:host $3:port $4:account $5:password $6:dbname
	editYaml "$1" "$add" "$port" "$user" "$pwd" "$db"
}

editRedisConfig() {
	echo "Configure custom $1 database:"
	case $1 in
    standalone)
      checkParameters "Enter redis host: " "$EMPTY_EXP"
      add=$tempInput
      checkParameters "Enter redis port: " "$PORT_EXP"
      port=$tempInput
      checkParameters "Enter redis account: " ""
      user=$tempInput
      checkParameters "Enter redis password: " "" "-s"
      pwd=$tempInput
      echo -e "\n"
      # redis standalone parameters: $1:db $2:mode $3:host $4:port $5:account $6:password $7:dbname
      editYaml redis stand-alone "$add" "$port" "$user" "$pwd"
      ;;
    sentinel)
      checkParameters "Enter sentinel mode redis master node name: " "$EMPTY_EXP"
      master=$tempInput
      checkParameters "Enter sentinel mode redis sentinel account: " ""
      sentinel_user=$tempInput
      checkParameters "Enter sentinel mode redis sentinel password: " "" "-s"
      sentinel_pwd=$tempInput
      echo -e "\r"
      checkParameters "Enter sentinel mode redis account: " ""
      user=$tempInput
      checkParameters "Enter sentinel mode redis password: " "" "-s"
      pwd=$tempInput
      echo -e "\n"
      # redis sentinel parameters: $1:db $2:mode $3:master name $4:sentinel account $5:sentinel password $6:db account $7:db password
      editYaml redis sentinel "$master" "$sentinel_user" "$sentinel_pwd" "$user" "$pwd"
      ;;
    esac
}

  function sentinelNodeConfig() {
    exitStatus=0
    while [ $exitStatus = 0 ]
    do
      read -r -p "Enter sentinel mode redis sentinel node number: " sentinelnu
      if [ "$sentinelnu" -ge 1 ] 2>/dev/null ;then
      for ((i=1; i<=sentinelnu; i++))
        do
          sentinelArr "$i"
          if [ "$i" -eq "$sentinelnu" ]; then
            editRedisConfig sentinel
            exitStatus+=1
          fi
        done
      else
        echo "Sentinel nodes must be at least 1, please re-enter."
      fi
    done
  }

  function sentinelArr() {
    checkParameters "Enter sentinel mode redis sentinel_$1 host: " "$EMPTY_EXP"
    add=$tempInput
    checkParameters "Enter sentinel mode redis sentinel_$1 port: " "$PORT_EXP"
    port=$tempInput
    echo -e "\n"
    index=$(($1 - 1))
    sentinel_add[$index]=$add
    sentinel_port[$index]=$port
  }
  
operateWithYaml(){
  if [ $OPERATE_TYPE = "new_type" ]; then
  
    installYQ
  
    editDBConfig mariadb
    editDBConfig mongodb
	
	for((;;))
	do
		echo -en "\033[32;1m\n1-stand-alone mode\n\033[0m"
		echo -en "\033[32;1m2-sentinel mode\n\033[0m"
		echo -en "\033[32;1mPlease choose redis deploy mode[1-2]: \033[0m"
		read mode
		if [ "$mode" == "1" ];then
		  editRedisConfig standalone
          break
		elif [ "$mode" == "2" ];then
		  sentinel_add=()
          sentinel_port=()
          sentinelNodeConfig
		  break
		fi
		echo -en "\033[31;1mPlease enter the correct mode number.\n\033[0m"
	done
  else
    read -r -p "The configuration file is modified successfully, press any key to continue." conti
    echo -e "\n"
    case $conti in
    (*)
      vi $CONFIG_FILE
      ;;
    esac
  fi
}
install(){
  customMode
  operateWithYaml

  for nodeIp in `kubectl get nodes -o wide | awk 'NR>1{print $6}'`
  do
	  self=$(ifconfig -a|grep inet|grep -v 127.0.0.1|grep -v inet6|awk '{print $2}'|tr -d "addr:")
	  self=$(echo "$self" | grep $nodeIp)
	  if [ "$self" == "" ];then
		  ssh root@$nodeIp "mkdir /kweaver/deploy/kw-k8s/conf ">> /kweaver/deploy/kw-k8s/log/install.log 2>&1
		  scp -r /kweaver/deploy/kw-k8s/conf/kwconfig/* root@$nodeIp:/kweaver/deploy/kw-k8s/conf/kwconfig >> /kweaver/deploy/kw-k8s/log/install.log 2>&1
    fi
  done

}
  
install
