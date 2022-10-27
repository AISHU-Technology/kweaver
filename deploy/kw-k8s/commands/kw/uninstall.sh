#!/bin/bash


Exit() {
  if [ $1 -ne 0 ];then
     echo -en "\033[31;1m$2\n\033[0m"
     exit $1
  fi
}

CheckSuccess() {
  if [ ${#} -eq 1 ] && [ $1 -ne 0 ];then
    exit 2
  fi
  if [ $1 -ne 0 ];then
    echo -en "\033[31;1m$2 failed,please see the'/kweaver/deploy/kw-k8s/log/uninstall.log'\n\033[0m"
    exit 2
  else
    echo -en "\033[32;1m$2 success\n\033[0m"
  fi

}

#Check whether k8s is available
r=$(curl -k -s https://"$(kubectl describe  pod kube-apiserver -n kube-system 2>/dev/null | grep Liveness | head -n1 | awk '{print $3}' | cut -f3 -d '/')"/healthz)
if [ "$r" == "ok" ];then
  helm list >/dev/null 2>&1
  Exit $? "K8s unavailable!"
else
  Exit 1 "K8s unavailable!"
fi

if [ ! -x "$(command -v docker)" ]; then
	echo -en "\033[31;1mdocker unavailable, please install docker.\n\033[0m"
	exit 0
fi

for nodeIp in `kubectl get nodes -o wide | awk 'NR>1{print $6}'`;
do
  #Each node creates a log directory
  ssh root@$nodeIp mkdir -p /kweaver/deploy/kw-k8s/log/
done

studio=`helm list | grep kw-studio | awk '{print $1}'`
algserver=`helm list | grep kw-algserver | awk '{print $1}'`
builder=`helm list | grep kw-builder | awk '{print $1}'`
engine=`helm list | grep kw-engine | awk '{print $1}'`
ingress=`helm list | grep kw-ingress-nginx | awk '{print $1}'`
installed_services="${studio} ${algserver} ${builder} ${engine} ${ingress}"

DeleteRelease() {
  helm del --purge $1 >> /kweaver/deploy/kw-k8s/log/uninstall.log 2>&1
  if [ $? -eq 0 ];then
    echo -en "\033[32;1m\n$1 uninstall success\033[0m"
  else
    echo -en "\033[31;1m\n$1 uninstall failed\033[0m"
  fi
}

index=1
arr=()
for service in $installed_services;
do
  arr[$((index-1))]=$service
  index=$((index + 1))
done
errorMsg=""
for ((;;));do
  index=1
  installed_str=""
  for service in ${arr[@]};
  do
    if [ "$installed_str" == "" ];then
      installed_str="${index}: $service"
    else
      installed_str="${installed_str}\n${index}: $service"
    fi
    index=$((index + 1))
  done
  idQueue=()
  for ((i=1;i<=${#arr[@]};i++));
  do
    idQueue[$((i-1))]=$i
  done
  if [ "$installed_str" == "" ];then
    echo -e "\033[31;1m\nNo KWeaver component service is running in the current cluster, exit the current program.\033[0m"
    exit
  else
    echo -e "\033[32;1mThe currently installed KWeaver components are as follows:\n${installed_str}\n\033[0m"
  fi
  if [ "$errorMsg" != "" ];then
    echo -e ${errorMsg}
  fi
  echo -en "\033[34;1mPlease enter the KWeaver component service tag to delete([0-${idQueue[-1]}], 0 means delete all KWeaver services)\033[0m: "
  read num
  expr $num "+" 10 &> /dev/null
  if [ $? -ne 0 ] || [ "$num" == "" ];then
    errorMsg="\033[31;1mThe number entered is incorrect, please re-enter\n\033[0m"
  elif [ $num -eq 0 ];then
    for service in ${arr[@]};do
      DeleteRelease $service
    done
    arr=()
    echo -e "\033[32;1m\nUninstalled successfully\n\033[0m"
    break
  elif [ $num -gt ${#arr[@]} ] || [ $num -lt 1 ];then
    errorMsg="\033[31;1mThe number entered is incorrect, please re-enter\n\033[0m"
  else
    val=$num
    DeleteRelease ${arr[$((num-1))]}
    unset arr[$((val-1))]
    start=0
    for item in ${arr[@]}
    do
      arr[$start]=$item
      start=$((start+1))
    done
    unset arr[$start]
    if [ ${#arr[@]} -ne 0 ];then
      echo -en "\033[36;1m\nWhether to continue uninstalling other KWeaver components(Y/y)/(Other options or press Enter to exit the current uninstaller)\033[0m: "
      read decision
      if [ "$decision" == "Y" ] || [ "$decision" == "y" ];then
        continue
      else
        break
      fi
    fi
  fi
done
