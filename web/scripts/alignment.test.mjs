import test from 'node:test';
import assert from 'node:assert/strict';
import {alignmentMoves,alignmentExtent,alignmentBoxes} from '../src/alignment.ts';
import {part} from '../src/model.ts';

const boxes=[
 {id:'a',bounds:[[-40,-20,3],[-10,0,13]],locked:false},
 {id:'b',bounds:[[5,12,20],[15,42,45]],locked:false},
 {id:'c',bounds:[[30,-7,7],[70,4,18]],locked:false},
];
const at=(box,axis,anchor)=>anchor===0?box.bounds[0][axis]:anchor===2?box.bounds[1][axis]:(box.bounds[0][axis]+box.bounds[1][axis])/2;
test('all nine alignments use selection extrema and bounding-box centres',()=>{
 const extent=alignmentExtent(boxes);
 for(const axis of [0,1,2])for(const anchor of [0,1,2]){
  const moves=alignmentMoves(boxes,{axis,anchor});
  const target=anchor===0?extent[0][axis]:anchor===2?extent[1][axis]:(extent[0][axis]+extent[1][axis])/2;
  for(const box of boxes){
   assert.ok(Math.abs(at(box,axis,anchor)+(moves[box.id]?.[axis]??0)-target)<1e-9);
   assert.ok((moves[box.id]??[0,0,0]).every((n,i)=>i===axis||n===0));
  }
 }
});
test('a fixed reference stays still for every alignment and locked shapes never move',()=>{
 for(const axis of [0,1,2])for(const anchor of [0,1,2]){
  const moves=alignmentMoves(boxes,{axis,anchor},'b');
  assert.equal(moves.b,undefined);
  for(const box of boxes)assert.ok(Math.abs(at(box,axis,anchor)+(moves[box.id]?.[axis]??0)-at(boxes[1],axis,anchor))<1e-9);
 }
 const locked=boxes.map(box=>({...box,locked:box.id==='a'}));
 assert.equal(alignmentMoves(locked,{axis:0,anchor:2}).a,undefined);
 assert.deepEqual(alignmentMoves(boxes.slice(0,1),{axis:0,anchor:1}),{});
});
test('distribution preserves endpoint centres and repeated alignment is a no-op',()=>{
 const moves=alignmentMoves(boxes,{axis:0,anchor:1,distribute:true});
 assert.equal(moves.a,undefined);assert.equal(moves.c,undefined);
 assert.equal(at(boxes[1],0,1)+moves.b[0],12.5);
 const aligned=boxes.map(box=>{
  const delta=alignmentMoves(boxes,{axis:2,anchor:0})[box.id]??[0,0,0];
  return {...box,bounds:box.bounds.map(p=>p.map((n,i)=>n+delta[i]))};
 });
 assert.deepEqual(alignmentMoves(aligned,{axis:2,anchor:0}),{});
});
test('hole and locked shapes participate but hidden and missing geometry do not invent bounds',()=>{
 const a=part('hole');a.locked=true;
 const b=part('box');b.visible=false;
 const c=part('box');
 const result=alignmentBoxes([a,b,c],[{id:a.id,alignmentBounds:[[-1,-2,0],[1,2,5]]},{id:b.id,alignmentBounds:[[-4,-4,0],[4,4,10]]}]);
 assert.equal(result.length,1);assert.equal(result[0].id,a.id);assert.equal(result[0].locked,true);
});
