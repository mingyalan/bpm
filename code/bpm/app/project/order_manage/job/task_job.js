﻿const process_model = require('../../../../app/project/bpm_resource/models/process_model');
var service = require('../services/mistake_list_service');
var utils = require('../../../../lib/utils/app_utils');
var dictModel = require('../../workflow/models/dict_model');
var config = require('../../../../config');
var mistakeService = require('../../order_manage/services/mistake_list_service');
var moment = require('moment');

exports.task_job=function(){
    task ();
}

async function task() {
    try{
        //查询未归档未超时的差错工单和预警工单
        let length=await process_model.$ProcessInst.count({"proc_inst_status":2,"proc_code":{$in:['p-201']},"is_overtime":'0',"proc_cur_task_name" :"厅店处理回复"});
        let size = 200;
        let pool_size = Math.ceil(length / size);
        console.log('pool_size', pool_size)
        for (let i = 0; i < pool_size; i++) {
            console.log("=================第", i, "次====================");
            let start = i * size;

            await handle_overtime_order(i,size);
        }
    }catch(e){
        console.log("处理超时任务失败",e);
    }
}

function handle_overtime_order(page,size){
    return new Promise(function(resolve,reject){

        process_model.$ProcessInst.find({"proc_inst_status":2,"proc_code":{$in:['p-201']},"is_overtime":'0',"proc_cur_task_name" :"厅店处理回复"},function(err,instList){
            let count=0;

            let now=new Date().getTime();
            for(let item in instList){
                console.log(instList[item]);
                let proc_vars=JSON.parse(instList[item].proc_vars);
                let endTime=new Date(proc_vars.end_time).getTime();
                //判断是否是超时
                if(now > endTime){
                    var conditions = {_id: instList[item]._id};
                    var update = {$set: {is_overtime:1}};
                    var options = {};
                    process_model.$ProcessInst.update(conditions, update, options, function (error) {
                        if(error) {
                        }else {
                            count++;
                            if(count==instList.length){
                                resolve()
                            }
                          /*  let taskList=await process_model.$ProcessInstTask.find({"proc_inst_id":instList[item]._id,"proc_inst_task_status" :0})
                            if(taskList.length>0){
                                let userList=await user_model.$User.find({"user_no":taskList[0].proc_inst_task_assignee});
                                //发送短信通知当前节点处理人
                                       if (userList.length>0) {
                                              var process_utils = require('../../../utils/process_util');
                                              var mobile = userList[0].user_phone;

                                              var params = {
                                                  "procName": instList[item].proc_title,
                                                  "orderNo":  instList[item].work_order_number
                                              }
                                              process_utils.sendSMS(mobile, params, "SMS_TEMPLET_ORDER").then(function (rs) {
                                                  console.log("短信发送成功");
                                              }).catch(function (err) {
                                                  console.log("短信发送失败", err);
                                              });
                                          }
                            }*/
                        }
                    });
                }else{
                    count++;
                    if(count==instList.length){
                        resolve()
                    }
                }
            }
        }).skip(page*size).limit(size)

    })

}



exports.mistake_distribute_task=function(){
    mistake_distribute_task ();
}
function mistake_distribute_task() {

    moment.locale('zh-cn');
    var _today = moment();
    var queryDate =  _today.subtract(1, 'days').format('YYYY-MM-DD').replace(/\-/g,'');
    console.log(queryDate)

    //获取定时派单字典数据
    dictModel.$.aggregate([
        {
            $match:{"dict_code" : "mistake_task_code"}
        },
        {
            $lookup: {
                from: "common_dict_attr_info",
                localField: '_id',
                foreignField: "dict_id",
                as: "dict_attr_info"
            }
        },
        {
            $unwind: {path: "$dict_attr_info", preserveNullAndEmptyArrays: true}
        },
        {
            $project:{
                field_name:"$dict_attr_info.field_name",
                field_value:"$dict_attr_info.field_value"
            }
        }
    ]).exec(function (err, res) {
        if(err){
            console.log(utils.returnMsg(false, '0001', '开启开关失败:查询筛选条件失败!', null, err));
        }else{
            if(res.length>0){
                var dict_data = {};
                for (let item in res) {
                    let dict = res[item];
                    dict_data[dict.field_name]=dict.field_value;
                }
                console.log(dict_data);
                if(dict_data.mistake_task_flag=='1'){
                    var datas = [];
                    var data = {};

                    data.proc_code = config.mistake_proc_code;
                    data.proc_name = config.mistake_proc_name;
                    data.dispatch_time = queryDate;
                    data.create_user_no ="13511927000";
                    data.create_user_name = '系统自动派发';
                    data.update_user_no = '';
                    data.dispatch_cond_one = dict_data.mistake_task_check_status;
                    data.dispatch_cond_two = dict_data.mistake_task_city_code;
                    data.dispatch_cond_thr = dict_data.mistake_task_business_code;
                    data.create_time = new Date();
                    data.status = 0;
                    data.dispatch_remark = '';
                    datas.push(data);

                    service.addMistakeLog(datas).then(function(result){
                        var mlog_id = result.data[0]._id.toString();
                        var check_status= dict_data.mistake_task_check_status;//稽核状态
                        var business_code=dict_data.mistake_task_business_code;//业务名称
                        var city_code=dict_data.mistake_task_city_code;//地州
                        var status= 0;//派单状态
                        var user_no='13511927000';
                        var work_id='18600834';
                        var user_name='系统自动派发';
                        var role_name='系统自动派发';

                        console.log(queryDate,check_status,user_no,user_name,role_name,business_code,city_code,work_id,mlog_id);
                        // 调用分页
                        mistakeService.dispatch(queryDate,check_status,user_no,user_name,role_name,business_code,city_code,work_id,status,mlog_id)
                            .then(function(result){
                                console.log("派发工单成功",result);
                            })
                            .catch(function(err){
                                console.log('派发工单失败',err);

                            });
                    });
                }else{
                    console.log("自动派单定时任务关闭");
                }

            }else{
                console.log(utils.returnMsg(false, '0001', '请添加定时派单字典!', null, err));
            }

        }

    })
}

