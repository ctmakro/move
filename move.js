var defprop = Object.defineProperty

var getsetmap = list=> p=>{
  function gsm(name,index){
    defprop(p,name,{get(){return this.arr[index]},set(x){this.arr[index]=x}})
  }
  for(key in list){gsm(list[key],Number(key))}
}

var VectorGetSet = getsetmap(['x','y','z','w'])
var ColorGetSet = getsetmap(['r','g','b','a'])
var RectGetSet = getsetmap(['left','top','width','height'])
var MatSizeGetSet = getsetmap(['rows','cols'])

var range = x=>{var a=[];for(var i=0;i<x;i++)a.push(i);return a}
var zeros = Array.prototype.fill?i=>Array(i).fill(0):i=>range(i).map(x=>0)
var ones = Array.prototype.fill?i=>Array(i).fill(1):i=>range(i).map(x=>1)

var isNumber = x=>(typeof x==='number')?true:false
var map2 = (x,y,f)=>range(Math.min(x.length,y.length)).map(i=>f(x[i],y[i]))
var map2num = (x,y,f)=>range(x.length).map(i=>f(x[i],y))

var VectorEssentials = make(p=>{
  p.toString = function(){
    return `[size:[${this.size.toString()}] content:[${this.arr}]]`
  }

  p.magnitude = thisf(t=>Math.sqrt(t.square_sum()))
  p.normalized = thisf(t=>t.div(t.magnitude()))
  p.elem = thisf((t,ind)=>t.arr[ind])
  p.reversed = thisf(t=>{var c = t.copy();c.arr.reverse();return c})

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

  p.eq_all = op2((x,y)=>x==y,(a,b)=>a&&b,true)

  p.eq = op2((x,y)=>x==y?1:0)
  p.gt = op2((x,y)=>x>y?1:0)
  p.lt = op2((x,y)=>x<y?1:0)
  p.gte = op2((x,y)=>x>=y?1:0)
  p.lte = op2((x,y)=>x<=y?1:0)

  p.inv = op1(x=>1/x)
  p.neg = op1(x=>-x)

  p.prod = op1(null,(a,b)=>a*b,1)

  p.sum = op1(null,(a,b)=>a+b)
  p.square_sum = op1(x=>x*x,(a,b)=>a+b)
  p.mean = thisf(t=>t.sum()/t.get_size())

  p.length = p.magnitude
})

var Vec = VectorEssentials.make(p=>{
  p.init = function(arr){
    this.arr=arr; this.size=this.arr.length
  }
  p.new = function(arr){
    return new Vec(arr)
  }
  p.copy = thisf(t=>t.new(t.arr.slice()))

}).make(VectorGetSet).make(ColorGetSet).make(RectGetSet).make(MatSizeGetSet)

// var argfilt = (n,arr)=>{if(arr.length!==n)throw 'bad array length';return arr}
// var vecnbase = n=>Vec.make({init(arr){
//   this.arr=argfilt(n,arr);this.size = this.arr.length
// }})
// var vecnbase = n=>Vec.make(p=>{
//   p.init = function(arr){
//     this.arr=argfilt(n,arr);this.size = this.arr.length;
//   }
// })
var vecnbase = n=>Vec.make(p=>{
  p.init = function(arr){
    this.arr=arr;this.size = this.arr.length;
  }
})

var Vec2Base = vecnbase(2)
var Vec3Base = vecnbase(3)
var Vec4Base = vecnbase(4)

// var Vec2 = Vec2Base.make(VectorGetSet)
// var Vec3 = Vec3Base.make(VectorGetSet)
// var Vec4 = Vec4Base.make(VectorGetSet)
//
// var Col3 = Vec3Base.make(ColorGetSet)
// var Col4 = Vec4Base.make(ColorGetSet)
//
// var Rect = Vec4Base.make(RectGetSet)
// var MatSize = Vec2Base.make(MatSizeGetSet)
var Vec2=Vec2Base,Vec3=Vec3Base,Vec4=Vec4Base
var Col3=Vec3Base,Col4=Vec4Base,Rect=Vec4Base,MatSize=Vec2Base

var Matrix = VectorEssentials.make(p=>{
  p.init = function(arr,size){
    // assert(size.prod()===arr.length,'matrix size incorrect')
    this.arr=arr,
    this.size=size
  }
  p.new = function(arr){
    return new Matrix(arr,this.size)
  }
  p.copy = thisf(t=>t.new(t.arr.slice()))


  p._addr = thisf((t,row,col)=>row*t.size.cols+col)
  p.elem = thisf((t,row,col)=>t.arr[t._addr(row,col)])
  p.set_elem = thisf((t,row,col,v)=>{t.arr[t._addr(row,col)]=v})
  p._matmul33 = function(lhs,rhs,targ){
    var l=lhs.arr,r=rhs.arr,t=targ.arr
    t[0] = l[0]*r[0] +l[1]*r[3] +l[2]*r[6]
    t[1] = l[0]*r[1] +l[1]*r[4] +l[2]*r[7]
    t[2] = l[0]*r[2] +l[1]*r[5] +l[2]*r[8]

    t[3] = l[3]*r[0] +l[4]*r[3] +l[5]*r[6]
    t[4] = l[3]*r[1] +l[4]*r[4] +l[5]*r[7]
    t[5] = l[3]*r[2] +l[4]*r[5] +l[5]*r[8]

    t[6] = l[6]*r[0] +l[7]*r[3] +l[8]*r[6]
    t[7] = l[6]*r[1] +l[7]*r[4] +l[8]*r[7]
    t[8] = l[6]*r[2] +l[7]*r[5] +l[8]*r[8]
  }
  p.matmul33 = function(rhs){
    // this.__res = this.__res || new Matrix(ones(9),new MatSize([3,3]))
    var m = new Matrix(ones(9),new MatSize([3,3]))
    this._matmul33(this,rhs,m)
    return m
  }
  p._matmul = function (rhs){
    // matrix-matrix multiplication
    var lhs = this
    assert(lhs.size.cols===rhs.size.rows,'left mat cols should == right mat rows')
    var newsize = new MatSize([lhs.size.rows,rhs.size.cols])
    var res = new Matrix(zeros(newsize.prod()),newsize)

    // range(newsize.rows).map(row=>
    //   range(newsize.cols).map(col=>
    //     res.set_elem(row,col,
    //       range(lhs.size.cols).map(lcol=>
    //         lhs.elem(row,lcol)*rhs.elem(lcol,col)
    //       ).reduce((a,b)=>a+b,0)
    //     )
    //   )
    // )
    var lhsa = lhs.arr
    var rhsa = rhs.arr
    var resa = res.arr

    var nsr = newsize.rows, nsc = newsize.cols, lsc = lhs.size.cols
    var rsc = rhs.size.cols


    for(var row=0;row<nsr;row++){
      for(var col=0;col<nsc;col++){
        var sum = 0
        for(var lcol=0;lcol<lsc;lcol++){
          // sum += lhs.elem(row,lcol)*rhs.elem(lcol,col)
          sum += lhsa[row*lsc+lcol] * rhsa[lcol*rsc+col]
        }
        // res.set_elem(row,col,sum)
        resa[row*nsr+col] = sum
      }
    }

    //

    // // optimization needed
    // for(var row=0;row<nsr;row++){
    //   for(var col=0;col<nsc;col++){
    //     var sum = 0
    //     // for(var lcol=0;lcol<lhs.size.cols;lcol++){
    //     //   sum += lhsa[row*lhs.size.cols+lcol] * rhsa[lcol*rhs.size.cols+col]
    //     // }
    //     for(var lcol=0,rlhs=0,lrhs=0;lcol<lsc;lcol++,rlhs+=lsc,lrhs+=rsc){
    //       sum += lhsa[rlhs+lcol] * rhsa[lrhs+col]
    //     }
    //     resa[row*res.size.cols+col] = sum
    //   }
    // }

    return res
  }

  p.matmul = thisf((t,v)=>(
    typeof v.size==='number')?
    new Vec(t._matmul(new Matrix(v.arr,new MatSize([v.size,1]))).arr):
    t._matmul(v)
  )
})

Matrix.eye = d=> new Matrix(
  range(d)
  .map( row=>range(d).map(col=>row==col?1:0) )
  .reduce((a,b)=>a.concat(b)),
  new MatSize([d,d])
)

var matmaker = (r,c)=> Matrix.make((p,s)=>{
  p.init = function(arr){
    s.init.call(this,arr,new MatSize([r,c]))
  }
})

var Mat33 = matmaker(3,3)
var Mat22 = matmaker(2,2)
var Mat23 = matmaker(2,3);

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

var Canvas = make(p=>{
  p.init=function(v2){
    var c = ce('canvas')
    this.canvas = c
    this.size = v2

    document.body.appendChild(c)
    var ctx = c.getContext('2d');

    this.ctx = ctx
  }
  p.clear = function(){
    this.ctx.setTransform(1,0,0,1,0,0)
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)
  }

  defprop(p,'size',{
    get(){return new Vec2([this.canvas.width,this.canvas.height])},
    set(v2){this.canvas.width=v2.x;this.canvas.height=v2.y}
  })

  var rgba_gen = (name)=>function(c){this.ctx[name] = `rgba(${c.r},${c.g},${c.b},${c.a})`}

  p.rgbaFill=rgba_gen('fillStyle',true)
  // p.rgbFill =rgba_gen('fillStyle',false)
  p.rgbaStroke = rgba_gen('strokeStyle',true)
  // p.rgbStroke = rgba_gen('strokeStyle',false)

  var rect_gen = name=>function(r){
    this.ctx[name](r.left,r.top,r.width,r.height)
  }

  p.rectFill = rect_gen('fillRect')
  p.rectClear= rect_gen('clearRect')
  p.rectStroke = rect_gen('strokeRect')
  p.rect = rect_gen('rect')

  var gst = (to,from,shouldcall)=>{
    from = from||to
    if(shouldcall){
      defprop(p,to,{
        get(){return this.ctx[from]()},
        set(x){this.ctx[shouldcall](x)}
      })
    }else{
      defprop(p,to,{
        get(){return this.ctx[from]},
        set(x){this.ctx[from]=x}
      })
    }
  }
  gst('lineDash','getLineDash','setLineDash')
  gst('lineWidth')
  gst('lineCap','lineCap')

  p.stroke = function(){this.ctx.stroke()}
  p.fill = function(){this.ctx.fill()}
  p.clip = function(){this.ctx.clip()}
  p.pathBegin = function(){this.ctx.beginPath()}
  p.pathClose = function(){this.ctx.closePath()}

  var v2_gen = name => {
    p[name] = function(v2){
      this.ctx[name](v2.x,v2.y)
    }
  }
  v2_gen('moveTo')
  v2_gen('lineTo')
  v2_gen('isPointInStroke')

  // var chop_for_canvas = function(mat){
  //   var ta = mat.arr
  //   return [ta[0],ta[3],ta[1],ta[4],ta[2],ta[5]]
  // }
  p.transformSet = function(m33){
    var a = m33.arr
    // this.ctx.setTransform.apply(this.ctx,chop_for_canvas(m33))
    this.ctx.setTransform(a[0],a[3],a[1],a[4],a[2],a[5])
  }
})

var Transform = make(p=>{
  p.init=function(v2p,v2s,v2r){
    this.parent = null

    this.position = v2p||new Vec2([0,0])
    this.scale = v2s||new Vec2([1,1])
    this.rotation = v2r||new Vec2([0,0])

    this.children = [] // children transforms
    this.object = null // objects attached

    // this.updateTransformMatrix()
  }
  p.updateTransformMatrix = function(){
    var selfmatrix = this.getSelfTransformMatrix()
    if(this.parent!==null){
      this.matrix = this.parent.getTransformMatrix().matmul33(selfmatrix)
    }else{
      this.matrix = selfmatrix
    }
    this.children.map(c=>c.updateTransformMatrix())
  }
  p.getSelfTransformMatrix = function(){
    var t = this.rotation.x / 180 * Math.PI
    // var scale = new Mat33([
    //   this.scale.x,0,0,
    //   0, this.scale.y,0,
    //   0, 0, 1
    // ])
    // var rotation = new Mat33([
    //   Math.cos(t), -Math.sin(t),0,
    //   Math.sin(t), Math.cos(t),0,
    //   0,0,1
    // ])
    // var translation = new Mat33([
    //   1, 0, this.position.x,
    //   0, 1, this.position.y,
    //   0, 0, 1
    // ])

    var sx=this.scale.x,sy=this.scale.y,px=this.position.x,py=this.position.y
    var ct=Math.cos(t),st=Math.sin(t)

    this.__matrix = this.__matrix || (Matrix.eye(3))

    // thanks to SymPy!
    this.__matrix.arr = [
      sx*ct, -sy*st, px,
      sx*st, sy*ct, py,
      0, 0, 1
    ]
    return this.__matrix
    // return translation.matmul(rotation).matmul(scale)
  }

  p.getTransformMatrix = thisf(t=>t.matrix)

  p.attachObject = function(obj){
    this.object = obj
    obj.transform = this
    return obj
  }

  p.attachObjectAsChildren = function(obj){
    var tr = new Transform(new Vec2([0,0]))
    tr.attachObject(obj)
    this.attachChildren(tr)
    return tr
  }

  // add transform object as children
  p.attachChildren = function(tr){
    this.children.push(tr)
    tr.parent = this
    return tr
  }

  p.render = function(canvas){
    // set transform
    if(this.object!==null){
      canvas.transformSet(this.getTransformMatrix())
      this.object.render(canvas);
    }

    for(var i=0;i<this.children.length;i++){
      this.children[i].render(canvas)
    }
    // this.children.map(c=>{
    //   c.render(canvas)
    // })
  }

  p.copyWithChildren = function(){
    var tr = new Transform(this.position.copy(),this.scale.copy(),this.rotation.copy())

    tr.parent = this.parent
    this.parent.attachChildren(tr)

    tr.object = this.object
    tr.children = this.children
    return tr
  }
})

var Drawable = make((p,s)=>{
  p.render = function(canvas){
    if(this.visible===false)return;
    if(this.colFill){canvas.rgbaFill(this.colFill)}
    if(this.colStroke){canvas.rgbaStroke(this.colStroke)}
    if(this.lineWidth){canvas.lineWidth = this.lineWidth}
    this.draw(canvas)
  }
})
var RectParamMixin = (p,s)=>{
  p.init=function(rect){
    this.rect=rect;
  }
}
var Rectangle = Drawable.make(RectParamMixin).make((p,s)=>{
  p.draw = function(canvas){
    if(this.fill!==false)canvas.rectFill(this.rect)
    if(this.stroke!==false)canvas.rectStroke(this.rect)
    // canvas.rect(this.rect)
    // canvas.rectFill(this.rect)
  }
})
var PathFillStrokeMixin = (p,s)=>{
  p.draw = function(canvas){
    this.drawPath(canvas)
    if(this.fill!==false)canvas.fill()
    if(this.stroke!==false)canvas.stroke()
  }
}
var Circle = Drawable
.make(RectParamMixin)
.make((p,s)=>{
  p.draw = function(canvas){
    if(this.fill===false&&this.stroke===false)return;

    var r = this.rect
    // print(this.fill,this.stroke)
    canvas.pathBegin()
    canvas.ctx.arc(r.left, r.top, r.width/2, 0, 2*Math.PI, false)

    if(this.fill!==false)canvas.fill()
    if(this.stroke!==false)canvas.stroke()
  }
})
var PrimitiveList = Drawable
.make((p,s)=>{
  p.draw = function(canvas){
    if(!this.list)return;
    this.list.map(prim=>{prim.draw(canvas)})
  }
})

var PathList = Drawable // objects consist of a lot of paths
.make(PathFillStrokeMixin)
.make((p,s)=>{
  p.drawPath = function(canvas){
    if(!this.list)return;
    this.list.map(path=>{path.drawPath(canvas)})
  }
})

var test = ()=>{
  c.rgbFill(new Col3([200,0,0]))
  c.rectFill(new Rect([10,10,55,50]))
  c.rgbaFill(new Col4([0,0,200,0.5]))
  c.rectFill(new Rect([30,30,55,50]))

  c.rgbaStroke(new Col4([0,0,255,0.5]))

  c.lineDash = [10,15]
  c.lineWidth = 2
  c.rectStroke(Rect([5,10,50,50]))

  c.ctx.beginPath()
  c.ctx.moveTo(0,0)
  c.ctx.lineTo(100,100)
  c.ctx.lineTo(100,200)
  c.ctx.closePath()

  c.ctx.stroke()
}

var c = new Canvas(new Vec2([640,480]))
// test()

var rootTransform = new Transform(c.size.mul(.5)) // center canvas
rootTransform.rotation.x = 10

var blueRectangle = new Rectangle(new Rect([0,0,10,20]))
blueRectangle.colFill = new Col4([0,100,200,0.5])
blueRectangle.colStroke = new Col4([0,0,0,1])
blueRectangle.lineWidth = .5

var rectTrans = rootTransform.attachObjectAsChildren(blueRectangle)

var duplicator = (n,vec)=> trfm => range(n).map(x=>{
  var copy = trfm.copyWithChildren()
  copy.position = copy.position.add(vec.mul(x))
  return copy
})

// copies.map(x=>{print(x.position.toString())})
var d1 = duplicator(12,new Vec2([0,30]))
var d2 = duplicator(10,new Vec2([30,0]))

d1(rectTrans).map(t=>d2(t))
// d1(tr).map(t=>{print(t.position.toString())})

var subRootTrans = rootTransform.attachChildren(new Transform())

// var greenCircle = new Circle(new Rect([0,0,20,10]))
// greenCircle.colFill = new Col4([100,150,50,0.5])

var circleList = new PrimitiveList().setp({
  colFill:new Col4([100,150,0,.5]),
  colStroke:new Col4([255,0,0,1]),
  lineWidth:2,
})

circleList.list = range(20).map( x=>new Circle(new Rect([gaussian(10),x*17,20,10])))
subRootTrans.attachObject(circleList)

// var circTrans = subRootTrans.attachObjectAsChildren(circleList)

var render = ()=>{
  c.clear()
  rootTransform.updateTransformMatrix()
  rootTransform.render(c)

}

var j = 0
setInterval(()=>{
  j++
  subRootTrans.position.y += .1
  subRootTrans.rotation.x += 2

  rootTransform.position.x += .1
  rootTransform.scale.x = Math.sin(j*.1)
  render()
},20)
