#! /bin/bash
CheckSuccess() {
  if [ $1 -ne 0 ];then
    echo -en "\033[31;1m$2 failed\n\033[0m"
    exit 2
  else
    echo -en "\033[32;1m$2 success\n\033[0m"
  fi
}

install_str="helm install /kweaver/deploy/kw-k8s/charts/kw-redis -n kw-redis --set replicaCount=${#}"
remove=""
for ((n=0;n<$(($#));n++))
do
  node=${@:$(($n+1)):$((1))}
  nodeIp=`kubectl describe node $node | grep "InternalIP:" | sed 's/[[:space:]]//g'`
  nodeIp=${nodeIp:11}
  ssh root@$nodeIp "ls /kweaver/deploy/kw-k8s/data/redis" >> /kweaver/deploy/kw-k8s/log/storage_install.log 2>&1
  if [ $? -eq 0 ];then
    if [ "$remove" == "" ] && [ $n -eq 0 ];then
      echo -en "\033[32;1mWhether to clear the old data before installing the new redis\033[0m"
      echo -en "\033[31;1m(Y/y empty data,any other values retain data): \033[0m"
      read remove
    fi
    if [ "$remove" == "Y" ] || [ "$remove" == "y" ];then
      ssh root@$nodeIp "rm -rf /kweaver/deploy/kw-k8s/data/redis/*" >> /kweaver/deploy/kw-k8s/log/storage_install.log 2>&1
      CheckSuccess $? "Uninstall the old data of redis on node ${nodeIp}"
    fi
  else
    echo -en "\033[32;1m\nSynchronizing the data directory of redis on node ${nodeIp}\n\033[0m"
    ssh root@$nodeIp "mkdir -p /kweaver/deploy/kw-k8s/data/redis" >> /kweaver/deploy/kw-k8s/log/storage_install.log 2>&1
    CheckSuccess $? "Synchronize the data directory of redis on node ${nodeIp}"
  fi
  
  install_str="${install_str} --set storage.local.host=${node} --set storage.local.path=/kweaver/deploy/kw-k8s/data/redis/"
done
${install_str} >> /kweaver/deploy/kw-k8s/log/storage_install.log 2>&1
exit $?