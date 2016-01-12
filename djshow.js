/**
 *  Copyright (C) 2015-2016 Aleksandr Deinega <adeinega@mail.ru>
 *
 *  This file is part of djShow.
 *
 *  djShow is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  djShow is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with djShow. If not, see <http://www.gnu.org/licenses/>.
 */


/** 
 * djShow v2.2.0
 *
 * @param string container - идентификатор блока-контейнера
 * @param object options - дополнительные параметры
 */
var djShow = function(container, options) {

	'use strict';

	if (!container) return;
	container = document.getElementById(container);

	options = options || {};

	var latency = options.latency || 3000,
		sunset  = options.sunset  || function() {},
		sunrise = options.sunrise || function() {},
		preload = options.preload || [];

	/**
	 * Предзагрузка изображений
	 */
	if (preload.length) {
		var img = [];
		for (var i = 0; i < preload.length; i++) {
			img[i] = new Image();
			img[i].src = preload[i];
		}
	}

	/**
	 * Поиск элемента по шаблону
	 * @param string needle - искомый элемент
	 * @param string haystack - текст, в котором осуществляется поиск
	 * return string || undefined - найденное совпадение
	 */
	var getName = function(needle, haystack) {
		var regmatch = {
			title: [
				/Title: (.+)/i,
				/<title>(.+)<\/title>/i
			],
			artist: [
				/Artist: (.+)/i,
				/<artist>(.+)<\/artist>/i
			]
		};
		if (needle in regmatch && typeof haystack === 'string') {
			for (var i = 0; i < regmatch[needle].length; i++) {
				var result = haystack.match(regmatch[needle][i]);
				if (result) {
					return result[1].replace(/\(.+\)/, '').trim();
				}
			}
		}
	};

	/**
	 * Поиск исключений в названиях
	 * @param string haystack - строка, в которой осуществляется поиск
	 */
	var except = function(haystack) {
		var needle = [
<<<<<<< Updated upstream
				'missing value'
=======
<<<<<<< HEAD
<<<<<<< HEAD
				'\\?',
				'missing value',
				'N\\/A'
=======
				'missing value'
>>>>>>> origin/master
=======
				'missing value'
>>>>>>> origin/master
>>>>>>> Stashed changes
			];
		var regmatch = new RegExp('^(' + needle.join('|') + ')$', 'i');
		return regmatch.test(haystack);
	};

	/**
	 * Обработчик сообщения от сервера
	 * @param string event
	 */
	var parseMessage = function(event) {

		var data = JSON.parse(event.data);
		var html = '';
		if (container.innerHTML !== '') {
			container.style.opacity = '0';
			var sunsend = sunset(data);
		}

		var current_title = getName('title', data.current);
		if (current_title && !except(current_title)) {
			html += '<h2>' + current_title + '</h2>';
		}

		var current_artist = getName('artist', data.current);
		if (current_artist && !except(current_artist)) {
			current_artist = current_artist.split(' - ');
			if (current_artist[0]) {
				html += '<p>Исполнитель:</p>';
				html += '<h1>' + current_artist[0] + '</h1>';
				if (current_artist[1]) {
					html += '<h3>(' + current_artist[1].trim() + ')</h3>';
				}
			}
		}

		var previous_title = getName('title', data.previous);
		if (previous_title) {
			html += '<p class="previous">Предыдущая: “' + previous_title + '”';
			var previous_artist = getName('artist', data.previous);
			if (previous_artist) {
				previous_artist = previous_artist.split(' - ');
				html += ' ' + previous_artist[0];
			}
			html += '</p>';
		}

		if (container.innerHTML !== '') {
			setTimeout(function() {
				container.innerHTML = html;
				container.style.opacity = '1';
				sunrise(sunsend);
			}, latency);
		} else {
			container.innerHTML = html;
		}
	};

	/**
	 * Обработчик ошибок
	 */
	var parseError = function() {
		container.innerHTML = '';
	};

	/**
	 * Перед вызовом EventSource все http-запросы должны быть завершены
	 */
	window.onload = function() {
		var eventSource = new EventSource('/event');
		eventSource.onmessage = parseMessage;
		eventSource.onerror = parseError;
	};
};
