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
 *  2024/08/23 0.1.1 空更新するフィールドを追加(ルックアップ対応)
 */

jQuery.noConflict();

(async (jQuery_, PLUGIN_ID_) => {
  'use strict';

  // 設定パラメータ
  const ParameterTextFind = 'paramTextFind';  // 更新表示
  const ParameterCheckTimer = 'paramCheckTimer';  // 更新表示
  const ParameterFieldDate = 'paramFieldDate';      // 日付フィールド
  const ParameterFieldEmpty = 'paramFieldEmpty' // 空更新フィールド

  // 環境設定
  const Parameter = {
    // 表示文字
    Lang: {
      en: {
        plugin_titile: 'Semi-Automatic Update Date Fields Plugin',
        plugin_description: 'Semi-automatic update of date field',
        label_plugin: 'Please Setting Calculate and Date Field',
        label_message: 'Update Date(Find Text)',
        label_date: 'Date Field      ',
        label_empty: "Empty Renew Field",
        value_show: 'Show Timer',
        plugin_cancel: 'Cancel',
        plugin_ok: ' Save ',
      },
      ja: {
        plugin_titile: '日付フィールド(半)自動更新 プラグイン',
        plugin_description: '日付フィールドを(半)自動で更新します',
        label_plugin: '計算フィールドと日付フィールドを設定して下さい',
        label_message: '更新日付(検索用文字列)',
        label_date: '日付 フィールド',
        label_empty: "空更新 フィールド",
        value_show: 'タイマー表示',
        plugin_cancel: 'キャンセル',
        plugin_ok: '   保存  ',
      },
      DefaultSetting: 'ja',
      UseLang: {}
    },
    Html: {
      Form: '#plugin_setting_form',
      Title: '#plugin_titile',
      Description: '#plugin_description',
      Cancel: '#plugin_cancel',
      Ok: '#plugin_ok',
    },
    Elements: {
      FindText: '#find_text',
      CheckBoxTimer: '#checkbox_timer',
      FieldDate: '#field_date',
      FieldEmpty: '#field_empty',
    },
  };


  /*
  HTMLタグの削除
   引数　：htmlstr タグ(<>)を含んだ文字列
   戻り値：タグを含まない文字列
  */
  const escapeHtml = (htmlstr) => {
    return htmlstr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&quot;').replace(/'/g, '&#39;');
  };

  /*
  ユーザーの言語設定の読み込み
   引数　：なし
   戻り値：なし
  */
  const settingLang = () => {
    // 言語設定の取得
    Parameter.Lang.UseLang = kintone.getLoginUser().language;
    switch (Parameter.Lang.UseLang) {
      case 'en':
      case 'ja':
        break;
      default:
        Parameter.Lang.UseLang = Parameter.Lang.DefaultSetting;
        break;
    }
    // 言語表示の変更
    var html = jQuery(Parameter.Html.Form).html();
    var tmpl = jQuery.templates(html);

    var useLanguage = Parameter.Lang[Parameter.Lang.UseLang];
    // 置き換え
    jQuery(Parameter.Html.Form).html(tmpl.render({ lang: useLanguage })).show();
  };

  /*
  フィールド設定
   引数　：なし
   戻り値：なし
  */
  const settingHtml = async () => {
    var listFeild = await kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', { 'app': kintone.app.getId() });
    console.log("listFeild:%o", listFeild);

    for (const key in listFeild.properties) {
      //console.log("properties key:%o",key);
      try {
        const prop = listFeild.properties[key];
        //console.log("prop:%o",prop);

        // 日付フィールドのみ入れる
        if (prop.type === 'DATE') {
          const option = jQuery('<option/>');
          option.attr('value', escapeHtml(prop.code)).text(escapeHtml(prop.label));

          //console.log("Add DATE option:%o", option);
          jQuery(Parameter.Elements.FieldDate).append(option);
        }

        if (prop.type === 'SINGLE_LINE_TEXT' // 文字列（1行）
          || prop.type === 'MULTI_LINE_TEXT'  // 文字列（複数行）
          || prop.type === 'RICH_TEXT' // リッチエディター
          || prop.type === 'NUMBER' // 数値
          || prop.type === 'CHECK_BOX' // チェックボックス
          || prop.type === 'RADIO_BUTTON' // ラジオボタン
          || prop.type === 'MULTI_SELECT' // 複数選択
          || prop.type === 'DROP_DOWN' // ドロップダウン
          || prop.type === 'DATE' // 日付
          || prop.type === 'TIME' // 時刻
          || prop.type === 'DATETIME' // 日時
          || prop.type === 'LINK' // リンク
        ) {
          const option = jQuery('<option/>');
          option.attr('value', escapeHtml(prop.code)).text(escapeHtml(prop.label));

          //console.log("Add EMPTY option:%o", option);
          jQuery(Parameter.Elements.FieldEmpty).append(option);
        }

      }
      catch (error) {
        console.log("error:%o", error);
      }

      // 現在データの呼び出し
      var nowConfig = kintone.plugin.app.getConfig(PLUGIN_ID_);
      console.log("nowConfig:%o", nowConfig);

      // 現在データの表示
      if (nowConfig[ParameterTextFind]) {
        jQuery(Parameter.Elements.FindText).val(nowConfig[ParameterTextFind]);
      }
      if (nowConfig[ParameterCheckTimer]) {
        jQuery(Parameter.Elements.CheckBoxTimer).prop('checked', nowConfig[ParameterCheckTimer] == 'true');
      }
      if (nowConfig[ParameterFieldDate]) {
        jQuery(Parameter.Elements.FieldDate).val(nowConfig[ParameterFieldDate]);
      }
      if (nowConfig[ParameterFieldEmpty]) {
        jQuery(Parameter.Elements.FieldEmpty).val(nowConfig[ParameterFieldEmpty]);
      }
    }
  };

  /*
  データの保存
   引数　：なし
   戻り値：なし
  */
  const saveSetting = () => {
    // 各パラメータの保存
    var config = {};
    config[ParameterTextFind] = jQuery(Parameter.Elements.FindText).val();
    config[ParameterCheckTimer] = '' + jQuery(Parameter.Elements.CheckBoxTimer).prop('checked');
    config[ParameterFieldDate] = jQuery(Parameter.Elements.FieldDate).val();
    config[ParameterFieldEmpty] = jQuery(Parameter.Elements.FieldEmpty).val();

    console.log('config:%o', config);

    // 設定の保存
    kintone.plugin.app.setConfig(config);
  };

  // 言語設定
  settingLang();
  await settingHtml();

  // 保存
  jQuery(Parameter.Html.Ok).click(() => { saveSetting(); });
  // キャンセル
  jQuery(Parameter.Html.Cancel).click(() => { history.back(); });
})(jQuery, kintone.$PLUGIN_ID);
