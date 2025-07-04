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
const version = '4.1.6';
const port = 3000;

const http = require('node:http');
const path  = require('node:path');
const { spawn } = require('node:child_process');
const { networkInterfaces, EOL } = require('node:os');
const { access, stat, readFile, constants, open, read }  = require('node:fs/promises');
const fs = require('node:fs');

const playlistName = 'Playlist.txt';
const nowplayingName = 'NowPlaying.txt';
const htmlPath = __dirname + path.sep + 'html';
const modulesPath = __dirname + path.sep + 'modules';
const playlistFile = __dirname + path.sep + playlistName;
const nowplayingFile = __dirname + path.sep + nowplayingName;

const users = []; // SSE clients

const djShow = {
  playlistState: 1,
  _tandas: ['tango', 'vals', 'milonga'],
  _playlistTemplates: '[%genre%] %artist% > %title% %year%',
  _count: 0,
  _getTVM: genre => {
    // Жанры нужны для счетчика позиции в танде
    // Приводим подобные к одному виду
    if (/tango|tonada/.test(genre?.toLowerCase())) return 'Tango'; // Tango, Electrotango, Tango nuevo
    if (/vals/.test(genre?.toLowerCase())) return 'Vals';
    if (/milong|candombe|foxtrot/.test(genre?.toLowerCase())) return 'Milonga'; // Milongon
    return genre || '';
  },
  get track() {
    return {
           current: this._trackCurrent,
          previous: this._trackPrevious,
             count: this._count,
      reversecount: this._reverseCount,
         nextgenre: this._nextGenre,
        nextartist: this._nextArtist
    };
  },
  set track(data = {}) {
    this._trackPrevious = {
      title: this._trackCurrent?.title || '',
      artist: this._trackCurrent?.artist || '',
      genre: this._trackCurrent?.genre || ''
    }
    this._trackCurrent = data.current || {};
    this._reverseCount = 0;
    this._nextGenre = '';
    this._nextArtist = '';
    if (data.next && data.next instanceof Array) {
      let i = 0;
      // Find last track in current tanda
      for (i; i < data.next.length; i++) {
        if (this._getTVM(data.next[i].genre).toLowerCase() != this._getTVM(this._trackCurrent.genre).toLowerCase()) break;
        this._reverseCount++;
      }

      // Find first track in next tanda
      for (i; i < data.next.length; i++) {
        if (this._tandas.includes(this._getTVM(data.next[i].genre).toLowerCase())) break;
      }
      if (i < data.next.length) {
        this._nextGenre = data.next[i].genre || '';
        this._nextArtist = data.next[i].artist || '';
      }
    }
    if (this._trackCurrent.genre && this._tandas.includes(this._getTVM(this._trackCurrent.genre).toLowerCase())) {
      if (this._trackPrevious.genre && this._getTVM(this._trackPrevious.genre).toLowerCase() == this._getTVM(this._trackCurrent.genre).toLowerCase()) {
        this._count++;
      } else {
        this._count = 1;
      }
    } else {
      this._count = 0;
    }
    switch (this.playlistState) {
      case 0: break;
      case 1:
        fs.appendFile(playlistFile, EOL + '* * *' + EOL + new Date() + EOL + EOL, err => {});
        this.playlistState = 2;
      default:
        const line = this._playlistTemplates.replace(/%([a-z]+)%/g, (match, template) => this._trackCurrent[template] || '');
        fs.appendFile(playlistFile, line + EOL, err => {});
    }
  }
}

/**
 * Start server
 */
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}/`);
  switch (url.pathname) {
    case '/event'  : sseInit(req, res); break;
    case '/data'   : receiveAndDeliverData(req, res); break;
    case '/traktor': traktor(req, res); break;
    default        : await serveStatic(res, url.pathname, htmlPath);
  }
}).listen(port, () => {
  const ip = getIP();
  const urlPathname = `http://${ip}:${port}`;
  if (ip !== 'localhost') console.log(qr(urlPathname));
  console.log(`djShow v${version}`);
  console.log(`Server running at ${urlPathname}`);
  /**
   * Start watch file only file present
   */
  fs.readFile(nowplayingFile, 'utf8', (error, content) => {
    if (!error) {
      console.log(`Watch ${nowplayingName}`);
      const trackData = parseTags(content);
      send(trackData);
      fs.watchFile(nowplayingFile, (curr, prev) => {
        if (curr.mtime.getTime() !== prev.mtime.getTime()) {
          fs.readFile(nowplayingFile, 'utf8', (error, content) => {
            const trackData = parseTags(content);
            send(trackData);
          });
        }
      });
    }
    /**
     * Start subproccess
     */
    fs.readdir(modulesPath, { withFileTypes: true }, (error, files) => {
      if (!error) {
        for (const file of files) {

          if (file.isFile() && process.platform === 'darwin' && /\.js\.scpt$/.test(file.name)) {
            spawn('osascript', [ '-l', 'JavaScript', file.name, port, modulesPath ], { cwd: modulesPath });
            console.log('Start script', file.name);

          // } else if (file.isFile() && process.platform === 'darwin' && /\.scpt$/.test(file.name)) {
          //   spawn('osascript', [ file.name, port ], { cwd: modulesPath });
          //   console.log('Start script', file.name);

          } else if (file.isFile() && process.platform === 'darwin' && /\.sh$/.test(file.name)) {
            spawn(`./${file.name}`, [ port ], { cwd: modulesPath });
            console.log('Start script', file.name);

          // } else if (file.isFile() && process.platform === 'darwin' && /^djay$/.test(file.name)) {
          //   spawn(`./${file.name}`, [ port ], { cwd: modulesPath });
          //   console.log('Start module', file.name);

          } else if (file.isFile() && process.platform === 'win32' && /\.js$/.test(file.name)) {
            spawn('cscript', [ '//nologo', '//e:jscript', file.name, port ], { cwd: modulesPath });
            console.log('Start script', file.name);
          }
        }
      }
      console.log('Ctrl+C to exit...');
    });
  });
});

/**
 * Post new data
 */
function receiveAndDeliverData(req, res) {
  res.writeHead(200);
  if (req.method == 'POST') {
    let postBody = '';
    req.on('data', chunk => postBody += chunk);
    req.on('end', () => {
      postBody = postBody.toString();
      if (req.headers['content-type'] === 'application/json') {
        try {
          postBody = JSON.parse(decodeURI(postBody));
          send(postBody);
        } catch (err) {
          console.log(err);
        }
      } else {
        send(parseTags(postBody));
      }
    });
  }
  res.end();
}

/**
 * SSE welcome
 */
function sseInit(req, res) {
  res.writeHead(200, {
         'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
           'Connection': 'keep-alive',
    'Transfer-Encoding': 'chunked'
  });
  res.write('data: ' + JSON.stringify(djShow.track) + '\n\n');
  const username = users.length;
  users[username] = res;

  req.on('close', () => {
    users[username].end();
    delete users[username];
  });
}

/**
 * SSE parse and send data
 * @param object data - track title, artist and etc.
 */
function send(trackDta) {
  djShow.track = trackDta;
  users.forEach(user => {
    user.write('data: ' + JSON.stringify(djShow.track) + '\n\n');
  });
}

/**
 * TRAKTOR PLAYER
 */
let traktorDecks = {};
let traktorPrevious;
async function traktor(req, res) {
  if (req.method == 'POST') {
    let postBody = '';
    req.on('data', chunk => postBody += chunk);
    req.on('end', () => {
      try {
        postBody = JSON.parse(postBody.toString());
        if (!['A', 'B', 'C', 'D'].includes(postBody.deck)) return;
        if (postBody.title) {
          traktorDecks[postBody.deck] = postBody;
        } else {
          if (!postBody.propVolume) return;
          if (((postBody.deck === 'A') || (postBody.deck === 'C')) && (postBody.propXfaderAdjust === 1)) return;
          if (((postBody.deck === 'B') || (postBody.deck === 'D')) && (postBody.propXfaderAdjust === 0)) return;
          traktorDecks[postBody.deck].propVolume = postBody.propVolume;
          traktorDecks[postBody.deck].propXfaderAdjust = postBody.propXfaderAdjust;
          traktorDecks[postBody.deck].isPlaying = postBody.isPlaying;
        }
        const masterDeck = getMasterDeck(traktorDecks);
        if (isNewTrack(traktorDecks[masterDeck])) send({current: traktorDecks[masterDeck]})//send(traktorDecks[masterDeck]);
      } catch(e) {}
    });
    res.end();
  }
  function isNewTrack(trackDetails) {
    if (!traktorPrevious || traktorPrevious.artist !== trackDetails.artist || traktorPrevious.title !== trackDetails.title) {
      traktorPrevious = trackDetails;
      return true;
    }
    return false;
  }
  function getMasterDeck(deckData) {
    let masterDeck = null;
    let highestScore = -Infinity;
    for (const deck in deckData) {
      if (deckData.hasOwnProperty(deck)) {
        const deckDetails = deckData[deck];
        let score;
        if (deck === 'A' || deck === 'C') {
          score = deckDetails.propVolume * (1 - deckDetails.propXfaderAdjust);
        } else {
          score = deckDetails.propVolume * deckDetails.propXfaderAdjust;
        }
        if (score > highestScore && deckDetails.isPlaying) {
          highestScore = score;
          masterDeck = deck;
        }
      }
    }
    return masterDeck;
  }
}

/**
 * Parse track data
 * @param string content etc. <tag1>...</tag1><tag2>...</tag2> || Tag1: ...\nTag2: ...
 * @return object { tag1: value,.. }
 */
function parseTags(content='') {
  content = content.trim();
  if (!content) return {};
  const result = {};
  if (content[0] === '<') {
    for (let tag of content.matchAll(/<([^/].+?)>/g) || []) {
      regexp = new RegExp(`${tag[0]}(.*)<\/${tag[1]}>`);
      tagValue = content.match(regexp);
      if (tagValue) result[tag[1].toLowerCase()] = tagValue[1].trim();
    }
  } else {
    for (let tag of content.matchAll(/^([A-Za-z]+):(.*)$/gm) || []) {
      result[tag[1].toLowerCase()] = tag[2].trim();
    }
  }
  return { current: result };
}

/**
 * Detect IP
 * @return string
 */
function getIP() {
  const interfaces = networkInterfaces();
  for (let key in interfaces) {
    let item = interfaces[key];
    for (let k in item) {
      if (item[k].family === 'IPv4' && !item[k].internal) {
        return item[k].address;
      }
    }
  }
  return 'localhost';
}

/**
 * Static server
 */
async function serveStatic(res, uri, root) {
  let filename = path.join(root, uri);
  let isReadable;
  try {
    await access(filename, constants.R_OK);
    isReadable = true;
  } catch {}

  if (!isReadable) {
    serve(404, '404 Not Found\n');
    return;
  }
  const fileInfo = await stat(filename);
  if (fileInfo.isDirectory()) {
    filename = path.join(filename, './index.html');
  }

  try {
    const content = await readFile(filename);
    serve(200, content, path.extname(filename));
  } catch (err) {
    serve(500, err.message);
  }

  function serve(code, content, type) {
    const mime = {
      '.woff2': 'font/woff2',
      '.html' : 'text/html',
      '.css'  : 'text/css',
      '.js'   : 'application/javascript',
      '.gif'  : 'image/gif',
      '.jpg'  : 'image/jpeg',
      '.png'  : 'image/png',
      '.webp' : 'image/webp',
      '.svg'  : 'image/svg+xml',
        err   : 'text/plain'
    };
    res.writeHead(code, {
      'Content-Type': mime[type] || mime['err'],
      'Cache-Control': 'must-revalidate, max-age=0',
      'Content-Length': Buffer.byteLength(content),
    });
    res.write(content);
    res.end();
  }
}

/**
 * @fileoverview
 * - modified davidshimjs/qrcodejs library for use in node.js
 * - Using the 'QRCode for Javascript library'
 * - Fixed dataset of 'QRCode for Javascript library' for support full-spec.
 * - this library has no dependencies.
 *
 * @version 0.9.1 (2016-02-12)
 * @author davidshimjs, papnkukn
 * @see <a href="http://www.d-project.com/" target="_blank">http://www.d-project.com/</a>
 * @see <a href="http://jeromeetienne.github.com/jquery-qrcode/" target="_blank">http://jeromeetienne.github.com/jquery-qrcode/</a>
 * @see <a href="https://github.com/davidshimjs/qrcodejs" target="_blank">https://github.com/davidshimjs/qrcodejs</a>
 */

/**
 * QRCode for JavaScript
 * Copyright (c) 2009 Kazuhiko Arase
 * URL: http://www.d-project.com/
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 * The word "QR Code" is registered trademark of
 * DENSO WAVE INCORPORATED
 * http://www.denso-wave.com/qrcode/faqpatent-e.html
 */
function QR8bitByte(data) {
  this.mode = QRMode.MODE_8BIT_BYTE;
  this.data = data;
  this.parsedData = [];

  // Added to support UTF-8 Characters
  for (let i = 0, l = this.data.length; i < l; i++) {
    let byteArray = [];
    let code = this.data.charCodeAt(i);

    if (code > 0x10000) {
      byteArray[0] = 0xF0 | ((code & 0x1C0000) >>> 18);
      byteArray[1] = 0x80 | ((code & 0x3F000) >>> 12);
      byteArray[2] = 0x80 | ((code & 0xFC0) >>> 6);
      byteArray[3] = 0x80 | (code & 0x3F);
    } else if (code > 0x800) {
      byteArray[0] = 0xE0 | ((code & 0xF000) >>> 12);
      byteArray[1] = 0x80 | ((code & 0xFC0) >>> 6);
      byteArray[2] = 0x80 | (code & 0x3F);
    } else if (code > 0x80) {
      byteArray[0] = 0xC0 | ((code & 0x7C0) >>> 6);
      byteArray[1] = 0x80 | (code & 0x3F);
    } else {
      byteArray[0] = code;
    }

    this.parsedData.push(byteArray);
  }

  this.parsedData = Array.prototype.concat.apply([], this.parsedData);

  if (this.parsedData.length != this.data.length) {
    this.parsedData.unshift(191);
    this.parsedData.unshift(187);
    this.parsedData.unshift(239);
  }
}

QR8bitByte.prototype = {
  getLength: function (buffer) {
    return this.parsedData.length;
  },
  write: function (buffer) {
    for (let i = 0, l = this.parsedData.length; i < l; i++) {
      buffer.put(this.parsedData[i], 8);
    }
  }
};

function QRCodeModel(typeNumber, errorCorrectLevel) {
  this.typeNumber = typeNumber;
  this.errorCorrectLevel = errorCorrectLevel;
  this.modules = null;
  this.moduleCount = 0;
  this.dataCache = null;
  this.dataList = [];
}

QRCodeModel.prototype={addData:function(data){let newData=new QR8bitByte(data);this.dataList.push(newData);this.dataCache=null;},isDark:function(row,col){if(row<0||this.moduleCount<=row||col<0||this.moduleCount<=col){throw new Error(row+","+col);}
return this.modules[row][col];},getModuleCount:function(){return this.moduleCount;},make:function(){this.makeImpl(false,this.getBestMaskPattern());},makeImpl:function(test,maskPattern){this.moduleCount=this.typeNumber*4+17;this.modules=new Array(this.moduleCount);for(let row=0;row<this.moduleCount;row++){this.modules[row]=new Array(this.moduleCount);for(let col=0;col<this.moduleCount;col++){this.modules[row][col]=null;}}
this.setupPositionProbePattern(0,0);this.setupPositionProbePattern(this.moduleCount-7,0);this.setupPositionProbePattern(0,this.moduleCount-7);this.setupPositionAdjustPattern();this.setupTimingPattern();this.setupTypeInfo(test,maskPattern);if(this.typeNumber>=7){this.setupTypeNumber(test);}
if(this.dataCache==null){this.dataCache=QRCodeModel.createData(this.typeNumber,this.errorCorrectLevel,this.dataList);}
this.mapData(this.dataCache,maskPattern);},setupPositionProbePattern:function(row,col){for(let r=-1;r<=7;r++){if(row+r<=-1||this.moduleCount<=row+r)continue;for(let c=-1;c<=7;c++){if(col+c<=-1||this.moduleCount<=col+c)continue;if((0<=r&&r<=6&&(c==0||c==6))||(0<=c&&c<=6&&(r==0||r==6))||(2<=r&&r<=4&&2<=c&&c<=4)){this.modules[row+r][col+c]=true;}else{this.modules[row+r][col+c]=false;}}}},getBestMaskPattern:function(){let minLostPoint=0;let pattern=0;for(let i=0;i<8;i++){this.makeImpl(true,i);let lostPoint=QRUtil.getLostPoint(this);if(i==0||minLostPoint>lostPoint){minLostPoint=lostPoint;pattern=i;}}
return pattern;},createMovieClip:function(target_mc,instance_name,depth){let qr_mc=target_mc.createEmptyMovieClip(instance_name,depth);let cs=1;this.make();for(let row=0;row<this.modules.length;row++){let y=row*cs;for(let col=0;col<this.modules[row].length;col++){let x=col*cs;let dark=this.modules[row][col];if(dark){qr_mc.beginFill(0,100);qr_mc.moveTo(x,y);qr_mc.lineTo(x+cs,y);qr_mc.lineTo(x+cs,y+cs);qr_mc.lineTo(x,y+cs);qr_mc.endFill();}}}
return qr_mc;},setupTimingPattern:function(){for(let r=8;r<this.moduleCount-8;r++){if(this.modules[r][6]!=null){continue;}
this.modules[r][6]=(r%2==0);}
for(let c=8;c<this.moduleCount-8;c++){if(this.modules[6][c]!=null){continue;}
this.modules[6][c]=(c%2==0);}},setupPositionAdjustPattern:function(){let pos=QRUtil.getPatternPosition(this.typeNumber);for(let i=0;i<pos.length;i++){for(let j=0;j<pos.length;j++){let row=pos[i];let col=pos[j];if(this.modules[row][col]!=null){continue;}
for(let r=-2;r<=2;r++){for(let c=-2;c<=2;c++){if(r==-2||r==2||c==-2||c==2||(r==0&&c==0)){this.modules[row+r][col+c]=true;}else{this.modules[row+r][col+c]=false;}}}}}},setupTypeNumber:function(test){let bits=QRUtil.getBCHTypeNumber(this.typeNumber);for(let i=0;i<18;i++){let mod=(!test&&((bits>>i)&1)==1);this.modules[Math.floor(i/3)][i%3+this.moduleCount-8-3]=mod;}
for(let i=0;i<18;i++){let mod=(!test&&((bits>>i)&1)==1);this.modules[i%3+this.moduleCount-8-3][Math.floor(i/3)]=mod;}},setupTypeInfo:function(test,maskPattern){let data=(this.errorCorrectLevel<<3)|maskPattern;let bits=QRUtil.getBCHTypeInfo(data);for(let i=0;i<15;i++){let mod=(!test&&((bits>>i)&1)==1);if(i<6){this.modules[i][8]=mod;}else if(i<8){this.modules[i+1][8]=mod;}else{this.modules[this.moduleCount-15+i][8]=mod;}}
for(let i=0;i<15;i++){let mod=(!test&&((bits>>i)&1)==1);if(i<8){this.modules[8][this.moduleCount-i-1]=mod;}else if(i<9){this.modules[8][15-i-1+1]=mod;}else{this.modules[8][15-i-1]=mod;}}
this.modules[this.moduleCount-8][8]=(!test);},mapData:function(data,maskPattern){let inc=-1;let row=this.moduleCount-1;let bitIndex=7;let byteIndex=0;for(let col=this.moduleCount-1;col>0;col-=2){if(col==6)col--;while(true){for(let c=0;c<2;c++){if(this.modules[row][col-c]==null){let dark=false;if(byteIndex<data.length){dark=(((data[byteIndex]>>>bitIndex)&1)==1);}
let mask=QRUtil.getMask(maskPattern,row,col-c);if(mask){dark=!dark;}
this.modules[row][col-c]=dark;bitIndex--;if(bitIndex==-1){byteIndex++;bitIndex=7;}}}
row+=inc;if(row<0||this.moduleCount<=row){row-=inc;inc=-inc;break;}}}}};QRCodeModel.PAD0=0xEC;QRCodeModel.PAD1=0x11;QRCodeModel.createData=function(typeNumber,errorCorrectLevel,dataList){let rsBlocks=QRRSBlock.getRSBlocks(typeNumber,errorCorrectLevel);let buffer=new QRBitBuffer();for(let i=0;i<dataList.length;i++){let data=dataList[i];buffer.put(data.mode,4);buffer.put(data.getLength(),QRUtil.getLengthInBits(data.mode,typeNumber));data.write(buffer);}
let totalDataCount=0;for(let i=0;i<rsBlocks.length;i++){totalDataCount+=rsBlocks[i].dataCount;}
if(buffer.getLengthInBits()>totalDataCount*8){throw new Error("code length overflow. ("
+buffer.getLengthInBits()
+">"
+totalDataCount*8
+")");}
if(buffer.getLengthInBits()+4<=totalDataCount*8){buffer.put(0,4);}
while(buffer.getLengthInBits()%8!=0){buffer.putBit(false);}
while(true){if(buffer.getLengthInBits()>=totalDataCount*8){break;}
buffer.put(QRCodeModel.PAD0,8);if(buffer.getLengthInBits()>=totalDataCount*8){break;}
buffer.put(QRCodeModel.PAD1,8);}
return QRCodeModel.createBytes(buffer,rsBlocks);};QRCodeModel.createBytes=function(buffer,rsBlocks){let offset=0;let maxDcCount=0;let maxEcCount=0;let dcdata=new Array(rsBlocks.length);let ecdata=new Array(rsBlocks.length);for(let r=0;r<rsBlocks.length;r++){let dcCount=rsBlocks[r].dataCount;let ecCount=rsBlocks[r].totalCount-dcCount;maxDcCount=Math.max(maxDcCount,dcCount);maxEcCount=Math.max(maxEcCount,ecCount);dcdata[r]=new Array(dcCount);for(let i=0;i<dcdata[r].length;i++){dcdata[r][i]=0xff&buffer.buffer[i+offset];}
offset+=dcCount;let rsPoly=QRUtil.getErrorCorrectPolynomial(ecCount);let rawPoly=new QRPolynomial(dcdata[r],rsPoly.getLength()-1);let modPoly=rawPoly.mod(rsPoly);ecdata[r]=new Array(rsPoly.getLength()-1);for(let i=0;i<ecdata[r].length;i++){let modIndex=i+modPoly.getLength()-ecdata[r].length;ecdata[r][i]=(modIndex>=0)?modPoly.get(modIndex):0;}}
let totalCodeCount=0;for(let i=0;i<rsBlocks.length;i++){totalCodeCount+=rsBlocks[i].totalCount;}
let data=new Array(totalCodeCount);let index=0;for(let i=0;i<maxDcCount;i++){for(let r=0;r<rsBlocks.length;r++){if(i<dcdata[r].length){data[index++]=dcdata[r][i];}}}
for(let i=0;i<maxEcCount;i++){for(let r=0;r<rsBlocks.length;r++){if(i<ecdata[r].length){data[index++]=ecdata[r][i];}}}
return data;};let QRMode={MODE_NUMBER:1<<0,MODE_ALPHA_NUM:1<<1,MODE_8BIT_BYTE:1<<2,MODE_KANJI:1<<3};let QRErrorCorrectLevel={L:1,M:0,Q:3,H:2};let QRMaskPattern={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};let QRUtil={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:(1<<10)|(1<<8)|(1<<5)|(1<<4)|(1<<2)|(1<<1)|(1<<0),G18:(1<<12)|(1<<11)|(1<<10)|(1<<9)|(1<<8)|(1<<5)|(1<<2)|(1<<0),G15_MASK:(1<<14)|(1<<12)|(1<<10)|(1<<4)|(1<<1),getBCHTypeInfo:function(data){let d=data<<10;while(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G15)>=0){d^=(QRUtil.G15<<(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G15)));}
return((data<<10)|d)^QRUtil.G15_MASK;},getBCHTypeNumber:function(data){let d=data<<12;while(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G18)>=0){d^=(QRUtil.G18<<(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G18)));}
return(data<<12)|d;},getBCHDigit:function(data){let digit=0;while(data!=0){digit++;data>>>=1;}
return digit;},getPatternPosition:function(typeNumber){return QRUtil.PATTERN_POSITION_TABLE[typeNumber-1];},getMask:function(maskPattern,i,j){switch(maskPattern){case QRMaskPattern.PATTERN000:return(i+j)%2==0;case QRMaskPattern.PATTERN001:return i%2==0;case QRMaskPattern.PATTERN010:return j%3==0;case QRMaskPattern.PATTERN011:return(i+j)%3==0;case QRMaskPattern.PATTERN100:return(Math.floor(i/2)+Math.floor(j/3))%2==0;case QRMaskPattern.PATTERN101:return(i*j)%2+(i*j)%3==0;case QRMaskPattern.PATTERN110:return((i*j)%2+(i*j)%3)%2==0;case QRMaskPattern.PATTERN111:return((i*j)%3+(i+j)%2)%2==0;default:throw new Error("bad maskPattern:"+maskPattern);}},getErrorCorrectPolynomial:function(errorCorrectLength){let a=new QRPolynomial([1],0);for(let i=0;i<errorCorrectLength;i++){a=a.multiply(new QRPolynomial([1,QRMath.gexp(i)],0));}
return a;},getLengthInBits:function(mode,type){if(1<=type&&type<10){switch(mode){case QRMode.MODE_NUMBER:return 10;case QRMode.MODE_ALPHA_NUM:return 9;case QRMode.MODE_8BIT_BYTE:return 8;case QRMode.MODE_KANJI:return 8;default:throw new Error("mode:"+mode);}}else if(type<27){switch(mode){case QRMode.MODE_NUMBER:return 12;case QRMode.MODE_ALPHA_NUM:return 11;case QRMode.MODE_8BIT_BYTE:return 16;case QRMode.MODE_KANJI:return 10;default:throw new Error("mode:"+mode);}}else if(type<41){switch(mode){case QRMode.MODE_NUMBER:return 14;case QRMode.MODE_ALPHA_NUM:return 13;case QRMode.MODE_8BIT_BYTE:return 16;case QRMode.MODE_KANJI:return 12;default:throw new Error("mode:"+mode);}}else{throw new Error("type:"+type);}},getLostPoint:function(qrCode){let moduleCount=qrCode.getModuleCount();let lostPoint=0;for(let row=0;row<moduleCount;row++){for(let col=0;col<moduleCount;col++){let sameCount=0;let dark=qrCode.isDark(row,col);for(let r=-1;r<=1;r++){if(row+r<0||moduleCount<=row+r){continue;}
for(let c=-1;c<=1;c++){if(col+c<0||moduleCount<=col+c){continue;}
if(r==0&&c==0){continue;}
if(dark==qrCode.isDark(row+r,col+c)){sameCount++;}}}
if(sameCount>5){lostPoint+=(3+sameCount-5);}}}
for(let row=0;row<moduleCount-1;row++){for(let col=0;col<moduleCount-1;col++){let count=0;if(qrCode.isDark(row,col))count++;if(qrCode.isDark(row+1,col))count++;if(qrCode.isDark(row,col+1))count++;if(qrCode.isDark(row+1,col+1))count++;if(count==0||count==4){lostPoint+=3;}}}
for(let row=0;row<moduleCount;row++){for(let col=0;col<moduleCount-6;col++){if(qrCode.isDark(row,col)&&!qrCode.isDark(row,col+1)&&qrCode.isDark(row,col+2)&&qrCode.isDark(row,col+3)&&qrCode.isDark(row,col+4)&&!qrCode.isDark(row,col+5)&&qrCode.isDark(row,col+6)){lostPoint+=40;}}}
for(let col=0;col<moduleCount;col++){for(let row=0;row<moduleCount-6;row++){if(qrCode.isDark(row,col)&&!qrCode.isDark(row+1,col)&&qrCode.isDark(row+2,col)&&qrCode.isDark(row+3,col)&&qrCode.isDark(row+4,col)&&!qrCode.isDark(row+5,col)&&qrCode.isDark(row+6,col)){lostPoint+=40;}}}
let darkCount=0;for(let col=0;col<moduleCount;col++){for(let row=0;row<moduleCount;row++){if(qrCode.isDark(row,col)){darkCount++;}}}
let ratio=Math.abs(100*darkCount/moduleCount/moduleCount-50)/5;lostPoint+=ratio*10;return lostPoint;}};let QRMath={glog:function(n){if(n<1){throw new Error("glog("+n+")");}
return QRMath.LOG_TABLE[n];},gexp:function(n){while(n<0){n+=255;}
while(n>=256){n-=255;}
return QRMath.EXP_TABLE[n];},EXP_TABLE:new Array(256),LOG_TABLE:new Array(256)};for(let i=0;i<8;i++){QRMath.EXP_TABLE[i]=1<<i;}
for(let i=8;i<256;i++){QRMath.EXP_TABLE[i]=QRMath.EXP_TABLE[i-4]^QRMath.EXP_TABLE[i-5]^QRMath.EXP_TABLE[i-6]^QRMath.EXP_TABLE[i-8];}
for(let i=0;i<255;i++){QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]]=i;}
function QRPolynomial(num,shift){if(num.length==undefined){throw new Error(num.length+"/"+shift);}
let offset=0;while(offset<num.length&&num[offset]==0){offset++;}
this.num=new Array(num.length-offset+shift);for(let i=0;i<num.length-offset;i++){this.num[i]=num[i+offset];}}
QRPolynomial.prototype={get:function(index){return this.num[index];},getLength:function(){return this.num.length;},multiply:function(e){let num=new Array(this.getLength()+e.getLength()-1);for(let i=0;i<this.getLength();i++){for(let j=0;j<e.getLength();j++){num[i+j]^=QRMath.gexp(QRMath.glog(this.get(i))+QRMath.glog(e.get(j)));}}
return new QRPolynomial(num,0);},mod:function(e){if(this.getLength()-e.getLength()<0){return this;}
let ratio=QRMath.glog(this.get(0))-QRMath.glog(e.get(0));let num=new Array(this.getLength());for(let i=0;i<this.getLength();i++){num[i]=this.get(i);}
for(let i=0;i<e.getLength();i++){num[i]^=QRMath.gexp(QRMath.glog(e.get(i))+ratio);}
return new QRPolynomial(num,0).mod(e);}};function QRRSBlock(totalCount,dataCount){this.totalCount=totalCount;this.dataCount=dataCount;}
QRRSBlock.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]];QRRSBlock.getRSBlocks=function(typeNumber,errorCorrectLevel){let rsBlock=QRRSBlock.getRsBlockTable(typeNumber,errorCorrectLevel);if(rsBlock==undefined){throw new Error("bad rs block @ typeNumber:"+typeNumber+"/errorCorrectLevel:"+errorCorrectLevel);}
let length=rsBlock.length/3;let list=[];for(let i=0;i<length;i++){let count=rsBlock[i*3+0];let totalCount=rsBlock[i*3+1];let dataCount=rsBlock[i*3+2];for(let j=0;j<count;j++){list.push(new QRRSBlock(totalCount,dataCount));}}
return list;};QRRSBlock.getRsBlockTable=function(typeNumber,errorCorrectLevel){switch(errorCorrectLevel){case QRErrorCorrectLevel.L:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+0];case QRErrorCorrectLevel.M:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+1];case QRErrorCorrectLevel.Q:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+2];case QRErrorCorrectLevel.H:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+3];default:return undefined;}};function QRBitBuffer(){this.buffer=[];this.length=0;}
QRBitBuffer.prototype={get:function(index){let bufIndex=Math.floor(index/8);return((this.buffer[bufIndex]>>>(7-index%8))&1)==1;},put:function(num,length){for(let i=0;i<length;i++){this.putBit(((num>>>(length-i-1))&1)==1);}},getLengthInBits:function(){return this.length;},putBit:function(bit){let bufIndex=Math.floor(this.length/8);if(this.buffer.length<=bufIndex){this.buffer.push(0);}
if(bit){this.buffer[bufIndex]|=(0x80>>>(this.length%8));}
this.length++;}};let QRCodeLimitLength=[[17,14,11,7],[32,26,20,14],[53,42,32,24],[78,62,46,34],[106,84,60,44],[134,106,74,58],[154,122,86,64],[192,152,108,84],[230,180,130,98],[271,213,151,119],[321,251,177,137],[367,287,203,155],[425,331,241,177],[458,362,258,194],[520,412,292,220],[586,450,322,250],[644,504,364,280],[718,560,394,310],[792,624,442,338],[858,666,482,382],[929,711,509,403],[1003,779,565,439],[1091,857,611,461],[1171,911,661,511],[1273,997,715,535],[1367,1059,751,593],[1465,1125,805,625],[1528,1190,868,658],[1628,1264,908,698],[1732,1370,982,742],[1840,1452,1030,790],[1952,1538,1112,842],[2068,1628,1168,898],[2188,1722,1228,958],[2303,1809,1283,983],[2431,1911,1351,1051],[2563,1989,1423,1093],[2699,2099,1499,1139],[2809,2213,1579,1219],[2953,2331,1663,1273]];


/** Constructor */
function QRCode(options) {
  this.options = {
    typeNumber: 4,
    ecl: 'L'
  };
  
  //In case the options is string
  if (typeof options === 'string') {
    options = {
      content: options
    };
  }
  
  //Merge options
  if (options) {
    for (let i in options) {
      this.options[i] = options[i];
    }
  }
    
  //Gets the error correction level
  function _getErrorCorrectLevel(ecl) {
    switch (ecl) {
        case "L":
          return QRErrorCorrectLevel.L;
          
        case "M":
          return QRErrorCorrectLevel.M;
          
        case "Q":
          return QRErrorCorrectLevel.Q;
          
        case "H":
          return QRErrorCorrectLevel.H;
          
        default:
          throw new Error("Unknwon error correction level: " + ecl);
      }
  }
  
  //Get type number
  function _getTypeNumber(content, ecl) {      
    let length = _getUTF8Length(content);
    let type = 1;
    let limit = 0;
    for (let i = 0, len = QRCodeLimitLength.length; i <= len; i++) {
      let table = QRCodeLimitLength[i];
      if (!table) {
        throw new Error("Content too long: expected " + limit + " but got " + length);
      }
      
      switch (ecl) {
        case "L":
          limit = table[0];
          break;
          
        case "M":
          limit = table[1];
          break;
          
        case "Q":
          limit = table[2];
          break;
          
        case "H":
          limit = table[3];
          break;
          
        default:
          throw new Error("Unknwon error correction level: " + ecl);
      }
      
      if (length <= limit) {
        break;
      }
      
      type++;
    }
    
    if (type > QRCodeLimitLength.length) {
      throw new Error("Content too long");
    }
    
    return type;
  }

  //Gets text length
  function _getUTF8Length(content) {
    let result = encodeURI(content).toString().replace(/\%[0-9a-fA-F]{2}/g, 'a');
    return result.length + (result.length != content ? 3 : 0);
  }
  
  //Generate QR Code matrix
  let content = this.options.content;
  let type = _getTypeNumber(content, this.options.ecl);
  let ecl = _getErrorCorrectLevel(this.options.ecl);
  this.qrcode = new QRCodeModel(type, ecl);
  this.qrcode.addData(content);
  this.qrcode.make();
}

function qr(data) {
  const qrElement = [EOL];
  const qrData = new QRCode(data).qrcode.modules;
  if ((qrData.length & 1) === 1) {
    const arr = new Array(qrData.length);
    qrData.push(arr.fill(0));
  }
  for (let y = 0; y < qrData.length - 1; y++) {
    qrElement.push('  '); // Padding left
    for (let x = 0; x < qrData.length; x++) {
      qrElement.push((qrData[y][x] && qrData[y + 1][x]) ? '█' : (qrData[y][x] && !qrData[y + 1][x]) ? '▀' : (!qrData[y][x] && qrData[y + 1][x]) ? '▄' : ' ');
    }
    qrElement.push(EOL); // End two lines of QR-code
    y++;
  }
  return qrElement.join('');
}
