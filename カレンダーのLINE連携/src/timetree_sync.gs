//1週間の予定更新(トリガー用)
function getUpcomingEvents() {

  //Timetreeで発行したパーソナルアクセストークン
  var timetreeAccessToken = PropertiesService.getScriptProperties().getProperty('TIMETREE_ACCESS_TOKEN');

  //Googleカレンダーと同期したいカレンダーID
  var timetreeCalenderId = PropertiesService.getScriptProperties().getProperty('TIMETREE_CALENDER_ID');

  //同期先のGoogleカレンダーID
  var googleCalendarId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CALENDER_ID');

  var options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': {
      'Accept': 'application/vnd.timetree.v1+json',
      'Authorization': 'Bearer ' + timetreeAccessToken
    },
    "muteHttpException": true
  };
  
  //upcoming_events APIでは当日から7日間分のみ取得可能
  var getDays = 7;
  
  try{
    
    //TimeTreeの予定を取得
    var timetreeResponse = UrlFetchApp.fetch('https://timetreeapis.com/calendars/' + timetreeCalenderId + '/upcoming_events?days=' + getDays, options);
    var timetreeJsonData = JSON.parse(timetreeResponse.getContentText());
    
    //Googleカレンダーの予定を取得
    var googleCalendar = CalendarApp.getCalendarById(GOOGLE_CALENDER_ID);
    
    var startTime = new Date(Utilities.formatDate(new Date,"JST", "yyyy/MM/dd"));
    var endTime = new Date(Date.parse(startTime) + (getDays * 60 * 60 * 24 * 1000));
    var googleCalendarEvents = googleCalendar.getEvents(startTime, endTime);
    var googleCalendarEventsObjects = {};

    //googleカレンダーの予定を確認
    for (var i in googleCalendarEvents) {
      //予定の説明にtimetreeのeventIdを入れているので、eventIdをkeyにした配列を作る
      googleCalendarEventsObjects[googleCalendarEvents[i].getDescription()] = googleCalendarEvents[i];
    }
    
    //Timetreeの予定を確認
    for (var i= 0 ;i < timetreeJsonData.data.length ; i++){
      var timetreeEvent = timetreeJsonData.data[i];
      
      //googleカレンダーに予定が存在するか
      if(googleCalendarEventsObjects[timetreeEvent.id]){
        var googleCalendarEvent = googleCalendarEventsObjects[timetreeEvent.id];
        
        //終日予定かチェック
        if(googleCalendarEvent.isAllDayEvent() == true && timetreeEvent.attributes.all_day == true){
          //どちらも終日予定
          var googleCalendarStartDate = Utilities.formatDate(googleCalendarEvent.getStartTime(),"JST", "yyyy/MM/dd");
          var googleCalendarEndTime = new Date(Utilities.formatDate(googleCalendarEvent.getEndTime(),"JST", "yyyy/MM/dd"));
          var googleCalendarEndDate = Utilities.formatDate(new Date(googleCalendarEndTime.getYear(),googleCalendarEndTime.getMonth(),googleCalendarEndTime.getDate()-1),"JST", "yyyy/MM/dd");//googleカレンダーの終日予定の最終日は1日多く返ってくるので減算
          var timetreeStartDate = Utilities.formatDate(new Date(timetreeEvent.attributes.start_at),"JST", "yyyy/MM/dd");
          var timetreeEndDate = Utilities.formatDate(new Date(timetreeEvent.attributes.end_at),"JST", "yyyy/MM/dd");
          //タイトル、開始、終了日が一致するかチェック
          if(
            googleCalendarEvent.getTitle() == timetreeEvent.attributes.title
            && googleCalendarStartDate == timetreeStartDate
            && googleCalendarEndDate == timetreeEndDate
          )
          {
            //予定変更なし。そのまま
          }else{
            //予定が変更されている。Googleカレンダー側を削除して追加しなおす
            googleCalendarEvent.deleteEvent();
            addEvents(googleCalendar,timetreeEvent);
          }
        }else if(googleCalendarEvent.isAllDayEvent() == false && timetreeEvent.attributes.all_day == false){
          //どちらも終日予定ではない
          //タイトル、開始、終了日時が一致するかチェック
          if(
            googleCalendarEvent.getTitle() == timetreeEvent.attributes.title
            && Date.parse(googleCalendarEvent.getStartTime()) ==  Date.parse(new Date(timetreeEvent.attributes.start_at))
          && Date.parse(googleCalendarEvent.getEndTime()) ==  Date.parse(new Date(timetreeEvent.attributes.end_at))
          )
          {
            //予定変更なし。そのまま
          }else{
            //予定が変更されている。Googleカレンダー側を削除して追加しなおす
            googleCalendarEvent.deleteEvent();
            addEvents(googleCalendar,timetreeEvent);
          }
        }else{
          //予定が変更されている。Googleカレンダー側を削除して追加しなおす
          googleCalendarEvent.deleteEvent();
          addEvents(googleCalendar,timetreeEvent);
        }
        //予定の確認が出来たので配列から削除
        delete googleCalendarEventsObjects[timetreeEvent.id];
      }else{
        //evet_idに一致する予定がgoogleカレンダーに存在しないので追加       
        addEvents(googleCalendar,timetreeEvent);
      }
    }
    
    //Timetree側で削除された予定をGoogleカレンダーからも削除
    for(var key in googleCalendarEventsObjects) {
      googleCalendarEventsObjects[key].deleteEvent();
    }  
  } catch(e){
    //なんかTimeTreeリクエスト失敗したから雑に追加したログ出力
    console.log('Error:')
    console.log(e)
  }
}

//googleカレンダーに予定追加
function addEvents(googleCalendar,timetreeEvent) {
  var title = timetreeEvent.attributes.title;
  var options = {
    //予定の説明欄にtimetree側のeventIdを入れておく。修正や削除判定に利用
    description: timetreeEvent.id
  }
  
  var nowDate = new Date();
  
  //終日予定判定
  if(timetreeEvent.attributes.all_day){
    var startDate = new Date(timetreeEvent.attributes.start_at.slice(0,10));
    var endDate = new Date(timetreeEvent.attributes.end_at.slice(0,10));
    
    
    //終日予定が複数日にまたがるかチェック
    if(timetreeEvent.attributes.start_at == timetreeEvent.attributes.end_at){
      //1日のみの終日予定
      
      //終了が過去のものは追加せずにスキップ
      var tmpDate = new Date();
      tmpDate.setDate(endDate.getDate() + 1);
      if(nowDate > tmpDate){
        return;
      }
      googleCalendar.createAllDayEvent(title, startDate,options);
    }else{
      //2日以上の終日予定
      endDate.setDate(endDate.getDate() + 1);//createAllDayEventの不具合？終了日が1日少なくなるので加算
      //終了が過去のものは追加せずにスキップ
      if(nowDate > endDate){
        return;
      }
      googleCalendar.createAllDayEvent(title, startDate, endDate,options);
    }
  }else{
    //時間指定の予定
    var startTime = new Date(timetreeEvent.attributes.start_at);
    var endTime = new Date(timetreeEvent.attributes.end_at);
    
    //終了が過去のものは追加せずにスキップ
    if(nowDate > endTime){
      return;
    }
    
    //予定を追加
    googleCalendar.createEvent(title, startTime, endTime,options);      
  }
}