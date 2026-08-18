/**
 * Helpers côté client pour le mode démo.
 * `IS_DEMO` lit la variable d'env publique exposée dans .env.local.
 */

export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/**
 * Un item est "partagé" (catalogue de démo) quand on est en mode démo
 * ET que son `demoSessionId` est null (row seedée).
 */
export function isSharedItem(
  item: { demoSessionId?: string | null } | null | undefined,
): boolean {
  if (!IS_DEMO) return false;
  return item?.demoSessionId == null;
}
