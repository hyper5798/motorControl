var host = window.location.hostname;
var port = window.location.port;
var rpmSetting=440,max = 440,range = 100;;
var motor_id;
var data,options;
var chart;
var myTimer,myTimeout,counter;
var mac = document.getElementById('mac').value;
var debug = false;

if(debug === false){
  $("#status").hide();
}

function startTimer(){
  if(debug){
    counter = 1;
    myTimer = setInterval(updateTimer, 1000);
    //Avoid without receive motor response to query again after 10 seconds
    setTimeout(stopTimer, 30000);
  }
}

function stopTimer(){
  clearInterval(myTimer);
  //clearTimeout(myTimeout);
}

function updateTimer() {
    counter ++;
    document.getElementById("timer").innerHTML = counter+'秒';
}
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

      if(msg.id === 'get_query_0' ){

          var mac = v.mac;
          var info = v.info;
          initMotor(info);
          document.getElementById("status").innerHTML = 'get_init';


      }else if(msg.id === 'get_query_2'){
          //Set init button active
          //1:過流
          //2:霍爾故障
          //3.堵轉
          document.getElementById("status").innerHTML = 'get_rpm';
          stopTimer();
          var mac = v.mac;
          var info = v.info;
          currentMotor(info);
      }else if(msg.id === 'get_setting_3'){//Set rpm
          //Set init button active
          //1:過流
          //2:霍爾故障
          //3.堵轉
          stopTimer();
          changMotorGaugeRPM(rpmSetting);
          //var mac = v.mac;
          //var info = v.info;
          //currentMotor(info);
          //alert(JSON.stringify(info));
      }
    }
  }
  ws.onopen = function() {
    var obj = {"id":"init","v":{"mac":mac}};
    document.getElementById("status").innerHTML = 'init';
    sendWSCmd(obj);
    deayQaueyMode2();
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
    ['RPM', 0]
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
  showDialog('Connecting');
  $myPayloadMeter = $('#payloadMeterDiv').dynameter({
        // REQUIRED.
        label: 'mg/L',
        value: 6,
        unit: '\n',
        min: 0,
        max: 20,
        regions: {
            10: 'warn',
            15: 'error'
        }
    });
});



function initMotor(info){
  max = info.rpm;
  //alert('max:'+max);
  google.charts.load('current', {'packages':['gauge']});
  google.charts.setOnLoadCallback(drawChart);
  if(info.turn === 0){
    document.getElementById('turn').value = 'Forward';
  }else{
    document.getElementById('turn').value = 'Reverse';
  }
  var off_delay = info.off_delay;
  var on_delay = info.on_delay;
  document.getElementById('off_delay').value = off_delay;
  document.getElementById('on_delay').value = on_delay;
  motor_id = info.id;
}

function currentMotor(info){
  //1:過流
  //2:霍爾故障
  //3.堵轉
  var errorMsg = "OK";
  if(info.error_Code === 1){
    errorMsg = 'Overcurrent';
  }else if(info.error_Code === 2){
    errorMsg = 'Hall failure';
  }else if(info.error_Code === 3){
    errorMsg = 'Stalled';
  }
  if(info.rpm === 0){
    rpmSteeing = max;
  }else{
     rpmSteeing = info.rpm;
  }

  document.getElementById('rpm').value = rpmSteeing;
  document.getElementById('current').value = info.current;
  document.getElementById('code').value = errorMsg;
  changMotorGaugeRPM(info.rpm);
}

function setMotor(rpm){
  rpmSetting = rpm;
  showDialog('設定馬達中');
  var json = {"rpm":rpmSetting,"mac":mac};
  var obj = {"id":"setMotor","v":json};
  sendWSCmd(obj);
  deayQaueyMode2();
  startTimer();
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
      },10000);
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

function deayQaueyMode2(){
  var obj = {"id":"query_mode_2","v":{"mac":mac}};
  setTimeout(function(){
      //do what you need here
      sendWSCmd(obj);
      //document.getElementById("status").innerHTML = 'query_rpm';
  }, 2000);
}
