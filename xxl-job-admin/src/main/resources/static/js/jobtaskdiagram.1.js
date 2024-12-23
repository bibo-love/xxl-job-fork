
// 初始化数据
initData();

var _myJobData = {};

// 搜索按钮事件
$('#searchBtn').on('click', function() {
    console.log("执行搜索");
    initData();
});

// 触发任务操作
$("#jobTriggerModal .ok").on('click', function() {
    triggerJob();
});

// 模态框隐藏时重置表单
$("#jobTriggerModal").on('hide.bs.modal', function () {
    resetJobTriggerModal();
});

// 初始化数据
function initData() {
    $.ajax({
        type: 'POST',
        url: base_url + "/jobinfo/pageList",
        data: {
            "jobGroup": $('#jobGroup').val(),
            "triggerStatus": $('#triggerStatus').val(),
            "jobDesc": $('#jobDesc').val(),
            "executorHandler": $('#executorHandler').val(),
            "author": $('#author').val(),
        },
        dataType: "json",
        success: function(response) {
            console.log(response);
            var jobdata = response.data;
            drawView(jobdata);
        }
    });
    _myJobData = {};
}

// 触发任务
function triggerJob() {
    $.ajax({
        type: 'POST',
        url: base_url + "/jobinfo/trigger",
        data: {
            "id": $("#jobTriggerModal .form input[name='id']").val(),
            "executorParam": $("#jobTriggerModal .textarea[name='executorParam']").val(),
            "addressList": $("#jobTriggerModal .textarea[name='addressList']").val(),
        },
        dataType: "json",
        success: function(data) {
            handleJobTriggerResponse(data);
        }
    });
}

// 处理任务触发响应
function handleJobTriggerResponse(data) {
    if (data.code == 200) {
        $('#jobTriggerModal').modal('hide');
        layer.msg(I18n.jobinfo_opt_run + I18n.system_success);
    } else {
        layer.msg(data.msg || I18n.jobinfo_opt_run + I18n.system_fail);
    }
}

// 重置任务触发模态框
function resetJobTriggerModal() {
    $("#jobTriggerModal .form")[0].reset();
}

// 触发任务模态框
function triggerTask() {
    var taskId = $("#taskId").val();
    console.log("运行任务ID: " + taskId);

    $("#jobTriggerModal .form input[name='id']").val(taskId);
    $('#jobTriggerModal').modal({ backdrop: false, keyboard: false }).modal('show');
}

// 查看日志
function viewLog() {
    var taskId = $("#taskId").val();
    console.log("查看任务日志ID: " + taskId);
    var logUrl = base_url + '/joblog?jobId=' + taskId;
    window.location.href = logUrl;
}

// 查看下次执行时间
function jobNetTime() {
    var taskData = _myJobData;

    $.ajax({
        type: 'POST',
        url: base_url + "/jobinfo/nextTriggerTime",
        data: {
            "scheduleType": taskData.scheduleType,
            "scheduleConf": taskData.scheduleConf
        },
        dataType: "json",
        success: function(data) {
            handleJobNetTimeResponse(data);
        }
    });
}

// 处理查看下次执行时间的响应
function handleJobNetTimeResponse(data) {
    if (data.code !== 200) {
        layer.open({
            title: I18n.jobinfo_opt_next_time,
            btn: [I18n.system_ok],
            content: data.msg
        });
    } else {
        displayNextTriggerTime(data.content);
    }
}

// 显示下次触发时间
function displayNextTriggerTime(content) {
    var html = '<center>';
    if (content) {
        content.forEach(function(item) {
            html += '<span>' + item + '</span><br>';
        });
    }
    html += '</center>';

    layer.open({
        title: I18n.jobinfo_opt_next_time,
        btn: [I18n.system_ok],
        content: html
    });
}

// 编辑任务
function editTask() {
    var taskData = _myJobData;

    fillTaskBasicInfo(taskData);
    fillTaskTriggerInfo(taskData);
    fillTaskAdvancedInfo(taskData);

    $('#updateModal').modal({ backdrop: false, keyboard: false }).modal('show');
}

// 填充任务基本信息
function fillTaskBasicInfo(taskData) {
    $("#updateModal .form input[name='id']").val(taskData.id);
    $('#updateModal .form select[name=jobGroup] option[value=' + taskData.jobGroup + ']').prop('selected', true);
    $("#updateModal .form input[name='jobDesc']").val(taskData.jobDesc);
    $("#updateModal .form input[name='author']").val(taskData.author);
    $("#updateModal .form input[name='alarmEmail']").val(taskData.alarmEmail);
}

// 填充任务触发器信息
function fillTaskTriggerInfo(taskData) {
    $('#updateModal .form select[name=scheduleType] option[value=' + taskData.scheduleType + ']').prop('selected', true);
    $("#updateModal .form input[name='scheduleConf']").val(taskData.scheduleConf);

    if (taskData.scheduleType === 'CRON') {
        $("#updateModal .form input[name='schedule_conf_CRON']").val(taskData.scheduleConf);
    } else if (taskData.scheduleType === 'FIX_RATE') {
        $("#updateModal .form input[name='schedule_conf_FIX_RATE']").val(taskData.scheduleConf);
    } else if (taskData.scheduleType === 'FIX_DELAY') {
        $("#updateModal .form input[name='schedule_conf_FIX_DELAY']").val(taskData.scheduleConf);
    }

    $("#updateModal .form select[name=scheduleType]").change();
}

// 填充任务高级配置
function fillTaskAdvancedInfo(taskData) {
    $('#updateModal .form select[name=glueType] option[value=' + taskData.glueType + ']').prop('selected', true);
    $("#updateModal .form input[name='executorHandler']").val(taskData.executorHandler);
    $("#updateModal .form textarea[name='executorParam']").val(taskData.executorParam);

    $("#updateModal .form select[name=executorRouteStrategy] option[value=" + taskData.executorRouteStrategy + "]").prop('selected', true);
    $("#updateModal .form input[name='childJobId']").val(taskData.childJobId);
    $('#updateModal .form select[name=misfireStrategy] option[value=' + taskData.misfireStrategy + ']').prop('selected', true);
    $('#updateModal .form select[name=executorBlockStrategy] option[value=' + taskData.executorBlockStrategy + ']').prop('selected', true);
    $("#updateModal .form input[name='executorTimeout']").val(taskData.executorTimeout);
    $("#updateModal .form input[name='executorFailRetryCount']").val(taskData.executorFailRetryCount);

    $("#updateModal .form select[name=glueType]").change();
    $("#updateModal .form input[name='schedule_conf_CRON']").show().siblings().remove();
    $("#updateModal .form input[name='schedule_conf_CRON']").cronGen({});
}

// 任务操作
function operateTask(type) {
    var taskId = $("#taskId").val();
    console.log("任务操作ID: " + taskId);

    var typeName;
    var url;
    var needFresh = false;

    switch (type) {
        case "job_pause":
            typeName = I18n.jobinfo_opt_stop;
            url = base_url + "/jobinfo/stop";
            needFresh = true;
            break;
        case "job_resume":
            typeName = I18n.jobinfo_opt_start;
            url = base_url + "/jobinfo/start";
            needFresh = true;
            break;
        case "job_del":
            typeName = I18n.system_opt_del;
            url = base_url + "/jobinfo/remove";
            needFresh = true;
            break;
        default:
            return;
    }

    layer.confirm(I18n.system_ok + typeName + '?', {
        icon: 3,
        title: I18n.system_tips,
        btn: [I18n.system_ok, I18n.system_cancel]
    }, function(index) {
        layer.close(index);
        executeJobOperation(url, taskId, typeName, needFresh);
    });
}

// 执行任务操作
function executeJobOperation(url, taskId, typeName, needFresh) {
    $.ajax({
        type: 'POST',
        url: url,
        data: { "id": taskId },
        dataType: "json",
        success: function(data) {
            handleJobOperationResponse(data, typeName, needFresh);
        }
    });
}

// 处理任务操作响应
function handleJobOperationResponse(data, typeName, needFresh) {
    if (data.code == 200) {
        layer.msg(typeName + I18n.system_success);
        if (needFresh) {
            initData();
        }
    } else {
        layer.msg(data.msg || typeName + I18n.system_fail);
    }
}

// 绘制视图
function drawView(data) {
    var myChart = echarts.init(document.getElementById('diagram'));

    if (!data || !Array.isArray(data)) {
        console.error("无效的任务数据");
        return;
    }

    // 转换节点数据
    var nodes = data.map(item => createNode(item));
    var links = createLinks(data);
    var options = createGraphOptions(nodes, links);

    myChart.setOption(options);

    // 添加节点点击事件
    myChart.on('click', 'series.graph.node', function(params) {
        handleNodeClick(params);
    });
}

// 创建节点
function createNode(item) {
    var width = calculateNodeWidth(item.jobDesc);
    return {
        id: item.id.toString(),
        name: item.jobDesc,
        symbol: 'rect',
        symbolSize: [width, 40],
        itemStyle: {
            color: item.triggerStatus === 0 ? '#5470c6' : '#91cc75',
            emphasis: {
                borderColor: '#000',
                borderWidth: 2,
                borderColorSaturation: 0.6
            }
        },
        draggable: true,
        nodeData: item
    };
}

// 创建连接
function createLinks(data) {
    var links = [];
    data.forEach(item => {
        if (item.childJobId) {
            var childIds = item.childJobId.split(',').map(id => id.trim());
            childIds.forEach(childId => {
                links.push({
                    source: item.id.toString(),
                    target: childId
                });
            });
        }
    });
    return links;
}

// 创建图表配置
function createGraphOptions(nodes, links) {
    var nodeCount = nodes.length;
    var linkCount = links.length;

    return {
        tooltip: {
            formatter: function(params) {
                var nodeData = params.data.nodeData;
                return `任务名称: ${nodeData.jobDesc}<br/>任务ID: ${nodeData.id}`;
            }
        },
        animationDurationUpdate: 1500,
        animationEasingUpdate: 'quinticInOut',
        series: [
            {
                type: 'graph',
                layout: 'force',
                roam: true,
                label: { show: true },
                edgeSymbol: ['circle', 'arrow'],
                edgeSymbolSize: [4, 10],
                edgeLabel: { fontSize: 20 },
                data: nodes,
                links: links,
                force: {
                    repulsion: 1000 + nodeCount * 50,
                    edgeLength: [100, 200 + linkCount * 10],
                    gravity: 0.1 + nodeCount * 0.01,
                    friction: 0.6 + nodeCount * 0.01
                }
            }
        ]
    };
}

// 计算节点宽度
function calculateNodeWidth(description) {
    var nameLength = description.length;
    return Math.min(nameLength * (isChinese(description) ? 12 : 8), 250);
}

// 检查是否为中文字符
function isChinese(str) {
    return /[\u4e00-\u9fa5]/.test(str);
}

// 处理节点点击事件
function handleNodeClick(params) {
    var nodeData = params.data.nodeData;
    console.log("任务名称: ", nodeData.jobDesc);
    console.log("任务触发状态: ", nodeData.triggerStatus);
    console.log("任务ID: ", nodeData.id);
    _myJobData = nodeData;

    // 更新操作按钮
    if (1 === nodeData.triggerStatus) {
        $("#runButton").hide();
        $("#stopButton").show();
    } else {
        $("#runButton").show();
        $("#stopButton").hide();
    }

    // 填充任务操作视图
    $("#jobOperateView input[name='id']").val(nodeData.id);
    $("#taskIdDisplay").text("id:" + nodeData.id);
    $("#jobTriggerModal .form textarea[name='executorParam']").val(nodeData.executorParam);
    $('#jobOperateView').modal({ backdrop: false, keyboard: false }).modal('show');
}
