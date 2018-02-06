var authData = {};
var project = 'wf';
var page = 'promo/nycontracts2018';


var setCookie = function (name, value, options) {
	options = options || {};

	var expires = options.expires;

	if (typeof expires == "number" && expires) {
		var d = new Date();
		d.setTime(d.getTime() + expires * 1000);
		expires = options.expires = d;
	}
	if (expires && expires.toUTCString) {
		options.expires = expires.toUTCString();
	}

	value = encodeURIComponent(value);

	var updatedCookie = name + "=" + value;

	for (var propName in options) {
		updatedCookie += "; " + propName;
		var propValue = options[propName];
		if (propValue !== true) {
			updatedCookie += "=" + propValue;
		}
	}

	document.cookie = updatedCookie;
};

var getCookie = function (name) {
	var cookie = " " + document.cookie;
	var search = " " + name + "=";
	var setStr = null;
	var offset = 0;
	var end = 0;
	if (cookie.length > 0) {
		offset = cookie.indexOf(search);
		if (offset != -1) {
			offset += search.length;
			end = cookie.indexOf(";", offset)
			if (end == -1) {
				end = cookie.length;
			}
			setStr = unescape(cookie.substring(offset, end));
		}
	}
	return (setStr);
};

var delCookie = function (name) {
	document.cookie = name + "=" + "; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain" + project + ".mail.ru; path=/";
	document.cookie = name + "=" + "; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=.mail.ru; path=/";
};

var userAuth = function () {
	var authContent;

	GMR.config({
		page: 'https://' + project + '.mail.ru/' + page + '/',
		fake_auth_page: 'https://' + project + '.mail.ru/' + page + '/',
		restore_page: "https://" + project + ".mail.ru/user/password",
		download_url: "https://static.dl.mail.ru/WarfaceLoader.exe",
		download_theme: 'dark',
		gc_detect_timeout: 1.5,
		gc_id: "0.1177",
	});

	$.ajax({
		url: '/dynamic/user/check_data.php?do=auth',
		type: 'GET',
		async: false,
		dataType: 'json'
	})
	.done(function (data) {
		var eventAuth;
		authData = data;
		eventAuth = new Event('authLoad');
		document.dispatchEvent(eventAuth);
	});

	switch (authData.user) {
		case 0:
			authContent = '<span class="auth__link js-reg-init">РќР°С‡Р°С‚СЊ РёРіСЂР°С‚СЊ</span> <span class="auth__link js-auth-init">Р’РѕР№С‚Рё</span>';
			$('.js-button').addClass('js-auth-init');
			break;
		case 1:
		case 3:
			authContent = '<div class="auth__menu">РџСЂРёРІРµС‚, ' + authData.username;
			authContent +=	'<div class="auth__menu-list">';
			authContent += 		'<span class="auth__menu-item auth__link js-auth-init">РЎРјРµРЅРёС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ</span>';
			authContent += 		'<a href="/dynamic/auth/?plogout=1" class="auth__menu-item auth__link">Р’С‹Р№С‚Рё</a>';
			authContent += 	'</div>';
			authContent += '</div>';
			$('.js-button').addClass('js-get-contract');
			break;
		case 2:
			authContent = '<div class="auth__menu">' + authData.mail;
			authContent +=	'<div class="auth__menu-list">';
			authContent += 		'<span class="auth__menu-item auth__link js-show_reg">Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ</span>';
			authContent += 		'<span class="auth__menu-item auth__link js-auth-init">РЎРјРµРЅРёС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ</span>';
			authContent += 	'</div>';
			authContent += '</div>';
			
			showRegModal();
			$('.js-button').addClass('js-show_reg');
			break;
	}

	$('.js-auth').html(authContent);
};

var showRegModal = function () {
	var auth_modal = '', auth_rules = '';

	$.ajax({
		url: '/static/' + project + '.mail.ru/docs/documents.json',
		type: 'GET',
		async: false,
		dataType: 'json'
	})
			.done(function (data) {
				auth_rules = data;
			});

	auth_modal += '<div class="authpopup_wrapper" id="registerFinish">';
	auth_modal += '<div class="authpopup js-popup">';
	auth_modal += '<div class="authpopup__header">Р РµРіРёСЃС‚СЂР°С†РёСЏ<div class="authpopup__close js-auth_close">вњ•</div></div>';
	auth_modal += '<div class="authpopup__inner">';
	auth_modal += '<div class="authpopup__content">' + auth_rules.doc_links + '</div>';
	auth_modal += '<div class="authpopup__form__row tcenter">';
	auth_modal += '<button class="authpopup__form__button js-auth_close" name="do_form" value="1" tabindex="2">РћС‚РјРµРЅРёС‚СЊ</button>';
	auth_modal += '<button class="authpopup__form__button js-signup" value="1" tabindex="2">Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ</button>';
	auth_modal += '</div>';
	auth_modal += '</div>';
	auth_modal += '</div>';
	auth_modal += '</div>';

	$('body').append(auth_modal);
};

var userRegister = function () {
	var userMail;
	var mpopCookie = getCookie('Mpop');
	var unixtime = Math.floor(Date.now() / 1000) + 86400;

	document.cookie = "confirm_reg=" + unixtime + "; path=/;";

	if (typeof(mpopCookie) == 'string' && mpopCookie.length > 0) {
		var mpopParsed = mpopCookie.split(':');
		if (typeof(mpopParsed[2]) == 'string' && mpopParsed[2].length > 0) {
			userMail = mpopParsed[2];
		}
	}

	$.ajax({
		url: '/dynamic/register/?a=register',
		type: 'POST',
		async: false,
		data: {
			mail: userMail,
			mailru_domains: userMail.split('@')[1],
			name: 'u_' + hex_md5(userMail + new Date().getTime()).substr(1, 10),
			redirect_url: 'https://' + project + '.mail.ru/' + page + '/'
		},
	}).done(function () {
		window.location.reload();
	});
};

$(document).on('click', '.js-show_reg', function (event) {
	event.preventDefault();
	showRegModal();
});

$(document).on('click', '.js-signup', function (event) {
	event.preventDefault();
	userRegister();
});

$(document).on('click', '.js-auth_close', function (event) {
	event.preventDefault();
	$('#registerFinish').remove();
});

$(document).on('click', '.js-game_button', function () {
	GMR.detectAndDownload();
	return false;
});

document.write('<link rel="stylesheet" href="https://' + project + '.cdn.gmru.net/static/' + project + '.mail.ru/css/promo/userauth.css">');
document.write('<script src="//games.mail.ru/js/kit_client.js?r=' + Math.random() + '"></' + 'script>');
if (document.readyState != 'loading') {
	userAuth();
} else {
	document.addEventListener('DOMContentLoaded', userAuth);
}