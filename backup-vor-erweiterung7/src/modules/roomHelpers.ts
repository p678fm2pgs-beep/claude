import type { Project, Room, Variant } from '../types';

export function getRoom(project: Project | null, roomId: string | null): Room | undefined {
  if (!project || !roomId) return undefined;
  return project.rooms.find((r) => r.id === roomId);
}

export function getActiveVariant(room: Room | undefined): Variant | undefined {
  if (!room) return undefined;
  return room.variants.find((v) => v.id === room.activeVariantId) ?? room.variants[0];
}

/** Mutiert eine Variante eines Raums innerhalb eines Projekt-Entwurfs. */
export function mutateVariant(
  project: Project,
  roomId: string,
  variantId: string,
  fn: (v: Variant) => void,
): void {
  const room = project.rooms.find((r) => r.id === roomId);
  if (!room) return;
  const variant = room.variants.find((v) => v.id === variantId);
  if (variant) fn(variant);
}

export function mutateRoom(project: Project, roomId: string, fn: (r: Room) => void): void {
  const room = project.rooms.find((r) => r.id === roomId);
  if (room) fn(room);
}
