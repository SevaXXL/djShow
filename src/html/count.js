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

  const container = document.getElementById('container');

  /**
   * Main function
   */
  function count(message) {
    const coldStart = container.innerHTML == '' ? true : false;
    if (!coldStart) {
      container.style.opacity = '0'; // Sunset
    }

    // Genre count
    const html = message.count || '&#x2044;';
    if (coldStart) {
      container.innerHTML = html;
    } else {
      setTimeout(() => {
        container.innerHTML = html;
        container.style.opacity = '1'; // Sunrise
      }, 3000);
    }
  }
  /** End main function **/

  const source = new EventSource('/event');
  source.addEventListener('open', () => {
    console.log('Connected');
  });
  source.addEventListener('message', e => {
    console.log('Received:', e.data);
    count(JSON.parse(e.data));
  });
  source.addEventListener('error', () => {
    console.log('Disconnected');
  });

})();