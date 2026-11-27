<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Proof IDs come from a SHA-256 of the canonical, QR-sized snapshot (`src/lib/proof.ts`), never from dates or randomness: the same work must always give the same ID so links stay checkable.
- SHA-256 is a synchronous pure-JS implementation: `crypto.subtle` is missing on non-secure origins and async hashing would complicate rendering.
- The verification view is driven by `?proof=…#d=…` on `/` (see `src/lib/proof-route.ts`), not a separate route: the snapshot travels in the URL fragment so it works with no backend.
- Proof snapshots never contain phone numbers, emails or other contact details.
- The QR encodes only the short link `?proof=<ID>`; proofs are published to the Lovable Cloud `proofs` table (`src/lib/proof-cloud.ts`) and fetched by ID, so the code stays simple to scan. Copied/shared links keep the full `#d=` payload as an offline fallback. Integrity is still checked by recomputing the hash, so open inserts are safe.
