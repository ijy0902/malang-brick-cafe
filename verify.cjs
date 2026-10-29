// Run with Node.js: node verify.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, {
    textContent: '', innerHTML: '', classList: {add(){},remove(){}},
    setAttribute(){}, addEventListener(){},
    getContext: () => new Proxy({}, {get:()=>()=>{}}),
  });
  return elements.get(id);
}
const context = {
  document: {querySelector:()=>element('game'), getElementById:element, addEventListener(){}},
  window:{addEventListener(){}}, localStorage:{getItem:()=>0,setItem(){}},
  performance:{now:()=>0},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},
  console,
};
vm.createContext(context);
const source=fs.readFileSync('game.js','utf8').replace(/\}\)\(\);\s*$/, `
globalThis.test={start,pause,update,hit,
 get state(){return state},get level(){return level},get bricks(){return bricks},
 get ball(){return ball},get paddle(){return paddle},get lives(){return lives},get score(){return score}};
})();`);
vm.runInContext(source,context);
const t=context.test;
t.start(); assert.equal(t.state,'playing'); assert.equal(t.bricks.length,32);
t.pause(); const x=t.ball.x; t.update(.02);assert.equal(t.ball.x,x);assert.equal(t.state,'paused');t.start();
t.ball.x=2;t.ball.vx=-200;t.update(.01);assert.ok(t.ball.vx>0,'wall reflects ball');
t.ball.x=t.paddle.x+60;t.ball.y=480;t.ball.vy=300;t.update(.02);assert.ok(t.ball.vy<0,'paddle reflects ball');
const b=t.bricks.find(b=>b.alive);t.ball.x=b.x+40;t.ball.y=b.y+b.h+10;t.ball.vy=-300;t.ball.vx=0;t.update(.01);assert.equal(b.alive,false);assert.ok(t.score>0);
for (const b of [...t.bricks]) if(b.alive)t.hit(b);assert.equal(t.level,2);assert.equal(t.state,'ready');
t.start();for(const b of [...t.bricks])if(b.alive)t.hit(b);assert.equal(t.level,3);
t.start();for(const b of [...t.bricks])if(b.alive)t.hit(b);assert.equal(t.state,'won');
t.start();assert.equal(t.level,1);assert.equal(t.score,0);
for(let i=0;i<3;i++){t.ball.y=560;t.ball.vy=300;t.update(.01);if(i<2){assert.equal(t.state,'ready');t.start();}}
assert.equal(t.state,'lost');assert.equal(t.lives,0);
console.log('PASS: wall, paddle, brick collision; pause; 3 stages; win; restart; life loss and game over.');
