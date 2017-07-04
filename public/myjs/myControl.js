var host = window.location.hostname;
var port = window.location.port;
var rpm=0,max = 500,range = 100;;
var motor_id;
var data,options;
var chart;
var mac = document.getElementById('mac').value;
//alert(mac);

if(location.protocol=="https:"){
  var wsUri="wss://"+host+":"+port+"/ws/control";
} else {
  var wsUri="ws://"+host+":"+port+"/ws/control";
}
console.log(wsUri);
var ws=null;

function wsConn() {
  ws = new WebSocket(wsUri);
  ws.onmessage = function(m) {
    console.log('< from-node-red:',m.data);
    if (typeof(m.data) === "string" && m. data !== null){
      var msg =JSON.parse(m.data);
      console.log("from-node-red : id:"+msg.id);
      var v = msg.v;

      if(msg.id === 'get_init' ){

          var mac = v.mac;
          var info = v.info;
          initMotor(info);
          var obj = {"id":"query_rpm","v":{"mac":mac}};
          setTimeout(function(){
              //do what you need here
              sendWSCmd(obj);
          }, 3000);

      }else if(msg.id === 'get_rpm'){
          //Set init button active
          //1:過流
          //2:霍爾故障
          //3.堵轉
          var mac = v.mac;
          var info = v.info;
          currentMotor(info);
      }else if(msg.id === 'get_setting_3'){//Set rpm
          //Set init button active
          //1:過流
          //2:霍爾故障
          //3.堵轉
          var mac = v.mac;
          var info = v.info;
          currentMotor(info);
      }
    }
  }
  ws.onopen = function() {
    var obj = {"id":"init","v":{"mac":mac}};
    sendWSCmd(obj);
  }
  ws.onclose   = function()  {
    console.log('Node-RED connection closed: '+new Date().toUTCString());
    connected = false;
    ws = null;
  }
  ws.onerror  = function(){
    console.log("connection error");
  }
}
wsConn();

function drawChart() {

  range = (Math.round(max/10))*2;
  var redFrom = max -range;
  var yellowFrom = redFrom -range;

  data = google.visualization.arrayToDataTable([
    ['Label', 'Value'],
    ['轉速', 0]
  ]);

  options = {
    width: 300, height: 300,
    redFrom: redFrom, redTo: max,
    yellowFrom:yellowFrom, yellowTo: redFrom,
    minorTicks: 5,
    max:max
  };

  chart = new google.visualization.Gauge(document.getElementById('chart_div'));

  chart.draw(data, options);
  //waitingDialog.hide();
}

$(document).ready(function(){
  $( "#rpmAlert" ).hide();
  showDialog('連線取得資料中');
  $('#toggle-one').bootstrapToggle({
    on: '開啟',
    off: '關閉'
  });
  $('#toggle-one').change(function() {
    if($(this).prop('checked')){
      //alert('開啟馬達');
      if(rpm===0){
        rpm = max;
      }
      showDialog('設定馬達中');
      setMotor(rpm);
      changMotorGaugeRPM(rpm);
    }else{
      //alert('關閉馬達');
      showDialog('設定馬達中');
      setMotor(0);
      changMotorGaugeRPM(0);
    }
  });
});


function initMotor(info){
  max = info.rpm;
  //alert('max:'+max);
  google.charts.load('current', {'packages':['gauge']});
  google.charts.setOnLoadCallback(drawChart);
  if(info.turn === 0){
    document.getElementById('turn').value = '正轉';
  }else{
    document.getElementById('turn').value = '反轉';
  }
  var off_delay = info.off_delay;
  var on_delay = info.on_delay;
  document.getElementById('off_delay').value = off_delay;
  document.getElementById('on_delay').value = on_delay;
  motor_id = info.id;
}

function currentMotor(info){
  rpm = info.rpm;
  //1:過流
  //2:霍爾故障
  //3.堵轉
  var errorMsg = "無";
  if(info.error_Code === 1){
    errorMsg = '過流';
  }else if(info.error_Code === 2){
    errorMsg = '霍爾故障';
  }else if(info.error_Code === 3){
    errorMsg = '堵轉';
  }

  document.getElementById('rpm').value = info.rpm;
  document.getElementById('current').value = info.current;
  document.getElementById('code').value = errorMsg;
  changMotorGaugeRPM(rpm);
}

function editCheck(){

  rpm = document.getElementById('rpm').value;
  if(rpm>max){

     rpm = max;
     document.getElementById('rpm').value = rpm;
     showAlert();
  }
  //changMotorGaugeRPM(rpm)
  $('#toggle-one').bootstrapToggle('on');
}

function setMotor(rpm){
  var json = {"rpm":rpm,"mac":mac};
  var obj = {"id":"setMotor","v":rpm};
  sendWSCmd(obj);
}

function changMotorGaugeRPM(rpm){

  data.setValue(0, 1, rpm);
  chart.draw(data, options);
}

function showDialog(message){
    waitingDialog.show(message);
    //waitingDialog.show();
    setTimeout(function () {
      waitingDialog.hide();
      },5000);
}

function showAlert(){
    $( "#rpmAlert" ).show();
    //waitingDialog.show();
    setTimeout(function () {
        $( "#rpmAlert" ).hide();
      },10000);
}

function sendWSCmd(obj){
  var getRequest = JSON.stringify(obj);
  console.log("getRequest : "+ getRequest);
  if(ws === null){
    ws = new WebSocket(wsUri);
  }
  ws.send(getRequest);      // Request ui status from NR
  console.log(getRequest);

}
