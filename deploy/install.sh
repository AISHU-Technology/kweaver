#!/bin/bash

HOST_EXP="^(([1-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([1-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$"
PORT_EXP="^[1-9]$|(^[1-9][0-9]$)|(^[1-9][0-9][0-9]$)|(^[1-9][0-9][0-9][0-9]$)|(^[1-5][0-9][0-9][0-9][0-9]$)|(^[6][0-5][0-5][0-3][0-5]$)"
EMPTY_EXP="^[\s\S]*.*[^\ ][\s\S]*$"
CONFIGDIR=./kwconfig
CONFIGFILE=./kwconfig/kwconfig.yaml
CONFIGBAK=./kwconfig/kwconfig.yaml.bak
SERVICENAME="aishu-kweaver"

function checkDockerComposeCli() {
  if [ ! -x "$(command -v docker-compose)" ]; then
    DOCKERCOMPOSE="docker compose"
  else
    DOCKERCOMPOSE="docker-compose"
  fi
}

function checkDockerComposeStatus() {
  var=`$DOCKERCOMPOSE ls | grep $SERVICENAME | wc -l`
  if [[  $var > 0 ]]; then
    PS3="You have a running kweaver docker compose, you can choose above choices: "
    select moption in "only stop service" "stop service and romove docker contain" "exit"
    do
      case $moption in
      "only stop service")
        $DOCKERCOMPOSE -p $SERVICENAME stop 
        break;;
      "stop service and romove docker contain")
        $DOCKERCOMPOSE -p $SERVICENAME down
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
  var=`$DOCKERCOMPOSE -p $SERVICENAME ps | wc -l`
  if [[ $var > 1 ]]; then
    PS3="You have a stoped kweaver docker compose, you can choose above choices: "
    select moption in "start service" "romove docker contain"
    do
      case $moption in
      "start service")
        $DOCKERCOMPOSE -p $SERVICENAME start
        exit 0;;
      "romove docker contain")
        $DOCKERCOMPOSE -p $SERVICENAME rm
        break;;
      *)
        echo "Incorrect input, please reselect.";;
      esac
    done
  fi
}

function checkServiceName() {
  var=`docker ps -a | grep -E 'kw-studio|kw-builder|kw-engine|kw-nginx|kw-mongodb|kw-mariadb|kw-redis|kw-algserver' | wc -l`
  if [[ $var > 0 ]]; then
    PS3="Container names has been used, you can remove them by above ways: "
    select option in "auto" "manual"
    do
      case $option in
      "auto")
        docker ps -a | grep kw | awk '{print $1}' | xargs docker rm
        break;;
      "manual")
        read -p "Remove containers munually, press anykey to continue." conti
        echo -e "\n"
        case $conti in
        *)
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
  dstatus=0
  while [ $dstatus = 0 ]
  do
    if [[ $3 ]] ; then
      read -s -p "$1" input
    else
      read -p "$1" input
    fi

    if [[ $input =~ $2 ]] ;then
      tempinput=$input
      dstatus+=1
    else
      echo "Incorrect input, please re-enter."
    fi
  done
}

clear
chmod 777 -R ./
checkDockerComposeCli
checkDockerComposeStatus
checkDockerComposeService
checkServiceName

read -p "Do you want to use the project's default database [Y/N]?  " answer
echo -e "\n"
case $answer in
(Y | y)
  echo "You selected yes,will use the project's default database."
  ;;
(N | n)
  function installyq() {
    if [ ! -x "$(command -v yq)" ]; then
      tar -zxf yq_linux_amd64.tar.gz && chmod +x yq_linux_amd64 && mv yq_linux_amd64 /usr/local/bin/yq
    fi
  }

  function operateWithYaml() {
    if [[ ! -d "$CONFIGDIR" ]]; then
      mkdir $CONFIGDIR
    fi
    if [[ ! -f "$CONFIGFILE" ]]; then
      OPERATETYPE="newtype"
      touch $CONFIGFILE
    else
      if [[ -f "$CONFIGBAK" ]]; then
        rm -rf $CONFIGBAK
      fi
      PS3="Find datebase config file, you can do above things: "
      select option in "edit config file" "create new config file"
      do
        case $option in
        "edit config file")
          OPERATETYPE="edittype"
          break;;
        "create new config file")
          OPERATETYPE="newtype"
          mv $CONFIGFILE $CONFIGBAK
          touch $CONFIGFILE
          chmod 777 $CONFIGFILE
          break;;
        *)
          echo "Incorrect input, please reselect.";;
        esac
      done
    fi  
  }

  function edityaml() {
    if [ $1 = "mariadb" ] || [ $1 = "mongodb" ]; then
      # mariadb & mongodb
      yq -i '."'$1'".host = "'$2'" | ."'$1'".port = '$3' | ."'$1'".user = "'$4'" | ."'$1'".password = "'$5'" | ."'$1'".database = "'$6'"' $CONFIGFILE
    else
      if [ $2 = "stand-alone" ]; then
        # redis stand-alone
        yq -i '."'$1'".mode = "'$2'" | ."'$1'".host = "'$3'" | ."'$1'".port = '$4' | ."'$1'".user = "'$5'" | ."'$1'".password = "'$6'"' $CONFIGFILE
        yq -i '(."'$1'".[] | select(. == "")) = ~' $CONFIGFILE
      elif [ $2 = "sentinel" ]; then
        # redis sentinel
        for (( i = 0; i < ${#sentineladd[*]}; i++ )); do
          yq -i '."'$1'".mode = "'$2'" | ."'$1'".master_name = "'$3'" | ."'$1'".["sentinel"] += [{"host":"'${sentineladd[$i]}'","port":'${sentinelport[$i]}'}] | ."'$1'".sentinel_user = "'$4'" | ."'$1'".sentinel_password = "'$5'" | ."'$1'".user = "'$6'" | ."'$1'".password = "'$7'"' $CONFIGFILE
        done
        yq -i '(."'$1'".[] | select(. == "")) = ~' $CONFIGFILE
      else
        # redis cluster
        yq -i '."'$1'".mode = "'$2'" | ."'$1'".["'$7'"] += [{"host":"'$3'","port":'$4',"user":"'$5'","password":"'$6'"}]' $CONFIGFILE
        yq -i '(."'$1'".[].[].[] | select(. == "")) = ~' $CONFIGFILE
      fi
    fi
  }

  function editdbconfig() {
    echo "Use your own $1 database."
    checkParameters "Enter your $1 host: " "$EMPTY_EXP"
    add=$tempinput
    checkParameters "Enter your $1 port: " "$PORT_EXP"
    port=$tempinput
    checkParameters "Enter your $1 account: " "$EMPTY_EXP"
    user=$tempinput
    checkParameters "Enter your $1 password: " "$EMPTY_EXP" "-s"
    pwd=$tempinput
    echo -e "\r"
    checkParameters "Enter your $1 database: " "$EMPTY_EXP"
    db=$tempinput
    echo -e "\n"
    # mariadb & mongodb parameters: $1:db $2:host $3:port $4:account $5:password $6:dbname
    edityaml $1 $add $port $user $pwd $db
  }

  function configredis() {
    case $1 in
    standalone)
      checkParameters "Enter your redis host: " "$EMPTY_EXP"
      add=$tempinput
      checkParameters "Enter your redis port: " "$PORT_EXP"
      port=$tempinput
      checkParameters "Enter your redis account: " ""
      user=$tempinput
      checkParameters "Enter your redis password: " "" "-s"
      pwd=$tempinput
      echo -e "\n"
      # redis standalone parameters: $1:db $2:mode $3:host $4:port $5:account $6:password $7:dbname
      edityaml redis stand-alone $add $port "$user" "$pwd"
      ;;
    sentinel)
      checkParameters "Enter sentinel mode redis master node name: " "$EMPTY_EXP"
      master=$tempinput
      checkParameters "Enter sentinel mode redis sentinel account: " ""
      suser=$tempinput
      checkParameters "Enter sentinel mode redis sentinel password: " "" "-s"
      spwd=$tempinput
      echo -e "\r"
      checkParameters "Enter sentinel mode redis account: " ""
      user=$tempinput
      checkParameters "Enter sentinel mode redis password: " "" "-s"
      pwd=$tempinput
      echo -e "\n"
      # redis sentinel parameters: $1:db $2:mode $3:master name $4:sentinel account $5:sentinel password $6:db account $7:db password
      edityaml redis sentinel $master "$suser" "$spwd" "$user" "$pwd"
      ;;
    cluster)
      sname=''
      if [ $2 = "master" ]; then
        sname="master_$3 node"
      else
        sname="slave_$3 node"
      fi
      checkParameters "Enter cluster mode redis $sname host: " "$EMPTY_EXP"
      add=$tempinput
      checkParameters "Enter cluster mode redis $sname port: " "$PORT_EXP"
      port=$tempinput
      checkParameters "Enter cluster mode redis $sname account: " ""
      user=$tempinput
      checkParameters "Enter cluster mode redis $sname password: " "" "-s"
      pwd=$tempinput
      echo -e "\n"
      # redis cluster parameters: $1:db $2:mode $3:host $4:port $5:account $6:password $8:-node type
      edityaml redis cluster $add $port "$user" "$pwd" $2
      ;;
    esac
  }

  function sentinelnodeconfig() {
    dstatus=0
    while [ $dstatus = 0 ]
    do
      read -p "Enter sentinel mode redis sentinel node number: " sentinelnu
      if [ $sentinelnu -ge 1 ] 2>/dev/null ;then
      for ((i=1; i<=$sentinelnu; i++))
        do
          sentinelarr $i
          if [ $i -eq $sentinelnu ]; then
            configredis sentinel
            dstatus+=1
          fi
        done
      else
        echo "Sentinel nodes must be at least 1, please re-enter."
      fi
    done
  }

  function sentinelarr() {
    checkParameters "Enter sentinel mode redis sentinel_$1 host: " "$EMPTY_EXP"
    add=$tempinput
    checkParameters "Enter sentinel mode redis sentinel_$1 port: " "$PORT_EXP"
    port=$tempinput
    echo -e "\n"
    index=`expr $1 - 1`
    sentineladd[$index]=$add
    sentinelport[$index]=$port
  }

  function redis_cluster {
    dstatus=0
    while [ $dstatus = 0 ]
    do
      read -p "Enter cluster mode redis master node number: " masternu
      read -p "Enter cluster mode redis slave node number: " slavenu
      if [ "$masternu" -gt 0 ] 2>/dev/null && [ "$slavenu" -ge 0 ] 2>/dev/null;then
      number=`expr $masternu + $slavenu`
      for ((i=1; i<=$number; i++))
        do
          if [ $i -le $masternu ]; then
            configredis cluster master $i
          else
            configredis cluster slave `expr $i - $masternu`
          fi
          if [ $i -eq $number ]; then
            dstatus+=1
          fi
        done
      else
        echo "Incorrect input, please re-enter."
      fi
    done
  }

  installyq

  operateWithYaml

  if [ $OPERATETYPE = "newtype" ]; then
    editdbconfig mariadb
    editdbconfig mongodb
    PS3="Choose your reids deployment mode: "
    select option in "stand-alone mode" "sentinel mode"
    # select option in "stand-alone mode" "sentinel mode" "cluster mode"
    do
      case $option in
      "stand-alone mode")
        configredis standalone
        break;;
      "sentinel mode")
        sentineladd=()
        sentinelport=()
        sentinelnodeconfig
        break;;
      # "cluster mode")
      #   redis_cluster
      #   break;;
      *)
        echo "Incorrect input, please reselect.";;
      esac
    done
  else
    read -p "Edit the database config file manually, press anykey begin to edit." conti
    echo -e "\n"
    case $conti in
    (*)
      vi $CONFIGFILE
      break
      ;;
    esac
  fi
  ;;
(*)
  echo "You have selected an unknown option, will use the project's default database.";;
esac

# 

function dockercomposeinit() {
  # edit nginx config
  checkParameters "Enter the host that you want to deploy kweaver: " "$EMPTY_EXP"
  sed -i '/.*server_name*./c\server_name  '"$tempinput"';' ./nginx/nginx.conf
  $DOCKERCOMPOSE -p $SERVICENAME -f $1 up -d
}

function checkeditports() {
  pIDa=`lsof -i :$1 | grep -v "PID" | awk '{print $2}'`
  if [[ "$pIDa" != "" ]];then
    echo "port $1 has been used, you should edit ./docker-compose-$2.yaml"
    if [[ $3 != "" ]];then
      echo "port $1 has been used, you should edit ./nginx/nginx.conf"
    fi
  fi
}

function basicoperation() {
  # check ports kw-nginx:80 kw-studio:6800 kw-builder:6475 kw-algserver:8080 kw-engine:6474
  checkeditports 80 "basic" "nginx"
  checkeditports 6800 "basic" "nginx"
  checkeditports 6475 "basic" "nginx"
  checkeditports 8080 "basic" ""
  checkeditports 6474 "basic" "nginx"
  dockercomposeinit ./docker-compose-basic.yaml
}

function advanceoperation() {
  # check ports kw-nginx:80 kw-mariadb:3307 kw-redis:6378 kw-mongodb:27018 kw-studio:6800 kw-builder:6475 kw-algserver:8080 kw-engine:6474
  checkeditports 80 "advance" "nginx"
  checkeditports 3307 "advance" ""
  checkeditports 6378 "advance" ""
  checkeditports 27018 "advance" ""
  checkeditports 6800 "advance" "nginx"
  checkeditports 6475 "advance" "nginx"
  checkeditports 8080 "advance" ""
  checkeditports 6474 "advance" "nginx"
  dockercomposeinit ./docker-compose-advance.yaml
}

if [[ $answer = "N" ]]||[[ $answer = "n" ]];then
  clear
  cat $CONFIGFILE
  read -p "Confirm that your database config is correct. [Y/N]?  " confirm
  echo -e "\n"
  case $confirm in
  (Y | y)
    basicoperation
    ;;
  (N | n)
    read -p "Edit the database config file manually, press anykey begin to edit." conti
    echo -e "\n"
    case $conti in
    (*)
      vi $CONFIGFILE
      basicoperation
      break
      ;;
    esac      
    ;;
  (*)
    echo "You have selected an unknown option, will continue."
    basicoperation
    ;;
  esac
else
  advanceoperation
fi