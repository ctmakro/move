var geid = (i)=>document.getElementById(i)
var ce = (i)=>document.createElement(i)
var print = console.log
var range = (i)=>{
  // if(i === undefined) throw 'input to range() is undefined'
  var arr=[];
  for(var k=0;k<i;k++)arr.push(k);
  return arr;
}
var random = (i)=>Math.random() * i
var choice = (i)=>Math.floor(random(i))
var gaussian = (i)=>Math.tanh(random(Math.PI)-Math.PI/2)*i
var assert = (cond,msg)=>{
  if(!cond)
  throw 'assert failed'+(msg?': '+msg.toString():"")
}

var thisf = f=>function(a1,a2,a3,a4,a5){return f(this,a1,a2,a3,a4,a5)}
// var cond = (cond,exp1,exp2)=>cond?exp1:exp2;
var cond = function(){
  var arr = arguments
  for(var i=0;i<arr.length;i+=2){
    if(arr[i+1]!==undefined){if(arr[i]){return arr[i+1]}}
    else{return arr[i]}
  }
}

var range = x=>{var a=[];for(var i=0;i<x;i++)a.push(i);return a}
var zeros = i=>range(i).map(x=>0)
var ones = i=>range(i).map(x=>1)

var make = (()=>{
  var fp = Function.prototype
  // var apply_populator = (obj,populator)=>{
  //   if(typeof populator ==='function')
  //   populator(obj);
  //   else
  //   Object.assign(obj,populator);
  // }
  // var apply_populators = (obj,arr)=>arr.map(p=>apply_populator(obj,p))
  // var copyobject=obj=>Object.assign({},obj)
  // var newclass = ()=>{
  //   var i = function (){
  //     if(this.global===undefined&&this.window===undefined){
  //       // check if called with new operator. optimized for speed
  //       this.init.apply(this,arguments)
  //     }else{
  //       var inst = {};inst.__proto__ = i.prototype
  //       inst.init.apply(inst,arguments)
  //       return inst
  //       // return new i()
  //     }
  //   }
  //   return i
  // }

  // instancing, equivalent to 'new class(arguments)'
  // fp.new = function(){
  //   var inst = {};inst.__proto__ = this.prototype
  //   // instance.__proto__ = this.prototype
  //   inst.init.apply(inst,arguments)
  //   return inst
  // }

  // fp.is = thisf((t,instance)=>instance.__proto__===t.prototype)
  // fp.self_populate = thisf(t=>apply_populators(t.prototype,t.populators))

  // var baseclass = newclass()
  // var baseclass = function(){}

  // Master of FP
  var _make = parent => {
    return populator => {
      var proto = {}
      // var supermeth = (name,self)=> function(){parent.prototype[name].apply(self,args)}
      if(typeof populator==='function'){
        populator(proto, parent.prototype)
      }else{
        Object.assign(proto, populator)
      }
      proto.__proto__ = parent.prototype

      var nc = proto.init?
      function(){proto.init.apply(this,arguments)}:
      function(){}
      nc.prototype = proto
      return nc
    }
  }

  fp.make = function(p){
    return _make(this)(p)
  }
  var base = function(){}
  base.prototype.setp = function(o){return Object.assign(this,o)}
  var make = _make(base)
  return make
})()

// below are tests, please ignore

function test0(){
  var Animal = make(p=>{
    p.init = function(sound){
      this.sound = sound
    }
    p.say = function(){
      print(this.sound)
    }
    Object.defineProperty(p,'legs',{
      get(){return 4},
      set(x){}
    })
  })

  var Sheep = Animal.make((p,s)=>{
    p.init = function(){
      s.init.call(this,'baa')
    }
  })

  var s = new Sheep()
  s.say() // 'baa'

  // or pass in a 'populator object'
  var AngrySheep = Sheep.make({
    say(){print(this.sound+'!!!')}
  })

  var as = new AngrySheep()
  as.say() // 'baa!!!'
}
// test0()

function test(){
  var Animal = make(p=>{
    // p.init=function () {
    //   this.legs = 4
    // }
    p.say = thisf(t=>print('Animal:',t.sound))
  })

  var Sheep = Animal.make((p,s)=>{
    p.init = function(){
      // s.init.call(this)
      // Animal.prototype['init'].call(this)
      print('should be true',s === Animal.prototype)
      print('should be false',s === Sheep.prototype)

      this.sound = 'baa'
    }
    p.say = thisf(t=>print('Sheep:',t.sound))
  })

  var AngrySheep = Sheep.make((p,s)=>{
    p.init=function(){
      s.init.call(this)

      this.sound+='!!!!..'
    }
  })

  var VeryAngry = AngrySheep.make((p,s)=>{
    p.init = function(){
      s.init.call(this)
      this.sound+='!!!!!!!!!'
    }
  })
  var VA2 = VeryAngry.make({
    init:function(){
      this.sound = 'hell'
    }
  })
  var Dog = Animal.make({
    init:function(){
      this.sound = 'bark'
    }
  })

  var va = new VA2()
  va.say()

  var sh = new VeryAngry()
  sh.say()

  var sh1 = new Sheep()
  sh1.say()

  var sh2 = new Sheep()
  print(sh2)
  print(sh2.__proto__)
  print(sh2.__proto__.constructor==Sheep.prototype.constructor)
  sh2.say()

  print(Sheep.prototype===VeryAngry.prototype)
  var d = new Dog()
  d.say()
}
// test()
function test2(){
  var Drawable = make((p,s)=>{
    p.init=function(){
      this.visible = true
      // this.colFill = Col4([0,0,0,0.5])
      // this.colStroke = Col4([0,0,0,0.5])
      // this.lineWidth = 1.0
    }
    p.render = function(canvas){
      if(!this.visible)return;

      if(this.colFill){canvas.rgbaFill(this.colFill)}
      if(this.colStroke){canvas.rgbaStroke(this.colStroke)}
      if(this.lineWidth){canvas.lineWidth = this.lineWidth}

      this.draw(canvas)
    }
  })

  var Rectangle = Drawable.make((p,s)=>{
    p.init=function(rect){
      s.init.call(this);
      this.rect = rect

      p.stroke = true
      p.fill = true
    }
    p.strokeFillRoutine = function(canvas){
      if(this.fill)canvas.fill()
      if(this.stroke)canvas.stroke()
    }
    p.draw = function(canvas){
      // canvas.rect(this.rect)
      canvas.rectStroke(this.rect)
      this.strokeFillRoutine(canvas)
    }
  })

  var Circle = Rectangle.make((p,s)=>{
    p.init=function(rect){
      // s.init.call(this);// guanjian
    }
    p.draw = function(canvas){
      var r = this.rect
      canvas.pathBegin()
      canvas.ctx.arc(r.left,r.top, r.width/2, 0, 2*Math.PI, false)

      this.strokeFillRoutine(canvas)
    }
  })

  print(Rectangle.prototype===Circle.prototype)
}
// test2()
