/**
 *  Copyright (c) 2015-2025 Aleksandr Deinega <adeinega@mail.ru>
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


(function(){

  const exclude = [ '?', 'missing value', 'n/a', 'nothing', 'null', 'various artists' ]; // This value will not be displayed
  const locale = (Intl.DateTimeFormat().resolvedOptions().locale.indexOf('ru') === 0) ? 'ru' : 'en';

  let message;
  let slideCount = 0;
  let config = JSON.parse(localStorage.getItem('config')) || {
    highContrast: false,
    showImage: true,
    showYear: true,
    showCount: true,
    showNextTanda: true,
    showCortina: 'off',
    textNextTanda: locale === 'ru' ? 'Следующая танда' : 'Next tanda',
    textPrevious: locale === 'ru' ? 'Предыдущая:' : 'Previous:',
  };

  /**
   * Main function
   */
  function slide() {
    if (config.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast')
    }

    const html = [];
    const current = {};
    const coldStart = container.innerHTML == '' ? true : false;
    const regSeparator = /\/|\s-\s|:|&/g;
    const separator = '%sep%';
    if (!coldStart) {
      container.style.opacity = '0'; // Sunset
    }

    const previousSlideElement = document.getElementById(`slide-${slideCount++}`);
    const slideElement = document.createElement('div');
    slideElement.id = `slide-${slideCount}`;
    slideElement.classList.add('hide');
    container.append(slideElement);

    // Welcome screen
    if (Object.keys(message.current || {}).length === 0 && Object.keys(message.previous || {}).length === 0) {
      const welcome = locale === 'ru'
        ? `<div class="welcome">Нажмите <i>шестерню</i> в&nbsp;левом верхнем углу для&nbsp;изменения настроек</div>`
        : `<div class="welcome">Click on the <i>gear</i> in&nbsp;the&nbsp;top left corner to&nbsp;settings</div>`;
      html.push(welcome);
    }

    // Previous
    if (message.previous) {
      const previousTitle = (message.previous.title && !except(message.previous.title)) ? `&ldquo;${htmlEncode(message.previous.title.replace(/\(.+?\)/, '').split(' - ')[0].trim())}&rdquo;` : '';
      const previousArtist = (message.previous.artist && !except(message.previous.artist)) ? htmlEncode(message.previous.artist.replace(regSeparator, separator).split(separator)[0]) : '';
      if (previousTitle || previousArtist) {
        html.push(
          `<div class="previous">
            <span>${htmlEncode(config.textPrevious)}</span>
            <span>${previousArtist}</span>
            <span>${previousTitle}</span>
          </div>`
        );
      }
    }

    // If cortina
    let isCortina = false;
    if ((message.current && message.current.genre == 'Cortina' && config.showCortina === 'genreIsCortina') || (message.current && !message.count && config.showCortina === 'genreIsNotTVM')) {
      html.push(`<h1 class="artist">${config.textPrevious === 'Предыдущая:' ? 'Koptиha' : 'Cortina'}</h1>`); // по-русски пишем при условии
      slideElement.classList.add('cortina');
      isCortina = true;
    }

    // Genre count
    if (!isCortina && config.showCount && message.count) {
      html.push(`<div class="count">${message.count}</div>`);
    }

    // Genre reverse count
    if (!isCortina && config.showReverseCount && message.reversecount) {
      html.push(`<div class="reversecount">+${htmlEncode(message.reversecount)}</div>`);
    }

    // Orchestra
    if (!isCortina && message.current && message.current.artist && !except(message.current.artist)) {
      const currentArtist = message.current.artist.replace(/\(.*?\)/g, '').replace(regSeparator, separator).split(separator).map(el => el.trim());
      current.artist = htmlEncode(currentArtist[0] || '');
      current.singer = htmlEncode(currentArtist[1] || '');
      html.push(`<h1 class="artist">${current.artist.replace(/\s(..)\s(.+)/i, ' $1&nbsp;$2')}</h1>`); // Di Sarli
      // Singer
      if (current.singer) {
        html.push(`<h3 class="singer">${current.singer}</h3>`);
      }
    }

    // Background .jpg or photo face .webp or .png
    if (!isCortina && config.showImage && current.artist) {
      const imagePath = `/photos/${getUnixName(current.artist)}`;
      const preloadJpeg = new Image();
      preloadJpeg.src = imagePath + '.jpg';
      preloadJpeg.onload = () => {
        slideElement.style.backgroundImage = `url(${preloadJpeg.src})`;
        slideElement.classList.add('image');
      };
      preloadJpeg.onerror = () => {
        const preloadWebp = new Image();
        preloadWebp.src = imagePath + '.webp';
        preloadWebp.onload = () => {
          preloadWebp.classList.add('photo');
          slideElement.appendChild(preloadWebp);
          slideElement.classList.add('image');
        };
        preloadWebp.onerror = () => {
          const preloadPng = new Image();
          preloadPng.src = imagePath + '.png';
          preloadPng.onload = () => {
            preloadPng.classList.add('photo');
            slideElement.appendChild(preloadPng);
            slideElement.classList.add('image');
          };
        };
      };
    }

    // Title
    if (!isCortina && message.current && message.current.title && !except(message.current.title)) {
      current.title = htmlEncode(message.current.title) || '';
      html.push(`<h2 class="title">${current.title.replace(/\(.+?\)/, '').split(' - ')[0]}</h2>`);
    }

    // Year
    if (!isCortina && config.showYear && message.current && message.current.year) {
      const year = message.current.year.toString().match(/(19|20)\d\d/);
      if (year) {
        html.push(`<div class="year">${year[0]}</div>`);
      }
    }

    // Next tanda
    if (config.showNextTanda && message.nextgenre) {
      const nextArtist = (message.nextartist && !except(message.nextartist)) ? message.nextartist.replace(regSeparator, separator) : '';
      html.push(
        `<div class="next-tanda">
          <span class="remark">${htmlEncode(config.textNextTanda)}</span>
          <span class="genre">${htmlEncode(message.nextgenre)}</span>
          <span class="orchestra">${htmlEncode(nextArtist.split(separator)[0].replace(/\(.+?\)/, ''))}</span>
        </div>`);
    }

    if (coldStart) {
      slideElement.insertAdjacentHTML('afterbegin', html.join(''));
      slideElement.classList.remove('hide');
    } else {
      setTimeout(() => {
        if (previousSlideElement) previousSlideElement.remove();
        slideElement.insertAdjacentHTML('afterbegin', html.join(''));
        slideElement.classList.remove('hide');
        container.style.opacity = '1'; // Sunrise
      }, 3000);
    }

    /**
     * Search for exceptions
     */
    function except(text) {
      return exclude.indexOf(text.toString().toLowerCase()) + 1;
    }

    /**
     * Encode html-symbols: < > & ...
     */
    function htmlEncode(text) {
      // Знак ударения \u0301 safari на iOS совмещает с буквой,
      // создавая новый символ, которого может не быть в шрифте
      // поэтому просто уберем его
      text = text.toString().replace('\u0301', '');
      const el = document.createElement('div');
      el.innerText = el.textContent = text;
      return el.innerHTML;
    }

    function getUnixName(artist) {
      const espChars = [['á','a'],['é','e'],['í','i'],['ñ','n'],['ó','o'],['ú','u'],['ü','u']];
      artist = artist.toString().trim().toLowerCase().replace(/\s+/g, '_');
      for ([esp, latin] of espChars) {
        const espReg = new RegExp(esp, 'g');
        artist = artist.replace(espReg, latin);
      }
      return artist.replace(/[^0-9a-z_]/g, '');
    }
  }
  /** End main function **/


  const source = new EventSource('/event');
  source.addEventListener('open', () => {
    console.log('Connected');
    document.getElementById('settingsBtn').classList.remove('hide');
  });
  source.addEventListener('message', e => {
    console.log('Received:', e.data);
    message = JSON.parse(e.data);
    slide();
  });
  source.addEventListener('error', () => {
    console.log('Disconnected');
    document.getElementById('settingsBtn').classList.add('hide');
  });

  /**
   * #settingsBtn show after connection
   */
  document.getElementById('settingsBtn').addEventListener('click', () => {
    if (locale === 'ru') {
      document.querySelectorAll('[data-ru]').forEach(el => el.textContent = el.getAttribute('data-ru'));
    }
    document.getElementById('settings').classList.remove('hide');
    for (const item in config) {
      if (item.indexOf('text') === 0) {
        document.getElementById(item).value = config[item];
      } else if (item === 'showCortina') {
        document.getElementById(config[item]).checked = true;
      } else {
        document.getElementById(item).checked = config[item];
      }
    }
  });


  let timeoutCaption;
  for (let $input of document.querySelectorAll('input[type="text"]')) {
    $input.addEventListener('input', () => {
      clearTimeout(timeoutCaption);
      timeoutCaption = setTimeout(() => setConfig(), 1000);
    });
  }
  for (let $checkbox of document.querySelectorAll('input[type="checkbox"]')) {
    $checkbox.addEventListener('change', () => setConfig());
  }
  for (let $checkbox of document.querySelectorAll('input[type="radio"]')) {
    $checkbox.addEventListener('change', (radio) => setConfig());
  }

  function setConfig() {
    const formData = new FormData(document.querySelector('form'));
    config = Object.fromEntries(formData);
    localStorage.setItem('config', JSON.stringify(config));
  }

  document.getElementById('backBtn').addEventListener('click', () => {
    container.innerHTML = ''; // For cold start
    slide();
    document.getElementById('settings').classList.add('hide');
  });

})();