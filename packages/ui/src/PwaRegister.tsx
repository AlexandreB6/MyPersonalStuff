"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker (`public/sw.js`) après l'hydratation.
 * Sa seule raison d'être est de rendre l'app installable : un service worker
 * avec un handler `fetch` est requis par les navigateurs pour proposer
 * « Ajouter à l'écran d'accueil ». Aucun rendu.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Enregistrement KO (http, navigation privée…) : l'app reste utilisable.
      });
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
