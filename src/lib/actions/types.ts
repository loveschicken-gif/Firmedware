export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export function formError(message: string): ActionResult {
  return { success: false, error: message };
}
