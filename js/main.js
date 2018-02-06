//--------------------------------------------------------------------
// timer

var promoTimer = {
	init: function (finish, container) {
		$(container).countdown({
			until: finish,
			format: 'dhMS',
			padZeroes: true,
			compact: true,
			alwaysExpire: true,
			compactLabels: ['', '', '', 'д'],
			onExpiry: this.end,
			serverSync: this.serverTime
		});
	},
	serverTime: function () {
		var time = null;
		$.ajax({
			url: 'https://wf.mail.ru/dynamic/all/time.php',
			async: false,
			dataType: 'text',
			success: function (text) {
				time = new Date(text);
			},
			error: function (http, message, exc) {
				time = new Date();
			}
		});
		return time; 
	},
	end: function () {
		$('.js-timer').html('Акция завершена');
	}
};

//--------------------------------------------------------------------
// Sliders

$(document).ready(function () {
	var scroll = document.querySelector('.js-scroll');
	SimpleScrollbar.initEl(scroll);

	$('.js-weapons-slider').slick({
		slidesToShow: 1,
		arrows: true,
		autoplay: true,
		autoplaySpeed: 3500,
		swipe: false
	});
});

//--------------------------------------------------------------------
// Cookies 

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

//--------------------------------------------------------------------
// events

var active_server = 0,
	info_common = {},
	can_start = false,
	events = {
		URL : {
			INFO: '/dynamic/minigames/?g=promo_ny&a=info',
			GET_TASK: '/dynamic/minigames/?g=promo_ny&a=get',
			BUY: '/dynamic/minigames/?g=promo_ny&a=buy',
			GET_PRIZE: '/dynamic/minigames/?g=promo_ny&a=get_bonus'
		},

		ajax : function(url, sendData = {}) {
			var data = $.parseJSON($.ajax({
	            url: url,
	            async: false,
	            type: 'POST',
	            data: sendData,
	            dataType: 'json'
	        }).responseText);

	        return data;    
		},

		init : function() {
			var info = this.ajax(this.URL.INFO),
				info_char = {},
				is_find = false,
				cookies_server = getCookie('active_server');

			if(!info.error) {
				info_common = info;
				can_start = true;

				if(info.chars.length != 0) {
					if(cookies_server && info.chars[cookies_server]) {
						events.changeServer(cookies_server);
					} else {
						$.each(info.chars, function(i, item) {
							if(!is_find) {
								if(info.events[i].length !== 0) {
									events.changeServer(i);
									is_find = true;
								} else if(info.last_event[i] !== 0) {
									events.changeServer(i);
								}						
							}
						});							
					}
				}

				if(active_server > 0) {
					insert.tasks(info);
					insert.serverHeader(info.chars, active_server);
				} else if(info.chars.length != 0 && active_server == 0) {
					insert.serverTask(info.chars);	
					$('.js-start').show();		
				} else {
					can_start = false;
					$('.js-start').show();
				}			
			} else {
				$('.js-start').show();	
			}
			
			$('.js-loader').hide();

			this.addTimerReload();
		},

		getContract : function(contract) {
			var info = this.ajax(this.URL.GET_TASK, {shard : active_server, type: contract}),
				text_message = ['Ты выполнил все задания из раздела "Спецоперации"','Ты выполнил все PVE-задания','Ты выполнил все PVP-задания'];

			$('.js-error-change-contarct').hide();
			if(info.error) {
				if(info.status == -3) {
					$('.js-choose-contract-button[data-contract="' + contract + '"]').html(text_message[contract-1]).addClass('is-disable');
				} else {
					$('.js-error-change-contarct').html('Произошла ошибка, попробуйте позже');
				}
				$('.js-error-change-contarct').show();
			} else {
				info_common = info;
				insert.tasks(info);
				insert.serverHeader(info.chars, active_server);		
			}
		},

		buyEvent : function(type) {
			var info = this.ajax(this.URL.BUY, {shard : active_server, type: type});

			if(info.error) {
				if(info.status == -2) {
					this.showError('Недостаточно кредитов', 'Для продолжения вам необходимо пополнить счет', true);
				} else {
					this.showError('Ошибка', 'Произошла ошибка, попробуйте позже', false);
				}
			} else {
				info_common = info;
				insert.tasks(info);
			}
		},

		showError : function(title, text, buy) {
			$('.js-error-popup-title').html(title);
			$('.js-error-popup-text').html(text);
			if(buy) {
				$('.js-error-popup-bt-close').hide();
				$('.js-error-popup-bt-buy').show();
			} else {
				$('.js-error-popup-bt-close').show();
				$('.js-error-popup-bt-buy').hide();
			}
			$('.js-error-popup').show();
		},

		addTimerReload : function() {
			var finish = promoTimer.serverTime();
			finish.setUTCHours(21, 0, 0, 0);
			finish = finish.getTime()/1000;
			
			setTimeout(events.init, finish);
		},

		getPrize : function(type) {
			var info = this.ajax(this.URL.GET_PRIZE, {shard : active_server, type: type});
			if(info.error) {
				this.showError('Ошибка', 'Произошла ошибка, попробуйте позже', false);
			} else {
				this.showError('Получение приза', 'Приз отправлен на страницу <a href="/profile/mycart/" target="_blank">"Мои предметы"</a>', false);
				$('.js-bt-claim[data-type=' + type + ']').hide();		
				$('.js-prize-status[data-type=' + type +']').find('.js-prize-status-text').hide();
				$('.js-prize-status[data-type=' + type +']').find('.js-prize-status-done').show();
			}
		},

		changeServer : function(server) {
			var date = new Date(new Date().getTime() + 40*3600 * 1000),
				server_coocies;
		
			server_coocies = "active_server=" + server +"; path=/; expires=" + date.toUTCString() + ";";
			document.cookie = server_coocies;

			active_server = server;
		} 
	},

	insert = {
		serverHeader : function(data, server) {
			var template = '';

			template += '<div class="auth__menu">';			
			template += '<div class="auth__menu-current js-server-active">';
			template +=		data[server].shardName;
			template += 	'<div class="icon_server icon_rank_' + data[server].level + '"></div>';
			template += 	'(' + data[server].level + ') ' + data[server].name;
			template += '</div>';
			template += '<div class="auth__menu-list">';
			$.each(data, function(i, item) {

				template += '<div class="auth__menu-item auth__link js-change-server" data-index="' + item.shardId +'">';
				template +=		item.shardName;
				template += 	'<div class="icon_server icon_rank_' + item.level + '"></div>';
				template += 	'<div>(' + item.level + ') ' + item.name + '</div>';
				template += '</div>';
			});
			template += '</div>';
			template += '</div>';

			$('.js-server').html(template).addClass('is-show');
		},

		serverTask : function(data) {
			var template = '';
			$.each(data, function(i, item) {
				template += '<div class="action__server-item">';									
				template += 	'<input id="server' + item.shardId +'" type="radio" value="' + item.shardId +'" name="shard_id" class="action__server-radio js-server-item">';
				template += 	'<label for="server' + item.shardId +'">';
				template += 		'<div class="action__server-name">' + item.shardName + '</div>';
				template += 		'<div class="icon_server icon_rank_' + item.level + '"></div>';
				template += 		'<div>(' + item.level + ') ' + item.name + '</div>';
				template += 	'</label>';
				template += '</div>';
			});

			$('.js-act-server').html(template);
		},

		tasks : function(data) {
			var template = '',
				now_time,
				finish = {},
				last_update,
				button_prize,
				item_prize,
				event_info;

			$('.js-wrap').hide();

			if ($('.js-task-main-reward').hasClass('slick-initialized')) {
				$('.js-task-main-reward').slick('unslick');
			}

			// timer end of day
			now_time = promoTimer.serverTime();
			now_time.setSeconds(now_time.getSeconds() + data.time_left);
			promoTimer.init(now_time, '.js-timer-end-day');

			if(data.events[active_server].length !== 0) {
				event_info = data.events[active_server];

				// login
				$.each(event_info.events.login.rewards, function(i, item) {
					template += '<div>';
					template += 	'<p>' + item.title + '</p>';
					template += 	'<div class="action__task-image" style="background-image: url(https://wf.cdn.gmru.net/static/wf.mail.ru/img/main/items/' + item.ingameid + '.png)"></div>';
					template += '</div>';
				});
				$('.js-task-login-reward').html(template);

				if(data.cur_login[active_server] == 1) {
					$('.js-task-login').addClass('is-done'); 
					$('.js-task-login-done').hide();
					$('.js-task-login-process').show();
				} else if(data.cur_login[active_server] == 2) {
					$('.js-task-login-done').show();
					$('.js-task-login-process').hide();
				} else {
					$('.js-task-login').removeClass('is-done');
					$('.js-task-login-done').hide();
					$('.js-task-login-process').show();
				}

				// main
				$('.js-task-main-text').html(event_info.events.main.title);
				template = '';
				$.each(event_info.events.main.rewards, function(i, item) {
					template += '<div>';
					template += 	'<p>' + item.title + '</p>';
					template += 	'<div class="action__task-image" style="background-image: url(https://wf.cdn.gmru.net/static/wf.mail.ru/img/main/items/' + item.ingameid + '.png)"></div>';
					template += '</div>';
				});
				$('.js-task-main-reward').html(template);

				$('.js-task-main-reward').slick({
					slidesToShow: 1,
					arrows: true
				});
				$('.js-task-main-max').html(event_info.events.main.maxprogress);
				$('.js-task-main-progress').html(event_info.count);
				$('.js-task-main-perc').css('width', (event_info.count*100/event_info.events.main.maxprogress) + '%');
				$('.js-task').show();
			} else if(data.maincnt[active_server] == 30) {
				$('.js-result-final').show();
			} else if(data.free_event[active_server] == 1) {
				$('.js-choose-contract').show();			
			} else {
				$('.js-result').show();
			}

			if(data.maincnt && active_server > 0) {
				$('.js-progress-event-num').html(data.maincnt[active_server] + ' из 30');
				$('.js-progress-event').css('width', (data.maincnt[active_server]*100/30) + '%');
			}

			if(data.logincnt && active_server > 0) {
				$('.js-progress-visit-num').html(data.logincnt[active_server] + ' из 30');
				$('.js-progress-visit').css('width', (data.logincnt[active_server]*100/30) + '%');
			}

			insert.history(data.history[active_server]);

			// prize 
			if(data.get_bonus) {
				$.each(data.get_bonus[active_server], function(i, item) {
					button_prize = $('.js-bt-claim[data-type=' + i + ']');
					item_prize = $('.js-prize-status[data-type=' + i +']');

					button_prize.hide();
					if(item == 1) {
						button_prize.show();
						item_prize.find('.js-prize-status-text').show();
						item_prize.find('.js-prize-status-done').hide();
					} else if(item == 2) {
						item_prize.find('.js-prize-status-text').hide();
						item_prize.find('.js-prize-status-done').show();
					} else {
						item_prize.find('.js-prize-status-text').show();
						item_prize.find('.js-prize-status-done').hide();						
					}
				});
			}
		},

		history : function(data) {
			var template = '',
				text_status = ['Задание не выполнено', 'Задание не выполнено', 'Приз получен', 'Задание не выполнено'],
				date,
				history_arr = [];

			if(data.length != 0) {
				$.each(data, function(i, item) {		
					history_arr.push(item);
				});

				history_arr.sort(this.compareHistory);

				$.each(history_arr, function(i, item) {
					date = new Date(item.last_update_at*1000);
					template += '<tr>';
					template += 	'<td rowspan="2">' + date.getDate() + '.' + (date.getMonth()+1) +'.' + date.getFullYear() +'</td>';
					template += 	'<td>Войти в игру.</td>';
					template += 	'<td>' + text_status[item.status_login ] + '</td>';
					template += '</tr>';
					template += '<tr>';
					template += 	'<td>' + item.event.title + '</td>';
					template += 	'<td>' + text_status[item.status] + '</td>';
					template += '</tr>';
				});
				$('.js-history-table tbody').html(template);
				$('.js-history-table').show();
				$('.js-history-popup-error').hide();
			} else {
				$('.js-history-table').hide();
				$('.js-history-popup-error').show();
			}
		},

		compareHistory : function(itemA, itemB) {
			return itemB.last_update_at - itemA.last_update_at;
		}
	}

//--------------------------------------------------------------------
// init

$(document).ready(function () {
	var finish = new Date(Date.UTC(2018, 00, 29, 9, 0, 0));
	promoTimer.init(finish, '.js-timer');

	events.init();
});

//--------------------------------------------------------------------
// buttons

$(document).on('click', '.js-popup-close', function () {
	$(this).parents('.js-popup').hide();
});

$(document).on('click', '.js-show-history', function () {
	$('.js-history-popup').show();
});

$(document).on('click', '.js-get-contract', function () {
	if(can_start) {
		$('.js-start').hide();
		$('.js-choose-server').show();
	} else {
		events.showError('Ошибка', 'Чтобы начать службу, необходимо создать персонажа', false);
	}

});

$(document).on('click', '.js-choose-server-button', function () {
	events.changeServer($('.js-server-item:checked').val());

	if(active_server != null) {
		$('.js-choose-server').hide();
		$('.js-choose-contract').show();

		$('.js-server').css('display', 'inline-block');
	} else {
		$('.js-error-server').html('Ты не выбрал сервер').show();
	}
});

$(document).on('click', '.js-choose-contract-button', function () {
	var contract = $(this).data('contract');
	if(!$(this).hasClass('is-disable')) {
		events.getContract(contract);		
	}
});

$(document).on('click', '.js-change-server', function () {
	var current = $(this).html();
	events.changeServer($(this).data('index'));
	$('.js-server-active').html(current);
	insert.tasks(info_common);
});

$(document).on('click', '.js-bt-buy-event', function () {
	$('.js-buy-popup-text').html('Выполнить задание автоматически за 150 кредитов?');
	$('.js-popup-action').data('type', 1);
	$('.js-buy-popup').show();
});

$(document).on('click', '.js-bt-buy-contract', function () {
	$('.js-buy-popup-text').html('Взять еще контракт за 50 кредитов?');
	$('.js-popup-action').data('type', 2);
	$('.js-buy-popup').show();
});

$(document).on('click', '.js-popup-action', function () {
	var type = $(this).data('type');
	events.buyEvent(type);
	$('.js-buy-popup').hide();
});

$(document).on('click', '.js-bt-claim', function () {
	var type = $(this).data('type');
	events.getPrize(type);
});


//--------------------------------------------------------------------
// present sharing

$(document).on('click', '.js-soc-bt', function() {
	if (authData.user == 1 || authData.user == 3) {
		present_gift();
	}
});

function present_gift() {
	$.get('/dynamic/profile/?a=promo_presents&promo=santa18', function(data){
		var present_data = data.status;
		if (present_data) {
			$(".js-soc").hide();
			$(".js-soc-text").html('Подарок добавлен в <a href="https://wf.mail.ru/profile/mycart/" target="_blank">корзину предметов</a>');
		} else {
			$(".js-soc").hide();
			$(".js-soc-text").html('Вы уже <a href="https://wf.mail.ru/profile/mycart/" target="_blank">получили</a> подарок!');
		}
	}, 'json');
}