import type { FastifyInstance } from 'fastify';
import { pool } from '../db.js';

export type Season = {
  id: number;
  name: string;
  created_by: string | null;
  created_at: string;
};

export type SeasonCalculation = {
  id: number;
  season_id: number;
  player_registration_fee: number;
  referee_match_fee: number;
  referee_match_count: number;
  selected_players_count: number;
  registration_cost: number;
  referee_cost: number;
  total_season_cost: number;
  player_contribution: number;
  is_locked: boolean;
  created_at: string;
};

export type SeasonCalculationPlayer = {
  id: number;
  season_calculation_id: number;
  player_id: number | null;
  player_name_snapshot: string;
};

type SeasonListItem = Season & {
  player_contribution: number | null;
  selected_players_count: number | null;
};

type CreateSeasonBody = { name?: unknown };

type CreateCalculationBody = {
  player_ids?: unknown;
  player_registration_fee?: unknown;
  referee_match_fee?: unknown;
  referee_match_count?: unknown;
};

// Parses a whole non-negative amount (CZK) or count. Accepts the numeric
// strings a form sends; rejects blanks, decimals and negatives — same spirit
// as the jersey_number parsing in routes/players.ts.
function wholeNonNegative(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

/**
 * Season fee calculation routes. See docs/specs/season-fee-calculation.md —
 * gated by the same manager auth guard as the player roster (ADR 0003).
 *
 * A confirmed calculation is immutable by construction: there is no PATCH
 * endpoint, and POST refuses a season that already has one. Fixing a mistake
 * means DELETE + POST again.
 */
export async function seasonsRoute(app: FastifyInstance) {
  app.get('/api/seasons', { preHandler: app.authenticate }, async (_request, reply) => {
    const { rows } = await pool.query<SeasonListItem>(
      `SELECT s.*, c.player_contribution, c.selected_players_count
         FROM seasons s
         LEFT JOIN season_calculations c ON c.season_id = s.id
        ORDER BY s.created_at DESC, s.id DESC`,
    );
    return reply.send({ seasons: rows });
  });

  app.post('/api/seasons', { preHandler: app.authenticate }, async (request, reply) => {
    const body = request.body as CreateSeasonBody;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length === 0) {
      return reply.status(400).send({ error: 'name is required' });
    }

    const { rows } = await pool.query<Season>(
      'INSERT INTO seasons (name, created_by) VALUES ($1, $2) RETURNING *',
      [name, request.user.email],
    );
    return reply.status(201).send(rows[0]);
  });

  app.get<{ Params: { id: string } }>(
    '/api/seasons/:id',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const id = Number(request.params.id);
      if (!Number.isInteger(id)) {
        return reply.status(400).send({ error: 'invalid season id' });
      }

      const { rows: seasons } = await pool.query<Season>('SELECT * FROM seasons WHERE id = $1', [id]);
      const season = seasons[0];
      if (!season) {
        return reply.status(404).send({ error: 'season not found' });
      }

      const { rows: calculations } = await pool.query<SeasonCalculation>(
        'SELECT * FROM season_calculations WHERE season_id = $1',
        [id],
      );
      const calculation = calculations[0] ?? null;

      const { rows: players } = calculation
        ? await pool.query<SeasonCalculationPlayer>(
            `SELECT * FROM season_calculation_players
              WHERE season_calculation_id = $1
              ORDER BY player_name_snapshot`,
            [calculation.id],
          )
        : { rows: [] as SeasonCalculationPlayer[] };

      // Lets the detail page show "receivables already generated" without a
      // second request (and without guessing from the receivables list).
      const { rows: receivableCounts } = await pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM receivables
          WHERE source_type = 'season' AND source_id = $1`,
        [id],
      );

      return reply.send({
        season,
        calculation,
        players,
        receivables_count: Number(receivableCounts[0].count),
      });
    },
  );

  app.post<{ Params: { id: string } }>(
    '/api/seasons/:id/calculation',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const seasonId = Number(request.params.id);
      if (!Number.isInteger(seasonId)) {
        return reply.status(400).send({ error: 'invalid season id' });
      }

      const body = request.body as CreateCalculationBody;

      if (!Array.isArray(body.player_ids) || body.player_ids.some((id) => !Number.isInteger(id))) {
        return reply.status(400).send({ error: 'player_ids must be an array of player ids' });
      }
      const playerIds = [...new Set(body.player_ids as number[])];
      if (playerIds.length === 0) {
        return reply.status(400).send({ error: 'at least one player must be selected' });
      }

      const playerRegistrationFee = wholeNonNegative(body.player_registration_fee);
      const refereeMatchFee = wholeNonNegative(body.referee_match_fee);
      const refereeMatchCount = wholeNonNegative(body.referee_match_count);
      if (playerRegistrationFee === null || refereeMatchFee === null || refereeMatchCount === null) {
        return reply.status(400).send({
          error:
            'player_registration_fee, referee_match_fee and referee_match_count are required whole non-negative numbers',
        });
      }

      const { rows: seasons } = await pool.query<{ id: number }>(
        'SELECT id FROM seasons WHERE id = $1',
        [seasonId],
      );
      if (seasons.length === 0) {
        return reply.status(404).send({ error: 'season not found' });
      }

      const { rows: existing } = await pool.query<{ id: number }>(
        'SELECT id FROM season_calculations WHERE season_id = $1',
        [seasonId],
      );
      if (existing.length > 0) {
        return reply.status(409).send({
          error: 'this season already has a locked calculation — delete it before creating a new one',
        });
      }

      // Names are snapshotted from the roster server-side, never taken from
      // the request body.
      const { rows: players } = await pool.query<{ id: number; first_name: string; last_name: string }>(
        'SELECT id, first_name, last_name FROM players WHERE id = ANY($1::int[])',
        [playerIds],
      );
      if (players.length !== playerIds.length) {
        return reply.status(400).send({ error: 'player_ids contains an unknown player' });
      }

      // Every derived amount is recomputed here from the raw inputs — the
      // frontend's preview numbers are never trusted.
      const selectedPlayersCount = playerIds.length;
      const registrationCost = selectedPlayersCount * playerRegistrationFee;
      const refereeCost = refereeMatchFee * refereeMatchCount;
      const totalSeasonCost = registrationCost + refereeCost;
      // Rounded up so the team account can never come up short; the surplus
      // stays with the team (see the brief).
      const playerContribution = Math.ceil(totalSeasonCost / selectedPlayersCount);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const { rows: created } = await client.query<SeasonCalculation>(
          `INSERT INTO season_calculations (
             season_id, player_registration_fee, referee_match_fee, referee_match_count,
             selected_players_count, registration_cost, referee_cost, total_season_cost,
             player_contribution, is_locked
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
           RETURNING *`,
          [
            seasonId,
            playerRegistrationFee,
            refereeMatchFee,
            refereeMatchCount,
            selectedPlayersCount,
            registrationCost,
            refereeCost,
            totalSeasonCost,
            playerContribution,
          ],
        );
        const calculation = created[0];

        const { rows: snapshot } = await client.query<SeasonCalculationPlayer>(
          `INSERT INTO season_calculation_players (season_calculation_id, player_id, player_name_snapshot)
           SELECT $1, p.id, p.name
             FROM UNNEST($2::int[], $3::text[]) AS p(id, name)
           RETURNING *`,
          [
            calculation.id,
            players.map((player) => player.id),
            players.map((player) => `${player.first_name} ${player.last_name}`),
          ],
        );

        await client.query('COMMIT');
        return reply.status(201).send({ calculation, players: snapshot });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/seasons/:id/calculation',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const seasonId = Number(request.params.id);
      if (!Number.isInteger(seasonId)) {
        return reply.status(400).send({ error: 'invalid season id' });
      }

      // Receivables generated from this season point back at it by
      // source_id, and they may already carry recorded payments — dropping
      // the calculation under them would leave real debts explaining
      // themselves with a number nobody can look up any more.
      const { rows: receivables } = await pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM receivables
          WHERE source_type = 'season' AND source_id = $1`,
        [seasonId],
      );
      if (Number(receivables[0].count) > 0) {
        return reply.status(409).send({
          error:
            'receivables have already been generated for this season — remove them before deleting the calculation',
        });
      }

      // The snapshot rows go with it via ON DELETE CASCADE — deleting is the
      // only supported way to correct a confirmed calculation.
      const { rowCount } = await pool.query('DELETE FROM season_calculations WHERE season_id = $1', [
        seasonId,
      ]);
      if (rowCount === 0) {
        return reply.status(404).send({ error: 'no calculation for this season' });
      }
      return reply.status(204).send();
    },
  );

  // Turns a locked calculation into money actually owed: one receivable per
  // snapshotted player, for the contribution that was frozen at confirmation
  // time (see docs/specs/receivables.md, AC2). Deliberately a separate,
  // manager-triggered step rather than a side effect of confirming — the
  // manager picks the due date here, and a calculation is useful on its own.
  app.post<{ Params: { id: string } }>(
    '/api/seasons/:id/receivables',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const seasonId = Number(request.params.id);
      if (!Number.isInteger(seasonId)) {
        return reply.status(400).send({ error: 'invalid season id' });
      }

      const body = request.body as { due_date?: unknown };
      let dueDate: string | null = null;
      if (typeof body.due_date === 'string' && body.due_date.trim().length > 0) {
        const trimmed = body.due_date.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          return reply.status(400).send({ error: 'due_date must be in YYYY-MM-DD format' });
        }
        dueDate = trimmed;
      }

      const { rows: seasons } = await pool.query<Season>('SELECT * FROM seasons WHERE id = $1', [
        seasonId,
      ]);
      const season = seasons[0];
      if (!season) {
        return reply.status(404).send({ error: 'season not found' });
      }

      const { rows: calculations } = await pool.query<SeasonCalculation>(
        'SELECT * FROM season_calculations WHERE season_id = $1',
        [seasonId],
      );
      const calculation = calculations[0];
      if (!calculation) {
        return reply.status(409).send({
          error: 'this season has no confirmed calculation yet',
        });
      }

      // Only players still on the roster get a receivable: receivables.player_id
      // is a real foreign key (unlike the name-only snapshot), so someone who
      // has since left simply has no live debt to create.
      const { rows: snapshot } = await pool.query<{ player_id: number | null }>(
        `SELECT scp.player_id
           FROM season_calculation_players scp
           JOIN players p ON p.id = scp.player_id
          WHERE scp.season_calculation_id = $1`,
        [calculation.id],
      );
      const playerIds = snapshot
        .map((row) => row.player_id)
        .filter((id): id is number => id !== null);
      if (playerIds.length === 0) {
        return reply.status(409).send({
          error: "none of this calculation's players are on the roster any more",
        });
      }

      // ON CONFLICT DO NOTHING against the partial unique index in
      // 0005_receivables.sql makes a re-run a no-op instead of doubling
      // everyone's debt — RETURNING then reports only what was actually new.
      const { rows: created } = await pool.query<{ id: number }>(
        `INSERT INTO receivables (player_id, title, description, amount, due_date, source_type, source_id)
         SELECT id, $2, $3, $4, $5, 'season', $6
           FROM UNNEST($1::int[]) AS s(id)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          playerIds,
          `Sezónní příspěvek — ${season.name}`,
          `Příspěvek na sezónu ${season.name} podle uzamčeného výpočtu.`,
          calculation.player_contribution,
          dueDate,
          seasonId,
        ],
      );

      return reply.status(201).send({
        created: created.length,
        skipped: playerIds.length - created.length,
      });
    },
  );
}
