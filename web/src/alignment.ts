import type {Part, V3} from './model';

export type Axis = 0 | 1 | 2;
export type Anchor = 0 | 1 | 2;
export type AlignmentBox = {id: string; bounds: [V3, V3]; locked: boolean};
export type AlignmentChoice = {axis: Axis; anchor: Anchor; distribute?: boolean};
export type AlignmentFrame = {origin: V3; rotation: V3};
export const alignmentTolerance = 0.00001;

export function alignmentExtent(boxes: AlignmentBox[], reference?: string): [V3, V3] | null {
 const targets = reference ? boxes.filter(box => box.id === reference) : boxes;
 if (!targets.length) return null;
 return [
  [0, 1, 2].map(axis => Math.min(...targets.map(box => box.bounds[0][axis]))) as V3,
  [0, 1, 2].map(axis => Math.max(...targets.map(box => box.bounds[1][axis]))) as V3,
 ];
}

export function alignmentMoves(boxes: AlignmentBox[], choice: AlignmentChoice, reference?: string): Record<string, V3> {
 const extent = alignmentExtent(boxes, reference);
 if (boxes.length < 2 || !extent || choice.distribute && boxes.length < 3) return {};
 const {axis, anchor} = choice;
 const coordinate = (box: AlignmentBox) => anchor === 0 ? box.bounds[0][axis] :
  anchor === 2 ? box.bounds[1][axis] : (box.bounds[0][axis] + box.bounds[1][axis]) / 2;
 const target = anchor === 0 ? extent[0][axis] :
  anchor === 2 ? extent[1][axis] : (extent[0][axis] + extent[1][axis]) / 2;
 const sorted = [...boxes].sort((a, b) => coordinate(a) - coordinate(b));
 const first = coordinate(sorted[0]);
 const step = (coordinate(sorted.at(-1)!) - first) / (sorted.length - 1);
 const moves: Record<string, V3> = {};
 for (const [index, box] of sorted.entries()) {
  if (box.locked || box.id === reference) continue;
  const delta = (choice.distribute ? first + step * index : target) - coordinate(box);
  if (Math.abs(delta) <= alignmentTolerance) continue;
  const move: V3 = [0, 0, 0];
  move[axis] = delta;
  moves[box.id] = move;
 }
 return moves;
}

export function alignmentBoxes(objects: Part[], meshes: {id: string; alignmentBounds?: [V3, V3]}[]): AlignmentBox[] {
 return objects.filter(object => object.visible).flatMap(object => {
  const bounds = meshes.find(mesh => mesh.id === object.id)?.alignmentBounds;
  if (!bounds || bounds.some(point => point.length !== 3 || point.some(n => !Number.isFinite(n)))) return [];
  return [{id: object.id, bounds, locked: object.locked}];
 });
}
