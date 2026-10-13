# Maintenance guide

Routine scheduled ingestion is designed to recover without daily intervention.
A source outage retains its last accepted records, records source health, and
never publishes an empty or schema-invalid replacement. Record count is useful
diagnostic context; recovery, provenance, and valid structure are the health
criteria.

## Content and recommendation configuration

- Add an RSS or Atom source in `config/content-sources.json` only after verifying
  that it is official, permitted, HTTPS, and supplies stable original links and
  timestamps. Set conservative per-source and final dataset bounds. Add a parser
  fixture and outage-recovery test before publishing it.
- Add paper search terms in `keywords` or `huggingFaceQueries` in
  `config/ingestion.json`. Keep requests bounded and review the resulting topics
  and provenance before committing the dataset.
- Topic matching rules live in `TOPIC_RULES` in
  `ingestion/scholar_harbor_ingest/pipeline.py`. Recommendation feature weights
  and the Focused/Explore ratio live in `src/domain/recommendation.ts`; change
  them with deterministic ordering, quota, and explanation tests.

## Operations

Run **Actions → Ingest public research data → Run workflow** on the `main`
branch to trigger ingestion. A successful changed run commits only validated
public artifacts to `main`; that commit triggers the sole Cloudflare Workers
Build. An unchanged run exits without a commit. Runs dispatched from another
branch validate and build artifacts but cannot publish to `main`.

For a failed run, open the failed job and identify its structured `source` and
`error_type`. Check provider availability and schema/parser errors first. Do not
delete the committed datasets or fill missing records manually. The next healthy
scheduled run recovers automatically. Change an adapter only for a confirmed
provider contract change.

Cloudflare rebuilds from Git on every accepted `main` change. To retry a frontend
deployment without changing source, use **Workers & Pages → scholar-harbor →
Deployments → Retry deployment**. Local packaging is `npm run deploy:dry-run`.
Direct `npm run deploy` requires authenticated Wrangler and is reserved for
diagnosis; Git integration remains the production mechanism.

## Personal data restore

Open Settings, choose **Import personal data**, and select a Scholar Harbor JSON
export. Import validates the versioned envelope before replacing browser-local
state. Keep exports private: bookmarks, statuses, tags, and research interests
never belong in the repository or public datasets.
