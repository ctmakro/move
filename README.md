# move

Experiments with <s>Canvas2D</s> JS Functional Programming. In this repo you will find implementations of:

- `cond()`: a replacement for switch (essential.js), and an extension to `?`
  ```js
  var cond = function(){
    var arr = arguments
    for(var i=0;i<arr.length;i+=2){
      if(arr[i+1]!==undefined){if(arr[i]){return arr[i+1]}}
      else{return arr[i]}
    }
  }

  print(cond(
    false, value1,
    true, value2,
    value3
  )) // value2
  ```

- class inheritance with **correctly implemented** `super`, without using `class` or `strict` (essential.js):

  ```js
  // to create a new class, pass in a 'populator function'
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
      s.init.call(this,'baa') // call super's init() with parameter sound
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
  ```
  The behavior above is the best I could get without sacrificing too much performance. There are two alternative ways to instantiate a class:
  ```js
  var s = new Sheep() // original
  var s = Sheep.new()
  var s = Sheep()
  ```
  I commented them out, as they degrade performance when frequently called.

- Vector and Matrix classes (move.js) implemented with heavy FP:

  ```js
  // implementation
  // ...
  var op2 = (mf,rf,base)=>function(m){
    if(isNumber(m)){
      var res = map2num(this.arr,m,mf)
    }else{
      var res = map2(this.arr,m.arr,mf)
    }
    return rf?res.reduce(rf,base||0):this.new(res);
  }

  var op1 = (mf,rf,base)=>function(){
    var a = mf?this.arr.map(mf):this.arr
    return rf?a.reduce(rf,base||0):this.new(a)
  }

  p.mul = op2((x,y)=>x*y)
  p.add = op2((x,y)=>x+y)
  p.sub = op2((x,y)=>x-y)
  p.div = op2((x,y)=>x/y)
  // ...

  // usage
  // ...
  function mattest(){
    var m1 = new Mat33(ones(9))
    var v1 = new Vec([1,2,3])

    var list = [
      m1.sum() == 9,
      m1.square_sum() == 9,
      m1.add(m1).sum() == 18,
      m1.add(1).sum() == 18,
      m1.mul(m1).sum() == 9,
      m1.mul(2).sum() == 18,
      m1.div(2).sum() == 4.5,
      m1.sub(1).sum() == 0,
      m1.inv().sum() == 9,
      m1.matmul(v1).sum() == m1.mul(2).matmul(v1.mul(.5)).sum(),
      m1.eq(m1).sum() == 9,
      v1.neg().sum() == - v1.sum(),
      m1.copy().eq_all(m1),

      Matrix.eye(3).sum()==3,
    ]
    print('test',list)
  };mattest();
  ```

- A half-complete 2D graphic manipulation engine (index.html):

  - Go see for yourself :)
