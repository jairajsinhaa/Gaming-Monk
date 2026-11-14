-- Gaming Monk tournament, player, wallet-ledger and audit foundation.
-- All currency amounts are stored as integer paise to avoid floating-point errors.
-- Wallet records are demo ledger data only; this migration does not connect a payment provider.

CREATE TYPE "TournamentMode" AS ENUM ('SOLO', 'DUO', 'SQUAD');
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "EntryStatus" AS ENUM ('JOINED', 'CONFIRMED', 'ELIMINATED', 'DISQUALIFIED', 'CANCELLED');
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT', 'PRIZE', 'REFUND', 'ADJUSTMENT');
CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REVERSED');

CREATE TABLE "tournaments" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "mode" "TournamentMode" NOT NULL,
  "status" "TournamentStatus" NOT NULL DEFAULT 'DRAFT',
  "map" TEXT NOT NULL DEFAULT 'Erangel',
  "entry_fee_paise" INTEGER NOT NULL DEFAULT 0,
  "prize_pool_paise" INTEGER NOT NULL DEFAULT 0,
  "max_teams" INTEGER NOT NULL,
  "starts_at" TIMESTAMP(3),
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tournament_entries" (
  "id" TEXT NOT NULL,
  "tournament_id" TEXT NOT NULL,
  "captain_id" TEXT NOT NULL,
  "team_name" TEXT,
  "status" "EntryStatus" NOT NULL DEFAULT 'JOINED',
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tournament_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tournament_entry_members" (
  "id" TEXT NOT NULL,
  "entry_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tournament_entry_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "game_matches" (
  "id" TEXT NOT NULL,
  "tournament_id" TEXT NOT NULL,
  "round" INTEGER NOT NULL DEFAULT 1,
  "match_number" INTEGER NOT NULL DEFAULT 1,
  "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
  "room_id" TEXT,
  "room_password" TEXT,
  "starts_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "game_matches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tournament_results" (
  "id" TEXT NOT NULL,
  "entry_id" TEXT NOT NULL,
  "match_id" TEXT,
  "rank" INTEGER NOT NULL,
  "kills" INTEGER NOT NULL DEFAULT 0,
  "points" INTEGER NOT NULL DEFAULT 0,
  "prize_paise" INTEGER NOT NULL DEFAULT 0,
  "declared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tournament_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallet_accounts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "balance_paise" INTEGER NOT NULL DEFAULT 0,
  "winning_balance_paise" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "wallet_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallet_transactions" (
  "id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "type" "WalletTransactionType" NOT NULL,
  "status" "WalletTransactionStatus" NOT NULL DEFAULT 'PENDING',
  "amount_paise" INTEGER NOT NULL,
  "description" TEXT,
  "reference" TEXT,
  "idempotency_key" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "player_stats" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "played_matches" INTEGER NOT NULL DEFAULT 0,
  "total_wins" INTEGER NOT NULL DEFAULT 0,
  "total_earnings_paise" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "player_stats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "actor_id" TEXT,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tournament_entries_tournament_id_captain_id_key" ON "tournament_entries"("tournament_id", "captain_id");
CREATE INDEX "tournaments_status_starts_at_idx" ON "tournaments"("status", "starts_at");
CREATE INDEX "tournaments_created_by_id_idx" ON "tournaments"("created_by_id");
CREATE INDEX "tournament_entries_tournament_id_status_idx" ON "tournament_entries"("tournament_id", "status");
CREATE INDEX "tournament_entries_captain_id_idx" ON "tournament_entries"("captain_id");
CREATE UNIQUE INDEX "tournament_entry_members_entry_id_user_id_key" ON "tournament_entry_members"("entry_id", "user_id");
CREATE INDEX "tournament_entry_members_user_id_idx" ON "tournament_entry_members"("user_id");
CREATE UNIQUE INDEX "game_matches_tournament_id_round_match_number_key" ON "game_matches"("tournament_id", "round", "match_number");
CREATE INDEX "game_matches_tournament_id_status_idx" ON "game_matches"("tournament_id", "status");
CREATE UNIQUE INDEX "tournament_results_entry_id_key" ON "tournament_results"("entry_id");
CREATE INDEX "tournament_results_match_id_idx" ON "tournament_results"("match_id");
CREATE UNIQUE INDEX "wallet_accounts_user_id_key" ON "wallet_accounts"("user_id");
CREATE UNIQUE INDEX "wallet_transactions_idempotency_key_key" ON "wallet_transactions"("idempotency_key");
CREATE INDEX "wallet_transactions_account_id_created_at_idx" ON "wallet_transactions"("account_id", "created_at");
CREATE INDEX "wallet_transactions_status_created_at_idx" ON "wallet_transactions"("status", "created_at");
CREATE UNIQUE INDEX "player_stats_user_id_key" ON "player_stats"("user_id");
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_captain_id_fkey" FOREIGN KEY ("captain_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tournament_entry_members" ADD CONSTRAINT "tournament_entry_members_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "tournament_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tournament_entry_members" ADD CONSTRAINT "tournament_entry_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "game_matches" ADD CONSTRAINT "game_matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tournament_results" ADD CONSTRAINT "tournament_results_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "tournament_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tournament_results" ADD CONSTRAINT "tournament_results_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "game_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "wallet_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
