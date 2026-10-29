'use strict';
(() => {
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id), W=800,H=540,colors=['#e9aaa5','#ecc387','#b7c9a2','#b3c9d8','#c9b8d8'];
let state='menu',score=0,level=1,lives=3,best=0,combo=0,bricks=[],particles=[],keys={},last=0,sound=false,audio;
try{best=Number(localStorage.getItem('malang-best'))||0;}catch{}
let paddle={x:340,y:490,w:120,h:17},ball={x:400,y:478,vx:190,vy:-310,r:9},trail=[];
function hud(){$('score').textContent=String(score).padStart(4,'0');$('stage').textContent=`0${level} / 03`;$('lives').textContent='♥ '.repeat(lives).trim()||'♡';$('lives').setAttribute('aria-label',`남은 목숨 ${lives}`);$('best').textContent=`BEST ${best}`;}
function beep(f=500){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(f*.6,audio.currentTime+.12);g.gain.setValueAtTime(.07,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.13);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.14);}catch{}}
function build(){bricks=[];const rows=3+level,cols=8;for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){if(level===2&&(row+col)%7===0)continue;if(level===3&&row===0&&(col<2||col>5))continue;bricks.push({x:39+col*91,y:64+row*40,w:82,h:29,color:colors[row%5],alive:true});}}
function resetBall(){paddle.x=340;ball={x:400,y:478,vx:(Math.random()>.5?1:-1)*(180+level*15),vy:-300-level*25,r:9};trail=[];combo=0;}
function panel(title,detail,button){$('message').textContent=title;$('detail').textContent=detail;$('play').innerHTML=button+' <span>↗</span>';$('overlay').classList.remove('hidden');$('pause').textContent='Ⅱ 일시정지';}
function start(){if(state==='paused'){state='playing';}else if(state==='ready'){state='playing';}else{score=0;level=1;lives=3;build();resetBall();state='playing';}last=performance.now();$('overlay').classList.add('hidden');hud();beep();}
function pause(){if(state==='playing'){state='paused';panel('잠깐, 티타임 ☕','준비되면 다시 말랑하게 시작해요.','계속하기');$('pause').textContent='▶ 계속하기';}else if(state==='paused')start();}
function save(){if(score>best){best=score;try{localStorage.setItem('malang-best',String(best));}catch{}}hud();}
let toastTimer;function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),850);}
function hit(b){b.alive=false;combo++;score+=10*level+(combo>1?Math.min(combo,10)*2:0);for(let i=0;i<10;i++)particles.push({x:b.x+b.w/2,y:b.y+b.h/2,vx:(Math.random()-.5)*230,vy:(Math.random()-.5)*210,t:.6,color:b.color});beep(420+combo*35);if(combo===5||combo===10)toast(`${combo} COMBO! ✦`);save();if(bricks.every(b=>!b.alive)){if(level===3){state='won';panel('달콤한 올 클리어! ✨',`${score}점! 오늘의 브릭 파티를 멋지게 마쳤어요.`,'한 번 더 즐기기');}else{level++;build();resetBall();state='ready';panel(`스테이지 ${level} 오픈! 🍰`,'조금 더 바삭한 마카롱이 기다리고 있어요.','다음 스테이지');hud();}}}
function update(dt){particles=particles.filter(p=>(p.t-=dt)>0);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=200*dt;}if(state!=='playing')return;
if(keys.ArrowLeft||keys.a)paddle.x-=530*dt;if(keys.ArrowRight||keys.d)paddle.x+=530*dt;paddle.x=Math.max(0,Math.min(W-paddle.w,paddle.x));
const steps=Math.max(1,Math.ceil(dt/.006));for(let s=0;s<steps&&state==='playing';s++){const step=dt/steps,px=ball.x,py=ball.y;ball.x+=ball.vx*step;ball.y+=ball.vy*step;
if(ball.x<ball.r){ball.x=ball.r;ball.vx=Math.abs(ball.vx);}if(ball.x>W-ball.r){ball.x=W-ball.r;ball.vx=-Math.abs(ball.vx);}if(ball.y<ball.r){ball.y=ball.r;ball.vy=Math.abs(ball.vy);}
if(ball.vy>0&&ball.y+ball.r>=paddle.y&&py+ball.r<=paddle.y+paddle.h&&ball.x+ball.r>=paddle.x&&ball.x-ball.r<=paddle.x+paddle.w){const offset=Math.max(-1,Math.min(1,(ball.x-paddle.x-paddle.w/2)/(paddle.w/2))),speed=Math.min(540,Math.hypot(ball.vx,ball.vy)+5);ball.vx=Math.sin(offset*1.05)*speed;ball.vy=-Math.cos(offset*1.05)*speed;ball.y=paddle.y-ball.r;combo=0;beep(260);}
for(const b of bricks){if(!b.alive)continue;const nx=Math.max(b.x,Math.min(b.x+b.w,ball.x)),ny=Math.max(b.y,Math.min(b.y+b.h,ball.y));if((ball.x-nx)**2+(ball.y-ny)**2<=ball.r**2){if(px+ball.r<=b.x||px-ball.r>=b.x+b.w)ball.vx*=-1;else ball.vy*=-1;ball.x=px;ball.y=py;hit(b);break;}}
if(ball.y-ball.r>H){lives--;beep(140);hud();if(!lives){state='lost';save();panel('괜찮아, 한 입 더! 🍪',`${score}점을 모았어요. 다시 도전해 볼까요?`,'다시 도전하기');}else{resetBall();state='ready';panel('푸딩이 잠깐 쉬러 갔어요','남은 하트로 다시 통통 튕겨봐요!','계속 도전하기');}}}
trail.push({x:ball.x,y:ball.y});if(trail.length>9)trail.shift();}
function round(x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function draw(){ctx.clearRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle='#e6dccb';ctx.font='11px sans-serif';ctx.fillText('HAVE A SWEET LITTLE DAY',400,31);
for(const b of bricks){if(!b.alive)continue;round(b.x,b.y+3,b.w,b.h,9,'#cbb7a647');round(b.x,b.y,b.w,b.h,9,b.color);round(b.x+8,b.y+4,b.w-16,3,2,'#ffffff45');ctx.fillStyle='#68524b';ctx.beginPath();ctx.arc(b.x+34,b.y+15,1.5,0,7);ctx.arc(b.x+48,b.y+15,1.5,0,7);ctx.fill();ctx.strokeStyle='#85685d';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(b.x+41,b.y+17,3,0,Math.PI);ctx.stroke();}
trail.forEach((p,i)=>{ctx.globalAlpha=i/35;ctx.fillStyle='#d9b582';ctx.beginPath();ctx.arc(p.x,p.y,ball.r*i/9,0,7);ctx.fill();});ctx.globalAlpha=1;
round(paddle.x,paddle.y+4,paddle.w,paddle.h,9,'#d3c9b5');round(paddle.x,paddle.y,paddle.w,paddle.h,9,'#8ea78b');round(paddle.x+12,paddle.y+3,paddle.w-24,3,2,'#ffffff55');ctx.fillStyle='#f0c57e';ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,7);ctx.fill();ctx.fillStyle='#fff4d7';ctx.beginPath();ctx.arc(ball.x-3,ball.y-3,3,0,7);ctx.fill();
for(const p of particles){ctx.globalAlpha=p.t/.6;round(p.x,p.y,5,5,2,p.color);}ctx.globalAlpha=1;}
function frame(t){const dt=Math.min((t-last)/1000,.035);last=t;update(dt);draw();requestAnimationFrame(frame);}
function move(e){const rect=canvas.getBoundingClientRect();paddle.x=Math.max(0,Math.min(W-paddle.w,(e.clientX-rect.left)*W/rect.width-paddle.w/2));if(state==='ready')ball.x=paddle.x+paddle.w/2;}
canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);move(e);});
window.addEventListener('keydown',e=>{if(e.target.tagName==='BUTTON')return;if(['ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key]=true;if(e.code==='Space'&&!e.repeat){if(state==='playing'||state==='paused')pause();else start();}});window.addEventListener('keyup',e=>keys[e.key]=false);window.addEventListener('blur',()=>{keys={};if(state==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause();});
$('play').onclick=start;$('pause').onclick=pause;$('restart').onclick=()=>{state='menu';start();};$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'소리 ON':'소리 OFF';$('sound').setAttribute('aria-label',sound?'효과음 끄기':'효과음 켜기');if(sound)beep();};
build();resetBall();hud();requestAnimationFrame(frame);
})();
