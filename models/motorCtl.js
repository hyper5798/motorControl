
var testDataStr  = 'ab00773F3F3030353D3C3130303F3F';
var testDataStr2 = 'ab01783F3F3230353D3C3330303C30';
var testData = testDataStr.toLowerCase();
var ab00Data = { 'send_id':[6,10,1], 'mode':[10,12,1], 'rpm':[12,20,1],'turn':[20,22,1] ,'off_delay':[22,24,1],'on_delay':[24,26,1],'recv_id':[26,30,1]};
var ab01Data = { 'send_id':[6,10,1], 'mode':[10,12,1], 'rpm':[12,20,1],'current':[20,28,1000],'error_Code':[28,30,1],};
//console.log(new Buffer('hello, world!').toString('hex'));
// 轉換成十六進制字符串：68656c6c6f2c20776f726c6421

//console.log(new Buffer('68656c6c6f2c20776f726c6421', 'hex').toString());
// 還原十六進制字符串：hello, world!

exports.getSettingData = getSettingData;
exports.getQueryCmd = getQueryCmd;
exports.getInfoData = getInfoData;

/**
 * Query command is send [1]~[13] hex string to lora site to query current information
 * [0]:[2:1] It is start marks not within query command that will be combine in lora site.
 * [1]:[3:F] ID2 boardcast id
 * [2]:[3:F] ID1 boardcast id
 * [3]:[3:0] Mode 0x0：工程模式，詢問轉速上限值[5]~[8]、正反轉/模式[9]、OFF_Delay[10]、ON_Delay[11]、
 *                     ID[12]~[13]、軟體版本[14]、硬體版本[15]
 * [3]:[3:2] Mode 0x2 :工程模式，詢問目前轉速值[5]~[8]、電流值[9]~[12]、Error Code[13]
 * [4]~[13] : [3:0] Default value
 */
var queryCmd0 = '3f3f30303030303030303030';
var queryCmd2 = '3f3f32303030303030303030';
var settingArr1 = ["3f", "3f", "31", "30", "30", "30", "3F", "30", "30", "30", "30", "30"];
var settingArr3 = ["3f", "3f", "33", "30", "30", "30", "30", "30", "30", "30", "30", "30"];

function getQueryCmd(mode){
    if(mode===0){
        return queryCmd0;
    }else if(mode===2){
        return queryCmd2;
    }
}

function getSettingData(obj){
    var mode = obj.mode;
    if(mode===1){
        var settingArr = settingArr1;
        var turn= obj.turn;
        if(turn){
            settingArr[7] = replaceData(settingArr[7],turn);
        }
        var off_delay= obj.off_delay;
        if(off_delay){
            settingArr[8] = replaceData(settingArr[8],off_delay);
        }
        var on_delay= obj.on_delay;
        if(off_delay){
            settingArr[9] = replaceData(settingArr[9],on_delay);
        }
        var set_id= obj.set_id;
        if(set_id){
            var idData = set_id.toString(16);
            for(var i= 0;i<idData.length;i++){
                settingArr[(11-i)] = replaceData(settingArr[(11-i)],idData.charAt(idData.length-i-1));
            }
        }
    }else if(mode===3){
        var settingArr = settingArr3;
    }
    var rpm = obj.rpm;
    if(rpm){
        var rmpData = rpm.toString(16);
        for(var i= 0;i<rmpData.length;i++){
            settingArr[(6-i)] = replaceData(settingArr[(6-i)],rmpData.charAt(rmpData.length-i-1));
        }
    }
    var settingCmd ='';
    for(var i in settingArr){
        settingCmd +=settingArr[i];
    }
     console.log('settingCmd :'+settingCmd);
     return settingCmd;
}

function replaceData(hexData,replacData){
    var replaceChar = hexData.charAt(1);
    var res = hexData.replace(replaceChar, replacData);
    return res;
}

function getInfoData(data,type){
    var info = {};
    if(type === 'ab00'){
        var obj = ab00Data;
    }else if(type === 'ab01'){
        var obj = ab01Data;
    }
    var keys = Object.keys(obj);
    var count = keys.length;

    /*var mPressure = data.substring(6,10);
    var mHight = data.substring(10,14);    　//氣壓
    var mTemperature = data.substring(14,16);   //溫度
    var mHumidity = data.substring(16,18);      //濕度
    var mLight = data.substring(18,22);         //照明
    console.log('mPressure : '+mPressure);
    console.log('mHight : '+mHight);
    console.log('mTemperature : '+mTemperature);
    console.log('mHumidity : '+mHumidity);
    console.log('mLight : '+mLight);
    console.log( 'obj : '+ JSON.stringify(obj) );
    console.log( 'keys : '+ JSON.stringify(keys) );*/
    for(var i =0;i<count;i++){
        console.log( keys[i]+' : '+ obj[keys[i]]);
        info[ keys[i] ] = getIntData(obj[keys[i]],data);
    }
    return info;
}

function getIntData(arrRange,data){
    var ret = {};
    var start = arrRange[0];
    var end = arrRange[1];
    var diff = arrRange[2];
    var tmp = data.substring(start,end);
    var intData = getData(tmp);
    if(diff === 1)
        return intData;
    else
        return intData/diff;
}

function getData(str){
    var length = str.length/2;
    var mStr = '';
    for(var i =0;i<length;i++){
        mStr = mStr+str.substring(i*2+1,(i+1)*2);
    }
    return parseInt(mStr,16);
}