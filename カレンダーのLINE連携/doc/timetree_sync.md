# timetree_sync.gs
## 処理概要
**<span style="color: red; ">TimeTree APIは2023/12/22でサービス終了します。それ以降はこのコードは機能しません。</span>とても残念**  
TimeTree APIを使用して、TimeTreeのカレンダーをgoogleカレンダーに同期させるコード。  
ここではTimeTreeの方がえらいのでTimeTree側のカレンダーを正として、予定を同期させる。
GASのトリガーに設定しておけば、任意のタイミングでカレンダーを同期できる。

<br />

## 関数概要
### getUpcomingEvents()
* 1週間分の予定を同期させる。  
TimeTreeのカレンダーとgoogleカレンダーから予定を取得して、タイトル、開始・終了日時が変更されていないかをチェックする。  
変更されている場合はgoogleカレンダーの予定を削除して追加しなおす。  
googleカレンダーに存在しない予定があった場合はaddEvents()を呼び出して予定追加する。  
TimeTreeのカレンダーで予定が削除されていた場合は、googleカレンダーの予定を削除する。

<br />

### addEvents()
* googleカレンダーに予定を登録する。 
予定の説明欄にTimeTreeのeventIdを入れておくことで、予定の修正や削除判定に利用する。   
終日予定だった場合はcreateAllDayEvent()を使用する。  


