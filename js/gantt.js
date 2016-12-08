// 计算两个日期的差
function cal_Day(time1 , time2){
    return ( new Date(time1).getTime() - new Date(time2).getTime() ) /1000/60/60/24;
}

// 将日期 2016-12-10 转换为 12.10 
function getMonthAndDay(time){
    return time.substring(time.indexOf("-")+1).replace("-",".");
}


var intervalDay = -1;

// 最小时间
var minDate = '';

var nowDateObj = new Date();
var nowDate_Month = (nowDateObj.getMonth()+1);
var nowDate_day = nowDateObj.getDate();
// 当前时间
var nowDate = nowDateObj.getFullYear() 
            +"-"+ ( nowDate_Month < 10 ? "0"+nowDate_Month : nowDate_Month ) + "-" +
            (nowDate_day < 10 ? "0"+nowDate_day : nowDate_day);


var vue = new Vue({
    el:".main",
    data:{
        task:task
    },
    methods:{
        // 返回指定年月的天数
        getdaysByMonth:function(year,month){
            return new Date(year,parseInt(month),0).getDate();
        },
        // 转换为字符串
        jsontostring:function(json){
            return JSON.stringify(json);
        },
        // 获取间隔天数
        getIntervalDay:function(){
            // 如果没有设置了间隔时间
            if(intervalDay == -1 ){
                // 最小年
                var minYear = this.$data.task.years[0];
                // 最大年
                var maxYear = this.$data.task.years[ this.$data.task.years.length-1 ];
                // 最小年的最小月
                var minMonth = this.$data.task.months[minYear][0];
                // 最大年的最大月
                var maxMonth = this.$data.task.months[maxYear][ this.$data.task.months[maxYear].length-1 ];
                
                minDate = minYear+'-'+minMonth+'-01';

                // 最大日期 与 最小日期的 差
                intervalDay = cal_Day(maxYear+'-'+maxMonth+'-31',minDate); 
            }
            return intervalDay; 
        }
    }
});

// Vue 渲染数据完成之后开始渲染具体里程碑以及项目的甘特图进度
Vue.nextTick(function(){
    // 当前日期到最小日期的间隔天数
    var now_day = cal_Day(nowDate,minDate);
    // 基线
    var baseline = "<div class=\"gantt-baseline\"></div>";
    // 每一个甘特图项目
    $(".gantt-task-item-val").each(function(){
        // 该项目的开始时间
        var startTime = $(this).attr("data-startTime");
        // 该项目的结束时间
        var endTime = $(this).attr("data-endTime");
        // 该项目的完成时间
        var completedTime = $(this).attr("data-completedtime");
        // 该项目的里程碑数据
        var milestones = $(this).attr("data-milestones");

        // 已处理的里程碑
        var milestone_index = -1;

        // 如果有值，转换为json
        if(milestones && typeof(milestones) == "string")
            milestones = $.parseJSON(milestones);

        // 算出开始时间与最小日期间隔多少(开始绘制的起始格子)
        var start_day = cal_Day(startTime , minDate);
        var end_day = cal_Day(endTime , minDate);
        // 已完成的距离最小时间的天数
        var complete_day = completedTime != "" ? cal_Day(completedTime,minDate) : 0;
        
        // 从开始到结束进行绘制背景颜色
        for(var i in $(this).next().children()){
            if(i >= start_day && i <= end_day){ 
                
                // 画线
                var nodeVal = "";

                // 如果是开始时间
                if(i == start_day){
                 //border-radius   
                    nodeVal = "<div class=\"gantt-line\" style=\" border-radius: 4px 0px 0px 4px; \">";
                    
                    // 组装项目名+开始时间的提示字符串
                    var tipText = "[";
                    tipText += $(this).text();
                    tipText += "] ";
                    tipText +=  getMonthAndDay(startTime) ;
                    var tipText_marginLeft = -($(this).text().length * 14 + 40);

                    nodeVal += "<div style=\"margin-left:"+ tipText_marginLeft +"px;\" class=\"gantt-task-tiptext\">"+  tipText  +"</div>";
                    
                }else if(i == end_day){ // 如果是结束时间
                    nodeVal = "<div class=\"gantt-line\" style=\"margin-left:-1px; border-radius: 0px 4px 4px 0px; \">";
                    // 结束日期
                    nodeVal += "<div class=\"gantt-task-tiptext\" style=\"margin-left:30px;\">"+getMonthAndDay(endTime)+"</div>";
                }else{  // 中间内容
                    nodeVal = "<div class=\"gantt-line\">"
                }

                // 如果该时间是已完成
                if(completedTime != "" && i - start_day <= complete_day - start_day){
                    nodeVal += "<div class=\"gantt-line_completed\"></div>";
                }else if( end_day - now_day > 0 && now_day - complete_day > 0 && i < now_day ){ // 未完成(如果项目的结束时间>当前时间，并且当前时间大于已完成时间，并且当前格子在当前时间之前)
                    nodeVal += "<div class=\"gantt-line_overdue\"></div>";
                }
            
                // 标识里程碑任务节点(如果不为空并且还是字符串)
                if(milestones && typeof(milestones) == "object"){
                    // 遍历里程碑数组
                    for(var m in milestones){
                        // 如果该里程碑没有被添加
                        if(m > milestone_index){
                            // 第几格绘制里程碑
                            if(i == cal_Day(milestones[m].time,minDate)){
                                var milestoneTipText = "["+milestones[m].name+"] "+getMonthAndDay(milestones[m].time);
                                // 生成里程碑节点
                                nodeVal += "<div class=\"gantt-task-milestone\"></div>"+"<div class=\"gantt-task-milestone-tiptext\"> "+ milestoneTipText +" </div>";
                                // 成功添加一个后，下标加1
                                milestone_index++;
                            }
                        }
                    }
                }
                nodeVal += "</div>";

                $($(this).next().children()[i]).append(nodeVal);
                
            }
            // 如果是当天的格子
            if(i == now_day){
                $($(this).next().children()[i]).append(baseline);
            }
        }
    });

    $(".gantt-task-parent-val").each(function(){
        for(i in $(this).next().children()){
            if( i == now_day){
                $($(this).next().children()[i]).append(baseline);
            }
        }
    });
});

$(function(){
    // 将图片转为canvas
    $(".download").click(function(){
        html2canvas(document.body, {
            onrendered: function(canvas) {
                document.getElementById("imgbox").appendChild(canvas);
            }
        });
        // 延迟一秒下载图片
        setTimeout(download_img,1000);    
    });     
});


// 下载图片
function download_img(){
    var canvas = $("#imgbox").children()[0];
    var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    window.location.href = image;
    // 删除
    $("#imgbox").children()[0].remove();
}