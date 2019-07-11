// 元素
var container = document.getElementById('game');
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
/**
* 游戏相关配置
* @type {Object}
*/
var CONFIG = {
  status: 'start', // 游戏开始默认为开始中
  level: 1, // 游戏默认等级
  totalLevel: 6, // 总共6关
  numPerLine: 7, // 游戏默认每行多少个怪兽
  canvasPadding: 30, // 默认画布的间隔
  bulletSize: 10, // 默认子弹长度
  bulletSpeed: 10, // 默认子弹的移动速度
  enemySpeed: 2, // 默认敌人移动距离
  enemySize: 50, // 默认敌人的尺寸
  enemyGap: 10,  // 默认敌人之间的间距
  enemyIcon: './img/enemy.png', // 怪兽的图像
  enemyBoomIcon: './img/boom.png', // 怪兽死亡的图像
  enemyDirection: 'right', // 默认敌人一开始往右移动
  planeSpeed: 5, // 默认飞机每一步移动的距离
  planeSize: {
    width: 60,
    height: 100
  }, // 默认飞机的尺寸,
  planeIcon: './img/plane.png',
};
/**
 * 整个游戏对象
 */
var GAME = {
  /**
   * 初始化函数,这个函数只执行一次
   * @param  {object} opts 
   * @return {[type]}      [description]
   */
  init: function(opts) {
    this.status = CONFIG.status;
    //记录当前关数
    this.level = CONFIG.level;
    //实时记录分数
    this.totalScore = 0;
    this.bindEvent();
  },
  bindEvent: function() {
    var self = this;
    var playBtn = document.querySelector('.js-play');
    // 开始游戏按钮绑定
    playBtn.onclick = function() {
      self.play();
    };
  },
  /**
   * 更新游戏状态，分别有以下几种状态：
   * start  游戏前
   * playing 游戏中
   * failed 游戏失败
   * success 游戏成功
   * all-success 游戏通过
   * stop 游戏暂停（可选）
   */
  setStatus: function(status) {
    this.status = status;
    container.setAttribute("data-status", status);
  },
  play: function() {
    this.setStatus('playing');
    //创建特定飞机对象
    this.plane = new Plane();
    this.plane.createPlane();
    //画出怪兽
    this.monster = [];
    //单局总怪兽数量
    this.totalMonsterNum = this.level * CONFIG.numPerLine;
    //实时怪兽数量
    this.monsterNum = this.level * CONFIG.numPerLine;
    //将怪兽压入数组内并创建image对象
    for(var i=0; i<this.level; i++){
        for(var j=0 ; j<CONFIG.numPerLine; j++){
          var monster = new Monster();
          monster.y += (i * (monster.blank + monster.height));
          monster.x += (j * (monster.blank + monster.width));
          monster.createMonster();
          this.monster.push(monster);
      }
    }
    //帧数统计
    this.currentFrame = 0;
    //键盘事件绑定
    bindKeyEvent();
    //动画更新事件
    move();
  },
  start: function(){
    this.level = CONFIG.level;
    //实时记录分数
    this.totalScore = 0;
    this.setStatus('start');
    this.bindEvent();
  },
  failed: function(){
    var self = this;
    this.setStatus('failed');
    var score = document.querySelector('.score');
    score.textContent = GAME.totalScore;
    var restartBtn = document.querySelectorAll('.js-replay');
    restartBtn[0].onclick = function(){
      self.start();
    };
  },
  success: function(){
    var self = this;
    this.setStatus('success');
    var nextLevel = document.querySelector('.game-next-level');
    nextLevel.textContent = '下一关卡：' + this.level;
    var nextBtn = document.querySelector('.js-next');
    nextBtn.onclick = function(){
      self.play();
    };
  },
  allSuccess: function(){
    var self = this;
    this.setStatus('all-success');
    var restartBtn = document.querySelectorAll('.js-replay');
    restartBtn[1].onclick = function(){
      self.start();
    };
  },
};


// 初始化
GAME.init();

/**
 * 飞机对象
 * 尺寸为 60 * 100
 * 飞机图像 img/plane.png
 * 默认飞机移动的步伐长度为 5
 */
function Plane(){
  this.x = (canvas.width/2) - (CONFIG.planeSize.width/2);
  this.y = canvas.height - CONFIG.canvasPadding - CONFIG.planeSize.height;
  this.width = CONFIG.planeSize.width;
  this.height = CONFIG.planeSize.height;
  this.step = CONFIG.planeSpeed;
  this.direction = null;
  this.src = CONFIG.planeIcon;
  this.bulletDistance = CONFIG.bulletSpeed;
  this.bullets = [];
}
Plane.prototype.createPlane = function(){
  var img = new Image();
  img.src = this.src;
  var imgX = this.x;
  var imgY = this.y;
  var imgWidth = this.width;
  var imgHeight = this.height;
  img.onload = function(){
    context.drawImage(img, imgX, imgY, imgWidth, imgHeight);
  }
  this.img = img;
};
Plane.prototype.movePlane = function(){
  //向右移动，并设边界
  var moveRightSide = canvas.width - CONFIG.planeSize.width - CONFIG.canvasPadding;
  if(this.direction === 'right' && this.x < moveRightSide){
    this.x += this.step;
  }
  //向左移动
  else if(this.direction === 'left' && this.x > CONFIG.canvasPadding){
    this.x -= this.step;
  }
};
Plane.prototype.autoChangeBullet = function(i){
  this.bullets[i].beginY -= this.bulletDistance;
};

/**
 * 怪兽对象
 * 尺寸为 50 * 50
 */
function Monster(){
  this.x = CONFIG.canvasPadding;
  this.y = CONFIG.canvasPadding;
  this.width = CONFIG.enemySize;
  this.height = CONFIG.enemySize;
  this.step = CONFIG.enemySpeed;
  this.blank = CONFIG.enemyGap;
  this.time = 0;
  this.direction = CONFIG.enemyDirection;
  this.status = 'alive';
  this.src = CONFIG.enemyIcon;
  this.boomSrc = CONFIG.enemyBoomIcon;
  this.boomFrame;
}
Monster.prototype.createMonster = function(){
  var img = new Image();
  img.src = this.src;
  var imgX = this.x;
  var imgY = this.y;
  var imgWidth = this.width;
  var imgHeight = this.height;
  img.onload = function(){
    context.drawImage(img, imgX, imgY, imgWidth, imgHeight);
  }
  this.img = img;
};
Monster.prototype.autoMoveMonster = function(direction){
  switch (direction){
    case ('right'):
      this.x += this.step;
      break;
    case ('left'):
      this.x -= this.step;
      break;
  }
};
/**
 * 绑定键盘事件
 */
function bindKeyEvent(){
  document.onkeydown = function(e){
    switch(e.keyCode){
      case 37:
        GAME.plane.direction = 'left';
        GAME.plane.movePlane();
        break;
      case 39:
        GAME.plane.direction = 'right';
        GAME.plane.movePlane();
        break;
      case 32:
        var bullet = {
          beginX: GAME.plane.x + (GAME.plane.width / 2),
          beginY: GAME.plane.y,
        };
        GAME.plane.bullets.push(bullet);
        break;
    }
  }
  document.onkeyup = function(e){
    switch(e.keyCode){
      case 37:
        GAME.plane.direction = null;
        break;
      case 39:
        GAME.plane.direction = null;
        break;
    }
  }
};
/**
 * 画子弹
 * @param {*} x 起始位置x坐标
 * @param {*} y 起始位置y坐标
 * @param {*} distance 直线长度
 */
function drawLine(x,y,distance){
  context.strokeStyle = 'white';
  context.beginPath();
  context.moveTo(x,y);
  context.lineTo(x, y + distance);
  context.stroke();
};
/**
 * 子弹和怪兽碰撞事件
 */
function punchBoom(target , currentFrame){
  for(var k=0, len=GAME.plane.bullets.length; k<len; k++){
    if(GAME.plane.bullets[k].beginX > target.x && GAME.plane.bullets[k].beginX < (target.x + target.width) && (GAME.plane.bullets[k].beginY + GAME.plane.bulletDistance) < (target.y + target.height)){
      target.status = 'dying';
      var img = new Image();
      img.src = target.boomSrc;
      target.img = img;
      GAME.plane.bullets.splice(k,1);
      var boomFrame = currentFrame;
      return boomFrame;
    }
  }
}   
//浏览器初始化统一
window.requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
  window.setTimeout(callback, 1000/30);
};
/**
 * 刷新动画
 */
function move(){
  //清除画布
  context.clearRect(0, 0, canvas.width, canvas.height);

  //更新飞机
  context.drawImage(GAME.plane.img, GAME.plane.x, GAME.plane.y, GAME.plane.width, GAME.plane.height);

  //更新子弹
  for (var k=0, len=GAME.plane.bullets.length; k<len; k++){
    drawLine(GAME.plane.bullets[k].beginX, GAME.plane.bullets[k].beginY, GAME.plane.bulletDistance);
    GAME.plane.autoChangeBullet(k);
    //当子弹到边时删除该子弹
    if(GAME.plane.bullets[k].beginY <= 0){
      GAME.plane.bullets.shift();
      break;
    }
  }

  //子弹碰撞怪兽
  for(var i=0 ; i < GAME.monsterNum; i++){
    if(GAME.monster[i].status === 'alive'){
      GAME.monster[i].boomFrame = punchBoom(GAME.monster[i], GAME.currentFrame);
    }
    if(GAME.monster[i].status === 'dying'){
      switch (GAME.currentFrame){
        case (GAME.monster[i].boomFrame + 1):
          GAME.monster[i].x += 20;
          GAME.monster[i].y += 20;
          GAME.monster[i].width = 10;
          GAME.monster[i].height = 10;
          break;
        case (GAME.monster[i].boomFrame + 2):
          GAME.monster[i].x -= 10;
          GAME.monster[i].y -= 10;
          GAME.monster[i].width = 30;
          GAME.monster[i].height = 30;
          break;
        case (GAME.monster[i].boomFrame + 3):
          GAME.monster[i].x -= 10;
          GAME.monster[i].y -= 10;
          GAME.monster[i].width = 50;
          GAME.monster[i].height = 50;
          break;
        case (GAME.monster[i].boomFrame + 4):
          GAME.monster[i].status = 'dead'
          break;
      }
    }
  }
  for(var i=0; i<GAME.monsterNum; i++){
    if(GAME.monster[i].status === 'dead'){
      GAME.monster.splice(i,1);
      GAME.monsterNum--;
    }
  }

  //更新怪兽
  for(var i=0 ; i < GAME.monsterNum; i++){
    if(GAME.monster[i].x <30){
      for (var j=0 ; j<GAME.monsterNum; j++){
        GAME.monster[j].direction = 'right';
        GAME.monster[j].y += 50;
      }
      break;
    }else if(GAME.monster[i].x > 620){
      for (var j=0 ; j<GAME.monsterNum; j++){
        GAME.monster[j].direction = 'left';
        GAME.monster[j].y += 50;
      }
      break;
    }
  }
  for (var i=0 ; i<GAME.monsterNum; i++){
    GAME.monster[i].autoMoveMonster(GAME.monster[i].direction);
    context.drawImage(GAME.monster[i].img, GAME.monster[i].x, GAME.monster[i].y, GAME.monster[i].width, GAME.monster[i].height);
  }

  //显示分数
  context.font = 'bold 18px Arial';
  context.fillStyle = 'white';
  var score = GAME.totalScore + GAME.totalMonsterNum - GAME.monsterNum;
  context.fillText('分数：'+ score, 20, 20);
  //帧数统计
  GAME.currentFrame ++;
  
  //循环
  var globalID = requestAnimationFrame(move);

  //游戏成功，结束循环跳出
  if(GAME.monster.length === 0){
    cancelAnimationFrame(globalID);
    context.clearRect(0, 0, canvas.width, canvas.height);
    if(GAME.level<CONFIG.totalLevel){
      GAME.level+=1;
      GAME.totalScore = score;
      GAME.success();
    }else if(GAME.level === CONFIG.totalLevel){
      GAME.totalScore = score;
      GAME.allSuccess();
    }
  }else if(GAME.monster[GAME.monsterNum-1].y > 420){
    cancelAnimationFrame(globalID);
    context.clearRect(0, 0, canvas.width, canvas.height);
    GAME.totalScore = score;
    GAME.failed();
  }
  
};