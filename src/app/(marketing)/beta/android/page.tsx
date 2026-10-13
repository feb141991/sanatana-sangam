import { permanentRedirect } from "next/navigation";

/** Legacy campaign URL; /early-access is the canonical destination. */
export default function AndroidBetaAliasPage(): never {
  permanentRedirect("/early-access");
}
