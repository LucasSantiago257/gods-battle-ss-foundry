// Minimal document contract, not the Foundry core.
export function rangeScene(actor,targetActor) {
 const tokens=new Map(),scene={id:"range",uuid:"Scene.range",tokens,testUserPermission:()=>true};
 scene.grid={type:1,size:100,distance:1.5,units:"m",diagonals:0,measurePath:points=>({distance:Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y)/100*scene.grid.distance})};
 const token=(id,owner,x)=>({id,uuid:`Scene.range.Token.${id}`,parent:scene,actor:owner,x,y:0,width:1,height:1,elevation:0,hidden:false,testUserPermission:()=>true,getCenterPoint(){return {x:this.x+this.width*50,y:this.y+this.height*50};}});
 const source=token("source",actor,0),target=token("target",targetActor,400);tokens.set(source.id,source);tokens.set(target.id,target);
 return {source,target,scene};
}
