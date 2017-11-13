var express = require('express');
var router = express.Router();
var utils = require('../../../../lib/utils/app_utils');
var service = require('../services/order_list_service');
var formidable=require("formidable");
var inst = require('../services/instance_service');
var nodeTransferService=require("../services/node_transfer_service");
var userService = require('../../workflow/services/user_service');
var nodeAnalysisService=require("../services/node_analysis_service");
/**
 * 工单列表
 */
router.route('/list').post(function(req,res){
    console.log("开始获取所有工单列表...");
    var userNo = req.session.current_user.user_no;//用户编号
    var page = req.body.page;
    var size = req.body.rows;
    console.log(req.session.current_user)
    var conditionMap = {proc_start_user:userNo};

    // 调用分页
    service.getOrderListPage(page,size,conditionMap)
        .then(function(result){
            console.log("获取所有工单列表成功");
            utils.respJsonData(res, result);
        })
        .catch(function(err){
            console.log('获取所有工单列表失败',err);

        });
})

/**
 * 工单类型即所有流程
 */
router.route('/proBase').get(function(req,res){
    console.log("开始获取工单类型下拉框.......");
    service.getAllProBase()
        .then(function(result){
            console.log("获取下拉框结果:",result.success);
            if(result.success){
                utils.respJsonData(res, result.data);

            }
        })
        .catch(function(err){
            console.log('获取下拉框失败',err);

        });
})

/**
 * 获取对应流程的第二节点信息，即发起工单的开始节点信息
 */
router.route('/procDefineDetail').post(function(req,res){
    var proc_code=req.body.proc_code;
    console.log("开始获取对应流程的详细信息.......");
    service.getProcDefineDetail(proc_code)
        .then(function(result){
            console.log("获取获取对应流程的详细信息结果:",result);
             utils.respJsonData(res, result);

        })
        .catch(function(err){
            console.log('获取获取对应流程的详细信息失败',err);

        });
})
/**
 * 创建工单
 */
router.route("/createAndAcceptAssign").post(function(req,res){

    // 分页条件
    var proc_code = req.body.proc_code;
    // 分页参数
    var proc_ver = req.body.proc_ver;
    var proc_title = req.body.title;
    var user_code = req.body.user_no;
    var assign_user_no=req.body.assign_user_no;
    var userName=req.body.user_name;
    var node_code=req.body.node_code;//要流转到的节点编号
    var biz_vars=req.body.biz_vars;
    var proc_vars=req.body.proc_vars;
    var memo=req.body.memo;
    var proc_day=req.body.day;//天数
    var proc_content = req.body.content;

    // 调用
    //p-108 渠道酬金 undefined 00000 管理员 processDefineDiv_node_3 00000 {"audit_id":"1800","table_name":"ywcj_workbench_audit"}
    console.log(proc_code,proc_title,proc_ver,user_code,userName,node_code,assign_user_no,biz_vars);
    inst.createInstance(proc_code,proc_ver,proc_title,"",proc_vars,biz_vars,user_code,userName,proc_day,proc_content)
        .then(function(result){
            if(result.success){
                var task_id=result.data[0]._id;
                inst.acceptTask(task_id,user_code,userName).then(function(rs){
                    if(rs.success){
                        console.log("11111111111",task_id,node_code,user_code,assign_user_no,proc_title,biz_vars,proc_vars);
                        //  nodeTransferService.assign_transfer(task_id,node_code,user_code,assign_user_no,proc_title,biz_vars,proc_vars,memo).then(function(results){
                        nodeTransferService.do_payout(task_id,node_code,user_code,assign_user_no,proc_title,biz_vars,proc_vars,memo).then(function(results){
                            utils.respJsonData(res,results);
                        });
                    }else{
                        utils.respJsonData(res,rs);
                    }

                })
            }else{
                utils.respJsonData(res,result);

            }

        }).catch(function(err){
        console.log('err');
        // console.log(err);
        logger.error("route-createInstance","创建流程实例异常",err);
    });
});



module.exports = router;
