#!/bin/bash

#HOST_EXP="^(([1-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([1-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$"
PORT_EXP="^[1-9]$|(^[1-9][0-9]$)|(^[1-9][0-9][0-9]$)|(^[1-9][0-9][0-9][0-9]$)|(^[1-5][0-9][0-9][0-9][0-9]$)|(^[6][0-5][0-5][0-3][0-5]$)"
EMPTY_EXP="^[\s\S]*.*[^\ ][\s\S]*$"
CONFIG_DIR=./kwconfig
CONFIG_FILE=./kwconfig/kwconfig.yaml
CONFIG_BAK=./kwconfig/kwconfig.yaml.bak
SERVICE_NAME="aishu-kweaver"

function checkCliTools() {
  cliStatus=0
  if [ ! -x "$(command -v docker-compose)" ]&&[ -z "$(docker compose version)" ]; then
    echo "You must to install docker compose."
    cliStatus+=1
  fi
  if [ ! -x "$(command -v docker)" ]; then
    echo "You must to install docker."
    cliStatus+=1
  fi
  if [ $cliStatus -gt 0 ]; then
    exit 0
  fi
}

function checkDockerComposeCli() {
  if [ ! -x "$(command -v docker-compose)" ]; then
    DOCKER_COMPOSE="docker compose"
  else
    DOCKER_COMPOSE="docker-compose"
  fi
}

function checkDockerComposeStatus() {
  var=$($DOCKER_COMPOSE ls | grep -c $SERVICE_NAME)
  if [[  $var -gt 0 ]]; then
    PS3="You have a running docker compose service named aishu-kweaver, you can choose above choices: "
    select moption in "only stop service" "stop service and remove docker containers" "exit"
    do
      case $moption in
      "only stop service")
        $DOCKER_COMPOSE -p $SERVICE_NAME stop
        break;;
      "stop service and remove docker containers")
        $DOCKER_COMPOSE -p $SERVICE_NAME down
        break;;
      "exit")
        exit 0;;
      *)
        echo "Incorrect input, please reselect.";;
      esac
    done
  fi
}

function checkDockerComposeService() {
  var=$($DOCKER_COMPOSE -p $SERVICE_NAME ps | wc -l)
  if [[ $var -gt 1 ]]; then
    PS3="You have a stopped docker compose service named aishu-kweaver, you can choose above choices: "
    select moption in "start service and exit" "start service with edited config file and exit" "remove docker containers"
    do
      case $moption in
      "start service and exit")
        $DOCKER_COMPOSE -p $SERVICE_NAME start
        exit 0;;
      "start service with edited config file and exit")
        vi $CONFIG_FILE
        $DOCKER_COMPOSE -p $SERVICE_NAME start
        exit 0;;
      "remove docker containers")
        $DOCKER_COMPOSE -p $SERVICE_NAME rm
        break;;
      *)
        echo "Incorrect input, please reselect.";;
      esac
    done
  fi
}

function checkServiceName() {
  var=$(docker ps -a | grep -cE 'kw-studio|kw-builder|kw-engine|kw-nginx|kw-mongodb|kw-mariadb|kw-redis|kw-algserver')
  if [[ $var -gt 0 ]]; then
    serviceNames=$(docker ps -a | grep -Eo 'kw-studio|kw-builder|kw-engine|kw-nginx|kw-mongodb|kw-mariadb|kw-redis|kw-algserver' | awk '{{printf"%s/",$0}}' | sed 's/.$//g')
    PS3="Container names $serviceNames has been used, you can remove them by above ways: "
    select option in "auto" "manual"
    do
      case $option in
      "auto")
        docker ps -a | grep kw | awk '{print $1}' | xargs docker rm
        checkServiceName
        break;;
      "manual")
        read -r -p "Remove containers manually, press any key to continue." conti
        echo -e "\n"
        case $conti in
        *)
          checkServiceName
          break
          ;;
        esac
        ;;
      *)
        echo "Incorrect input, please reselect.";;
      esac
    done
  fi
}

function checkParameters() {
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
      echo "Incorrect input, please re-enter."
    fi
  done
}

clear
chmod 777 -R ./
checkCliTools
checkDockerComposeCli
checkDockerComposeStatus
checkDockerComposeService
checkServiceName

read -r -p "Do you want to use the project's default database [Y/N]?  " answer
echo -e "\n"
case $answer in
(Y | y)
  echo "You selected yes,will use the project's default database."
  ;;
(N | n)
  function installYQ() {
    if [ ! -x "$(command -v yq)" ]; then
      tar -zxf yq_linux_amd64.tar.gz && chmod +x yq_linux_amd64 && mv yq_linux_amd64 /usr/local/bin/yq
    fi
  }

  function operateWithYaml() {
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
      PS3="Find database config file, you can do above things: "
      select option in "edit config file" "create new config file"
      do
        case $option in
        "edit config file")
          OPERATE_TYPE="edit_type"
          break;;
        "create new config file")
          OPERATE_TYPE="new_type"
          mv $CONFIG_FILE $CONFIG_BAK
          touch $CONFIG_FILE
          chmod 777 $CONFIG_FILE
          break;;
        *)
          echo "Incorrect input, please reselect.";;
        esac
      done
    fi  
  }

  function editYaml() {
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

  function editDBConfig() {
    echo "Use your own $1 database."
    checkParameters "Enter your $1 host: " "$EMPTY_EXP"
    add=$tempInput
    checkParameters "Enter your $1 port: " "$PORT_EXP"
    port=$tempInput
    checkParameters "Enter your $1 account: " "$EMPTY_EXP"
    user=$tempInput
    checkParameters "Enter your $1 password: " "$EMPTY_EXP" "-s"
    pwd=$tempInput
    echo -e "\r"
    checkParameters "Enter your $1 database: " "$EMPTY_EXP"
    db=$tempInput
    echo -e "\n"
    # mariadb & mongodb parameters: $1:db $2:host $3:port $4:account $5:password $6:dbname
    editYaml "$1" "$add" "$port" "$user" "$pwd" "$db"
  }

  function configRedis() {
    case $1 in
    standalone)
      checkParameters "Enter your redis host: " "$EMPTY_EXP"
      add=$tempInput
      checkParameters "Enter your redis port: " "$PORT_EXP"
      port=$tempInput
      checkParameters "Enter your redis account: " ""
      user=$tempInput
      checkParameters "Enter your redis password: " "" "-s"
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
    cluster)
      sentinel_name=''
      if [ "$2" = "master" ]; then
        sentinel_name="master_$3 node"
      else
        sentinel_name="slave_$3 node"
      fi
      checkParameters "Enter cluster mode redis $sentinel_name host: " "$EMPTY_EXP"
      add=$tempInput
      checkParameters "Enter cluster mode redis $sentinel_name port: " "$PORT_EXP"
      port=$tempInput
      checkParameters "Enter cluster mode redis $sentinel_name account: " ""
      user=$tempInput
      checkParameters "Enter cluster mode redis $sentinel_name password: " "" "-s"
      pwd=$tempInput
      echo -e "\n"
      # redis cluster parameters: $1:db $2:mode $3:host $4:port $5:account $6:password $8:-node type
      editYaml redis cluster "$add" "$port" "$user" "$pwd" "$2"
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
            configRedis sentinel
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

  function redis_cluster {
    exitStatus=0
    while [ $exitStatus = 0 ]
    do
      read -r -p "Enter cluster mode redis master node number: " masternu
      read -r -p "Enter cluster mode redis slave node number: " slavenu
      if [ "$masternu" -gt 0 ] 2>/dev/null && [ "$slavenu" -ge 0 ] 2>/dev/null;then
      number=$((masternu + slavenu))
      for ((i=1; i<=number; i++))
        do
          if [ "$i" -le "$masternu" ]; then
            configRedis cluster master "$i"
          else
            configRedis cluster slave $((i - masternu))
          fi
          if [ "$i" -eq "$number" ]; then
            exitStatus+=1
          fi
        done
      else
        echo "Incorrect input, please re-enter."
      fi
    done
  }

  installYQ

  operateWithYaml

  if [ $OPERATE_TYPE = "new_type" ]; then
    editDBConfig mariadb
    editDBConfig mongodb
    PS3="Choose your redis deployment mode: "
    select option in "stand-alone mode" "sentinel mode"
    # select option in "stand-alone mode" "sentinel mode" "cluster mode"
    do
      case $option in
      "stand-alone mode")
        configRedis standalone
        break;;
      "sentinel mode")
        sentinel_add=()
        sentinel_port=()
        sentinelNodeConfig
        break;;
      # "cluster mode")
      #   redis_cluster
      #   break;;
      *)
        echo "Incorrect input, please reselect.";;
      esac
    done
  else
    read -r -p "Edit the database config file manually, press any key begin to edit." conti
    echo -e "\n"
    case $conti in
    (*)
      vi $CONFIG_FILE
      ;;
    esac
  fi
  ;;
(*)
  echo "You have selected an unknown option, will use the project's default database.";;
esac

# 

function dockerComposeInit() {
  # edit nginx config
  checkParameters "Enter the host that you want to deploy aishu-kweaver: " "$EMPTY_EXP"
  sed -i '/.*server_name*./c\server_name  '"$tempInput"';' ./nginx/nginx.conf
  # edit compose yaml
  yq -i '.services.kw-builder.extra_hosts = [{"kwhost":"'"$tempInput"'"}]' "$1"
  $DOCKER_COMPOSE -p $SERVICE_NAME -f "$1" up -d
}

function checkEditPorts() {
  pIDa=$(lsof -i :"$1" | grep -v "PID" | awk '{print $2}')
  if [[ "$pIDa" != "" ]];then
    echo "port $1 needs by docker compose has been used, you should free the port"
    if [[ $3 != "" ]];then
      echo "port $1 needs by nginx has been used, you should free the port"
    fi
  fi
}

function checkPorts() {
    # check ports kw-nginx:80 kw-studio:6800 kw-builder:6475 kw-algserver:8080 kw-engine:6474
    nginx=$(checkEditPorts 80 "$1" "nginx")
    if [[ $nginx != "" ]]; then
        echo "$nginx"
        return 1
    fi
    studio=$(checkEditPorts 6800 "$1" "nginx")
    if [[ $studio != "" ]]; then
        echo "$studio"
        return 1
    fi
    builder=$(checkEditPorts 6475 "$1" "nginx")
    if [[ $builder != "" ]]; then
        echo "$builder"
        return 1
    fi
    algserver=$(checkEditPorts 8080 "$1" "")
    if [[ $algserver != "" ]]; then
        echo "$algserver"
        return 1
    fi
    engine=$(checkEditPorts 6474 "$1" "nginx")
    if [[ $engine != "" ]]; then
        echo "$engine"
        return 1
    fi
    if [ "$1" = "advance" ]; then
      # check ports kw-mariadb:3307 kw-redis:6378 kw-mongodb:27018
      mariadb=$(checkEditPorts 3307 "$1" "")
      if [[ $mariadb != "" ]]; then
          echo "$mariadb"
          return 1
      fi
      redis=$(checkEditPorts 6378 "$1" "")
      if [[ $redis != "" ]]; then
          echo "$redis"
          return 1
      fi
      mongodb=$(checkEditPorts 27018 "$1" "")
      if [[ $mongodb != "" ]]; then
          echo "$mongodb"
          return 1
      fi
    fi

}

function basicOperation() {
  temp=$(checkPorts "basic")
  if [[ $temp != "" ]]; then
      echo "$temp"
      read -r -p "Free the port manually, press any key to continue." conti
      echo -e "\n"
      case $conti in
      (*)
        basicOperation
        ;;
      esac
  else
   dockerComposeInit ./docker-compose-basic.yaml
  fi
}

function advanceOperation() {
  temp=$(checkPorts "advance")
  if [[ $temp != "" ]]; then
    echo "$temp"
    read -r -p "Free the port manually, press any key to continue." conti
    echo -e "\n"
    case $conti in
    (*)
      advanceOperation
      ;;
    esac
  else
   dockerComposeInit ./docker-compose-advance.yaml
  fi
}

if [[ $answer = "N" ]]||[[ $answer = "n" ]];then
  clear
  cat $CONFIG_FILE
  read -r -p "Confirm that your database config is correct. [Y/N]?  " confirm
  echo -e "\n"
  case $confirm in
  (Y | y)
    basicOperation
    ;;
  (N | n)
    read -r -p "Edit the database config file manually, press any key begin to edit." conti
    echo -e "\n"
    case $conti in
    (*)
      vi $CONFIG_FILE
      basicOperation
      ;;
    esac      
    ;;
  (*)
    echo "You have selected an unknown option, will continue."
    basicOperation
    ;;
  esac
else
  advanceOperation
fi