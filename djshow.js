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
 * djShow v2.3.1
 *
 * @param string container - идентификатор блока-контейнера
 * @param object options - дополнительные параметры
 */
var djShow = function (container, options) {

	'use strict';

	if (!container) return;
	container = document.getElementById(container);

	options = options || {};

	var latency = options.latency || 3000,
		sunset  = options.sunset  || function () {},
		sunrise = options.sunrise || function () {},
		preload = options.preload || [],
		remark  = options.remark  || { artist: 'Исполнитель:', previous: 'Предыдущая:' };

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
	 * Поиск элемента в тексте по шаблону
	 * @param string needle - искомый элемент
	 * @param string haystack - текст, в котором осуществляется поиск
	 * return string || undefined - найденное значение
	 */
	var getName = function (needle, haystack) {
		var regmatch,
			result,
			template = [
			'%s: (.+)',
			'<%s>(.+)<\/%s>'
		];
		if (typeof haystack === 'string') {
			for (var i = 0; i < template.length; i++) {
				template[i] = template[i].replace(/%s/g, needle);
				regmatch = new RegExp(template[i], 'i');
				result = haystack.match(regmatch);
				if (result) {
					return result[1].replace(/\(.+\)/, '').trim();
				}
			}
		}
	};

	/**
	 * Поиск исключений
	 * @param string text - строка для сравнения
	 * return integer || undefined
	 */
	var except = function (text) {
		// Все строчными
		var exclude = [
			'?',
			'missing value',
			'n/a',
			'nothing',
			'various artists'
		];
		if (Array.prototype.indexOf) {
			return exclude.indexOf(text.toLowerCase()) + 1;
		}
	};

	/**
	 * Обработчик сообщения от сервера
	 * @param string event
	 */
	var parseMessage = function (event) {

		var data = JSON.parse(event.data);
		var html = '';

		if (container.innerHTML !== '') {
			container.style.opacity = '0';
		}

		var sunsend = sunset(data);

		var current_title = getName('title', data.current);
		if (current_title && !except(current_title)) {
			html += '<h2>' + current_title + '</h2>';
		}

		var current_artist = getName('artist', data.current);
		if (current_artist && !except(current_artist)) {
			current_artist = current_artist.split(' - ');
			html += '<p>' + remark.artist + '</p>';
			html += '<h1>' + current_artist[0] + '</h1>';
			if (current_artist[1]) {
				html += '<h3>(' + current_artist[1].trim() + ')</h3>';
			}
		}

		var previous_title = getName('title', data.previous);
		if (previous_title && !except(previous_title)) {
			html += '<p class="previous">' + remark.previous + ' &ldquo;' + previous_title + '&rdquo;';
			var previous_artist = getName('artist', data.previous);
			if (previous_artist && !except(previous_artist)) {
				previous_artist = previous_artist.split(' - ');
				html += ' ' + previous_artist[0];
			}
			html += '</p>';
		}

		if (container.innerHTML !== '') {
			setTimeout(function () {
				container.innerHTML = html;
				container.style.opacity = '1';
				sunrise(sunsend);
			}, latency);
		} else {
			container.innerHTML = html;
			sunrise(sunsend);
		}
	};

	/**
	 * Обработчик ошибок
	 */
	var parseError = function () {
		container.innerHTML = '';
	};

	/**
	 * Перед вызовом EventSource все http-запросы должны быть завершены
	 */
	window.onload = function () {
		var eventSource = new EventSource('/event');
		eventSource.onmessage = parseMessage;
		eventSource.onerror = parseError;
	};
};