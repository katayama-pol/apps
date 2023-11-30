//LINE通知に含めたいGoogleカレンダー
var googleCalendar = {
  "sample@gmail.com" : "予定",
  "ja.japanese#holiday@group.v.calendar.google.com": "祝日",
};

var weekday = ["日", "月", "火", "水", "木", "金", "土"];

//1週間の予定(トリガー用)
function pushWeekly() {

  var calendars = CalendarApp.getAllCalendars();
  var dt = new Date()
  var message = "1週間の予定です。\n\n";

  for ( var i = 0;  i < 7;  i++ ) {

    //週の予定文ヘッダー生成
    dt.setDate(dt.getDate() + 1);
    message += Utilities.formatDate(dt, 'JST', '◆ MM/dd(' + weekday[dt.getDay()] + ')') + "\n";

    var dayText = "";
    for(g in calendars) {
      var calendar = calendars[g];

      var calendarName = googleCalendar[calendar.getId()]
      if ( calendarName == undefined ) {
        continue;
      }

      var events = calendar.getEventsForDay(dt);
      if( events.length == 0 ) {
        continue;
      }

      //カレンダー名と予定を出力
      dayText += "< " + calendarName + " >\n";
      for(g in events) {
        dayText += DayText(events[g]);
      }
      dayText += "\n"
    }

    //何もなければ予定なしを出力
    if ( dayText == "") {
        dayText += "予定なし\n\n";
    }
    message += dayText;
  }

  sendToLine(message);
}

//今日の予定(トリガー用)
function pushToday() {

  var events = CalendarApp.getDefaultCalendar().getEventsForDay(new Date());
  var dt = new Date()
  var message = "今日の予定は";

  if (events.length === 0) {
    message += "ありません。";
    sendToLine(message);
    return;
  }

  message += "\n";
  events.forEach(function(event) {
    var title = event.getTitle();
    var start = HmFormat(event.getStartTime());
    var end = HmFormat(event.getEndTime());
    message += "◆" + title + ": " + start + " ~ " + end + "\n";
  });
  message += "です。";
 
  sendToLine(message);
}

//メッセージ送信
function sendToLine(message){

  //LINE Developersで発行したチャネルアクセストークン
  var lineChannelAccessToken = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');
  //LINEのユーザID
  var lineUserId = PropertiesService.getScriptProperties().getProperty('USER_ID');

  //deleteTrigger();
 
  var url = "https://api.line.me/v2/bot/message/push";

  var postData = {
    "to": lineUserId,
    "messages": [{
      "type": "text",
      "text": message,
    }]
  };

  var options = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      'Authorization': 'Bearer ' + lineChannelAccessToken,
    },
    "payload": JSON.stringify(postData)
  };

  //LINEにメッセージ送信
  var response = UrlFetchApp.fetch(url, options);
}

//予定の時間とタイトルを作成
function DayText(event) {
  return TimeText(event.getStartTime()) + ' ~ ' + TimeText(event.getEndTime()) + " :" + event.getTitle() + '\n';
}

//時間出力のフォーマット変換
function TimeText(str){
  return Utilities.formatDate(str, 'JST', 'HH:mm');
}