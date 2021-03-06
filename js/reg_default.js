var Registration, email_val, pass_val, type_url, recaptchaCallback, user_status,
    can_submit = false,
    check_captcha = false,
    type_email = false,
    $email_notes = $('.js-reg-email-notes'),
    $pass_notes = $('.js-reg-pass-notes'),
    $captcha_notes = $('.js-reg-captcha-notes'),
    unixtime = Math.floor(Date.now() / 1000) + 86400,
    cookie_live = new Date(new Date().getTime() + 150000),
    myUrl = window.location.href;

// games.mail.ru kit stuff
document.write('<script src="//games.mail.ru/js/kit_client.js?r=' + Math.random() + '"></' + 'script>');

Registration = {
  check_user: function() {
    return $.ajax({
  		url: '/dynamic/user/check_data.php?do=auth',
  		type: 'GET',
  		dataType: 'json'
  	});
  },
  checkUserEmail: function(email_val) {
    return $.ajax({
  		type: 'POST',
  		url: '/dynamic/user/check_data.php?do=email',
  		dataType: 'json',
  		data: {email: email_val}
  	});
  },
  checkUserPass: function(email, pass) {
    if (type_email) {
      // partner mail (mail,bk, indbox, etc)
      type_url = '/dynamic/general/ajax.php?check=mailru_password';
    } else {
      //not mail email
      type_url = '/dynamic/general/ajax.php?check=password';
    }
    return $.ajax({
      type: 'POST',
      url: type_url,
      dataType: 'json',
      data: {password: pass, email:email, login: ''}
    });
  },
  checkRecaptcha: function() {
    return $.ajax({
      url: '/dynamic/general/ajax.php?check=recaptcha',
      type: 'post',
      dataType: 'json',
      data: {response: $('#g-recaptcha-response').val()}
    });
  },
  check_user_process: function(data) {
    user_status = data.user;
    switch (data.user) {
      case 0:
        // no auth, no reg
        if (Registration.getCookie('Mpop')) {
          document.cookie = "Mpop=; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=.mail.ru; path=/";
        }
        break;
      case 2:
        // auth, no reg
        $('.js-reg-user-email').html(data.mail);
        $('.js-reg-oneclick').fadeIn();
        break;
    }
  },
  getCookie: function(name) {
    var matches;
    matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    if (matches) {
      return decodeURIComponent(matches[1]);
    } else {
      return void 0;
    }
  },
  checkUserEmail_process: function(data) {
    if (data.valid) {
      $email_notes.attr('class', 'registration_notes js-reg-email-notes').html('')
      if (data.partner === 1) {
        $('.js-reg-form-action').attr('action', 'https://auth.mail.ru/cgi-bin/auth?FakeAuthPage=https://wf.mail.ru/auth&Page='+encodeURIComponent('https://wf.mail.ru/dynamic/auth/?forum_reg=' + encodeURIComponent(myUrl)));
        $('.js-reg-email-input').attr('name', 'Login');
        $('.js-reg-pass-input').attr('name', 'Password');
        $('.js-reg-passrow, .js-reg-submit').removeClass('display-none');
        $('.js-reg-capcha, .js-reg-next').addClass('display-none');
        type_email = true;
        check_captcha = false;
      } else {
        $('.js-reg-form-action').attr('action', '/dynamic/register/?a=register&redirect_url=' + encodeURIComponent(myUrl));
        $('.js-reg-email-input').attr('name', 'mail');
        $('.js-reg-pass-input').attr('name', 'password_general');
        $('.js-reg-passrow, .js-reg-capcha, .js-reg-submit').removeClass('display-none');
        $('.js-reg-next').addClass('display-none');
        type_email = false;
        check_captcha = true;
      }
    } else {
      $email_notes.attr('class', 'registration_notes js-reg-email-notes').html('');
      $email_notes.addClass('error').html(data.error);
    }
  },
  submit_proccess: function() {
    $('.js-reg-loader').fadeIn();
    pass_val = $('.js-reg-pass-input').val();
    Registration.checkUserPass(email_val, pass_val).done(function(data) {
      console.log('pass data', data);
      if (data.valid) {
        if (check_captcha) {
          Registration.checkRecaptcha().done(function(data) {
            console.log('captcha data', data);
            if (data.valid) {
              document.cookie = "confirm_reg=" + unixtime + "; path=/;";
              document.cookie = 'show_regdone=true; expires=' + cookie_live.toUTCString()+'; path=/;';
              can_submit = true;
              $('.js-reg-form-action').submit();
            } else {
              $('.js-reg-loader').hide();
              $email_notes.attr('class', 'registration_notes js-reg-email-notes').html('');
              $pass_notes.attr('class', 'registration_notes js-reg-pass-notes').html('');
              $captcha_notes.attr('class', 'registration_notes js-reg-captcha-notes').html('')
              $captcha_notes.addClass('error').html('РџРѕР¶Р°Р»СѓР№СЃС‚Р°, РїСЂРѕР№РґРёС‚Рµ РїСЂРѕРІРµСЂРєСѓ "РЇ РЅРµ СЂРѕР±РѕС‚"');
              grecaptcha.reset();
              return false;
            }
          }).fail(function() {
            $('.js-reg-loader').hide();
            $email_notes.attr('class', 'registration_notes js-reg-email-notes').html('');
            $pass_notes.attr('class', 'registration_notes js-reg-pass-notes').html('');
            $email_notes.addClass('error').html('РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР°. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰Рµ СЂР°Р·');
            return false;
          });
        } else {
          document.cookie = "confirm_reg=" + unixtime + "; path=/;";
          document.cookie = 'show_regdone=true; expires=' + cookie_live.toUTCString()+'; path=/;';
          can_submit = true;
          $('.js-reg-form-action').submit();
        }

      } else {
        $('.js-reg-loader').hide();
        $('.js-reg-pass-input').val('');
        grecaptcha.reset();
        $email_notes.attr('class', 'registration_notes js-reg-email-notes').html('')
        $pass_notes.attr('class', 'registration_notes js-reg-pass-notes').html('')
        $email_notes.addClass('error').html('РћС€РёР±РєР° РІ РїР°СЂРѕР»Рµ РёР»Рё РїРѕС‡С‚Рµ.');
        return false;
      }
    }).fail(function() {
      $('.js-reg-loader').hide();
      $email_notes.attr('class', 'registration_notes js-reg-email-notes').html('');
      $pass_notes.attr('class', 'registration_notes js-reg-pass-notes').html('');
      $email_notes.addClass('error').html('РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР°. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰Рµ СЂР°Р·');
      return false;
    });
  }
}

// РєРЅРѕРїРєР° РґР°Р»РµРµ, РєРѕС‚РѕСЂР°СЏ РїСЂРѕРІРµСЂСЏРµС‚ email
$(document).on('click', '.js-reg-next', function(e) {
  e.preventDefault();

  email_val = $('.js-reg-email-input').val()
  $('.js-reg-email-input').addClass('changeable');

  if (email_val == '') {
    $email_notes.attr('class', 'registration_notes js-reg-email-notes').html('');
    $email_notes.addClass('error').html('РќРµРѕР±С…РѕРґРёРјРѕ Р·Р°РїРѕР»РЅРёС‚СЊ РїРѕР»Рµ');
    return false;
  }

  Registration.checkUserEmail(email_val).done(function(data) {
    Registration.checkUserEmail_process(data);
  }).fail(function() {
    $email_notes.attr('class', 'registration_notes js-reg-email-notes').html('');
    $pass_notes.attr('class', 'registration_notes js-reg-pass-notes').html('');
    $email_notes.addClass('error').html('РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР°. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰Рµ СЂР°Р·');
  });
});

// РµСЃР»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЂРµС€РёР» РїРѕРјРµРЅСЏС‚СЊ email
$(document).on('change', '.js-reg-email-input.changeable', function() {
  Registration.checkUserEmail(email_val).done(function(data) {
    Registration.checkUserEmail_process(data);
  })
});

// check text CASE
$(document).on('keypress', '.js-reg-pass-input', function(event) {
  var keyCode = event.which?event.which:event.keyCode;
  var shiftKey = event.shiftKey?event.shiftKey:((keyCode == 16)?true:false);
  if ((keyCode >= 1072 && keyCode <= 1103) || (keyCode >= 1040 && keyCode <= 1071)) {
    //keyboad layout is russian
    $pass_notes.attr('class', 'registration_notes js-reg-pass-notes').html('');
    $pass_notes.addClass('warning').html('Р’РЅРёРјР°РЅРёРµ! Р’РєР»СЋС‡РµРЅР° СЂСѓСЃСЃРєР°СЏ СЂР°СЃРєР»Р°РґРєР° РєР»Р°РІРёР°С‚СѓСЂС‹!');
  } else if (((keyCode >= 65 && keyCode <= 90) && !shiftKey) || ((keyCode >= 97 && keyCode <= 122) && shiftKey)) {
    //caps lock on
    $pass_notes.attr('class', 'registration_notes js-reg-pass-notes').html('');
    $pass_notes.addClass('warning').html('Р’РЅРёРјР°РЅРёРµ! Р’РєР»СЋС‡РµРЅ CAPS LOCK!');
  } else {
    //caps lock off & keyboard layout is english
    $pass_notes.attr('class', 'registration_notes js-reg-email-notes').html('');
  }
});

// open docs on new window
$(document).on('click', '.js-agreement', function(event) {
  var url = $(this).attr('href');
  window.open(url, '', 'width=800, height=600, toolbar=no, scrollbars=yes');
  return false;
});

// РєРЅРѕРїРєР° Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ
$(document).on('submit', '.js-reg-form-action', function() {
  if (can_submit) {
    return true;
  } else {
    Registration.submit_proccess();
    return false;
  }
})

$(document).on('click', '.js-tab-n', function () {
  var set = $(this).data('tabs'),
      tabs = $('.js-tab-n[data-tabs='+set+']'),
      index = tabs.index($(this));
  tabs.removeClass('active');
  $(this).addClass('active');
  $('div[data-tabs-set='+set+']').addClass('display-none');
  $('div[data-tabs-set='+set+']').eq(index).removeClass('display-none');
});

$(document).on('click', '.js-new-mail', function () {
  GMR.showSignupForm();
});
$(document).on('click', '.js-login-ok', function () {
  GMR.showOKSigninForm();
});
$(document).on('click', '.js-login-vk', function () {
  GMR.showVKSigninForm();
});
$(document).on('click', '.js-login-rts', function () {
  GMR.showRTSigninForm();
});

$(document).on('click', '.js-reg-auth, .js-signin', function() {
  if ($(this).hasClass('reg_signin')) {
    var user_mail = $('.js-reg-email-input').val();
    $('.js-reg-email-input').val('');
    $('.js-tab-n').eq(0).click();
    $('#js_kit_signin__box__login').val(user_mail);
  } else {
    var unixtime = Math.floor(Date.now() / 1000) + 86400;
    document.cookie = "confirm_reg=" + unixtime + "; path=/;";
    document.cookie = "show_reg_form=" + unixtime + "; path=/;";
    document.cookie = 'show_regdone=true; expires=' + cookie_live.toUTCString()+'; path=/;';
    GMR.showSigninForm();
  }
});

$(document).on('click', '.js-reg-ok', function() {
  var unixtime = Math.floor(Date.now() / 1000) + 86400;
  document.cookie = "confirm_reg=" + unixtime + "; path=/;";
  document.cookie = "show_reg_form=" + unixtime + "; path=/;";
  document.cookie = 'show_regdone=true; expires=' + cookie_live.toUTCString()+'; path=/;';
  GMR.showOKSigninForm();
});

$(document).on('click', '.js-reg-vk', function() {
  var unixtime = Math.floor(Date.now() / 1000) + 86400;
  document.cookie = "confirm_reg=" + unixtime + "; path=/;";
  document.cookie = "show_reg_form=" + unixtime + "; path=/;";
  document.cookie = 'show_regdone=true; expires=' + cookie_live.toUTCString()+'; path=/;';
  GMR.showVKSigninForm();
});

$(document).on('click', '.js-reg-newmail', function() {
  var unixtime = Math.floor(Date.now() / 1000) + 86400;
  document.cookie = "confirm_reg=" + unixtime + "; path=/;";
  document.cookie = "show_reg_form=" + unixtime + "; path=/;";
  document.cookie = 'show_regdone=true; expires=' + cookie_live.toUTCString()+'; path=/;';
  GMR.showSignupForm();
});

// РєРЅРѕРїРєРё РґР»СЏ РѕС‚РєСЂС‹С‚РёСЏ С„РѕСЂРјС‹ РІ РїРѕРїР°РїРµ
$(document).on('click', '.js-auth-init', function() {
  $('.js-regform-wrap').show();
  $('.js-tab-n').eq(0).click();
});
$(document).on('click', '.js-reg-init', function() {
  $('.js-regform-wrap').show();
  $('.js-tab-n').eq(1).click();
});
$(document).on('click', '.js-regform-close', function() {
  $('.js-regform-wrap').hide();
});

recaptchaCallback = function() {
  check_captcha = true;
};

$(function() {
  // check user status
  Registration.check_user().done(function(data) {
    Registration.check_user_process(data);
  })

  //gmr settings
  GMR.config({
    download_heading: 'РЈСЃС‚Р°РЅРѕРІРєР° РёРіСЂС‹',
    download_url: 'https://static.dl.mail.ru/WarfaceLoader.exe',
    download_theme: 'dark',
    gc_id:  "0.1177",
    page: 'https://wf.mail.ru/dynamic/auth/?forum_reg=' + encodeURIComponent(myUrl),
    restore_page: 'https://wf.mail.ru/user/password',
    fake_auth_page: "https://wf.mail.ru/auth"
  });
})