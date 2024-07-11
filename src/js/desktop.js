/*
 *日付の(半)自動更新
 * Copyright (c) 2024 noz-23
 *  https://github.com/noz-23/
 *
 * Licensed under the MIT License
 * 
 *  利用：
 *   JQuery:
 *     https://jquery.com/
 *     https://js.cybozu.com/jquery/3.7.1/jquery.min.js
 *   
 *   jsrender:
 *     https://www.jsviews.com/
 *     https://js.cybozu.com/jsrender/1.0.13/jsrender.min.js
 * 
 * History
 *  2024/07/03 0.1.0 初版とりあえずバージョン
 *
 */

jQuery.noConflict();

(async (PLUGIN_ID_) => {
  'use strict';

  // Kintone プラグイン 設定パラメータ
  const config = kintone.plugin.app.getConfig(PLUGIN_ID_);

  const findText = config['paramTextFind'];   // 更新表示
  const checkTimer = config['paramCheckTimer'];   // タイマーの表示
  const writeDate = config['paramFieldDate'];     // 日付フィールド名

  const EVENTS = [
    //'app.record.create.show', // 作成表示
    //'app.record.edit.show',   // 編集表示
    'app.record.index.show',  // 一覧表示
    //'app.record.create.edit', // 作成表示
    //'app.record.edit.edit',   // 編集表示
    //'app.record.index.edit',  // 一覧表示
    //'app.record.create.submit', // 作成表示
    //'app.record.edit.submit',   // 編集表示
    //'app.record.index.submit',  // 一覧表示
    //'app.record.detail.show', // 作成表示
  ];

  var startDate = '';
  var timerId = null;
  const ONE_SECOND = 1000;

  kintone.events.on(EVENTS, async (events_) => {
    console.log('events_:%o', events_);

    let divTimer = document.createElement("div");
    divTimer.className = 'kintoneplugin-label';

    // タイマー表示
    if (checkTimer == 'true') {
      // 一覧の上部エレメント取得 
      var headElemnt = kintone.app.getHeaderSpaceElement();
      headElemnt.appendChild(divTimer);
    }

    startDate = await getDescriptionDate(findText);
    console.log('startDate:%o', startDate);
    timerId = setInterval(() => { countDown(divTimer) }, ONE_SECOND);
    return events_;
  });

  const getDescriptionDate = async (find_) => {
    const param = {
      app: kintone.app.getId(),   // アプリ番号
    };
    //console.log('find_:%o',find_);

    // 説明文
    var setting = await kintone.api(kintone.api.url('/k/v1/app/settings.json', true), 'GET', param);
    var description = setting.description;
    //console.log('description:%o',description);

    var pos = description.indexOf(find_);

    var dateDes = '';
    if (pos == -1) {
      // 文字がない場合は説明に追加
      var str = setting.description + '<BR>' + find_ + '<BR>';
      var data = {
        app: kintone.app.getId(),   // アプリ番号
        description: str
      }

      //console.log('data:%o', data);

      await kintone.api(kintone.api.url('/k/v1/preview/app/settings.json', true), 'PUT', data);
      await kintone.api(kintone.api.url('/k/v1/preview/app/deploy.json', true), 'POST', { apps: [{ app: kintone.app.getId() }] });
    } else {
      //1234567890
      //2024/07/07
      try {
        console.log('pos:%o, length,%o', pos, find_.length);
        dateDes = description.substring(pos + find_.length, pos + find_.length + 10);
      } catch {
        console.log('catch');
      }
    }
    //console.log('dateDes:%o', dateDes);

    return dateDes;
  }

  /*
  アプリ説明にある｢更新実行日付：｣の更新
    引数　：find_ 更新文字
    戻り値：なし
  */
  const renewDescriptionDate = async (find_) => {
    const param = {
      app: kintone.app.getId(),   // アプリ番号
    };
    var setting = await kintone.api(kintone.api.url('/k/v1/app/settings.json', true), 'GET', param);

    var description = setting.description;

    // 先頭からfind_までの文字
    var head = description.substring(0, description.indexOf(find_));

    // find_の後ろからの文字
    var bottom = description.substring(description.indexOf(find_));
    bottom = bottom.substring(bottom.indexOf('<'));

    // 日付を更新
    var str = head + find_ + escapeHtml(getToDay()) + bottom;
    //console.log('str:%o', str);

    var data = {
      app: kintone.app.getId(),   // アプリ番号
      description: str
    }

    //console.log('data:%o', data);
    await kintone.api(kintone.api.url('/k/v1/preview/app/settings.json', true), 'PUT', data);
    await kintone.api(kintone.api.url('/k/v1/preview/app/deploy.json', true), 'POST', { apps: [{ app: kintone.app.getId() }] });
  }

  /*
  HTMLタグの削除
   引数　：htmlstr タグ(<>)を含んだ文字列
   戻り値：タグを含まない文字列
  */
  const escapeHtml = (htmlstr) => {
    return htmlstr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&quot;').replace(/'/g, '&#39;');
  };

  /*
   現在日付の取得
    2024-07-10
    形式の文字 
   */

  const getToDay = () => {
    var date = new Date();
    const year = ('0000' + date.getFullYear()).slice(-4);
    const month = ('00' + (date.getMonth() + 1)).slice(-2);
    const day = ('00' + date.getDate()).slice(-2);
    return year + '-' + month + '-' + day;
  }

  /*
   カウントダウン
   https://tcd-theme.com/2021/08/javascript-countdowntimer.html
   */
  const countDown = async (element_) => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const diff = tomorrow.getTime() - now.getTime();

    // カウントダウン
    const calcHour = ('00' + (Math.floor(diff / 1000 / 60 / 60))).slice(-2);
    const calcMin = ('00' + (Math.floor(diff / 1000 / 60) % 60)).slice(-2);
    const calcSec = ('00' + (Math.floor(diff / 1000) % 60)).slice(-2);

    element_.innerHTML = calcHour + ':' + calcMin + ':' + calcSec;

    var nowStr = getToDay();
    if (nowStr !== startDate) {
      // 更新日付と本日日付が違う場合は更新
      console.log('nowStr:%o, startDate:%o', nowStr, startDate);

      clearInterval(timerId);
      await renewToday();
      await renewDescriptionDate(findText);
      location.reload(true);
    }
  }

  /*
    日付フィールドの更新
  */
  const renewToday = async () => {
    // KintoneRestAPIClientの呼び出し
    const client = new KintoneRestAPIClient();

    // レコードデータの取得
    const paramGet = {
      app: kintone.app.getId(),   // アプリ番号
      fields: [writeDate]
    };
    // kintone レコード取得
    var allRecords = await client.record.getAllRecords(paramGet);
    //console.log("allRecords:%o", allRecords);

    // 時間の取得
    var now = getToDay();
    // 更新
    const paramUpdate = {
      app: kintone.app.getId(),   // アプリ番号
      records: []
    };
    for (var rec of allRecords) {
      //console.log("rec:%o", rec);
      paramUpdate.records.push({ id: rec['$id'].value, record: { [writeDate]: { value: now } } });
    }
    //console.log("paramUpdate:%o", paramUpdate);

    var result = await client.record.updateAllRecords(paramUpdate);
    //console.log("result:%o", result);

  }

  /*
  スリープ関数
   引数　：ms_ ms単位のスリープ時間
   戻り値：なし
  */
  const Sleep = (ms_) => {
    return new Promise(resolve_ => setTimeout(resolve_, ms_));
  };

})(kintone.$PLUGIN_ID);
