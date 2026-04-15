import { toast } from "sonner";

/**
 * Drop-in remplaçant `fetch` pour les mutations côté client.
 * Comportement identique à fetch() sauf qu'un toast d'erreur s'affiche
 * automatiquement quand la réponse n'est pas ok — le message provient du
 * corps JSON `{ error }` renvoyé par l'API si disponible, sinon un fallback
 * générique selon le statut.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (e) {
    toast.error("Erreur réseau — impossible de contacter le serveur.");
    throw e;
  }

  if (!res.ok) {
    let message = "Une erreur est survenue.";
    try {
      const clone = res.clone();
      const body = (await clone.json()) as { error?: string };
      if (body?.error) message = body.error;
      else if (res.status === 401) message = "Non autorisé — veuillez vous reconnecter.";
      else if (res.status === 403) message = "Action non autorisée.";
      else if (res.status === 404) message = "Élément introuvable.";
    } catch {
      // body not JSON — keep fallback
    }
    toast.error(message);
  }

  return res;
}
