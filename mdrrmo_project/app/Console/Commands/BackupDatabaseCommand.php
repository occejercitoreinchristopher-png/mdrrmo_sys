<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class BackupDatabaseCommand extends Command
{
    protected $signature = 'app:backup-db {--keep=7 : Number of latest backup archives to retain}';
    protected $description = 'Create a compressed database backup archive and prune old backups to preserve storage.';

    public function handle()
    {
        $this->info('Starting database backup...');

        $backupDir = storage_path('app/backups');
        if (! File::isDirectory($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $timestamp = date('Y-m-d_His');
        $gzFilename = "mdrrmo_backup_{$timestamp}.sql.gz";
        $gzPath = "{$backupDir}/{$gzFilename}";

        $dbHost = config('database.connections.mysql.host', '127.0.0.1');
        $dbPort = config('database.connections.mysql.port', '3306');
        $dbName = config('database.connections.mysql.database');
        $dbUser = config('database.connections.mysql.username');
        $dbPass = config('database.connections.mysql.password');

        $success = false;

        // 1. Try mysqldump command first if available
        $mysqldumpPath = $this->findMysqldump();
        if ($mysqldumpPath) {
            $passPart = ! empty($dbPass) ? "-p" . escapeshellarg($dbPass) : "";
            $cmd = sprintf(
                '"%s" -h %s -P %s -u %s %s %s 2>&1',
                $mysqldumpPath,
                escapeshellarg($dbHost),
                escapeshellarg($dbPort),
                escapeshellarg($dbUser),
                $passPart,
                escapeshellarg($dbName)
            );

            $descriptors = [
                0 => ['pipe', 'r'],
                1 => ['pipe', 'w'],
                2 => ['pipe', 'w'],
            ];

            $process = proc_open($cmd, $descriptors, $pipes);
            if (is_resource($process)) {
                fclose($pipes[0]);
                $sqlContent = stream_get_contents($pipes[1]);
                fclose($pipes[1]);
                $errContent = stream_get_contents($pipes[2]);
                fclose($pipes[2]);
                $exitCode = proc_close($process);

                if ($exitCode === 0 && strlen($sqlContent) > 0 && ! str_contains($sqlContent, 'mysqldump: Got error')) {
                    $gz = gzopen($gzPath, 'w9');
                    if ($gz) {
                        gzwrite($gz, $sqlContent);
                        gzclose($gz);
                        $success = true;
                    }
                }
            }
        }

        // 2. Fallback: Native PHP PDO SQL Dump with GZIP compression if mysqldump is not in PATH
        if (! $success) {
            $this->comment('Using PHP PDO backup generator...');
            try {
                $tables = DB::select('SHOW TABLES');
                $keyName = "Tables_in_{$dbName}";

                $gz = gzopen($gzPath, 'w9');
                if ($gz) {
                    gzwrite($gz, "-- MDRRMO Database Backup\n-- Generated: " . date('Y-m-d H:i:s') . "\n\nSET FOREIGN_KEY_CHECKS=0;\n\n");

                    foreach ($tables as $tableObj) {
                        $tbl = $tableObj->$keyName ?? array_values((array) $tableObj)[0];
                        $createTbl = DB::select("SHOW CREATE TABLE `{$tbl}`");
                        $createSql = $createTbl[0]->{'Create Table'} ?? null;

                        if ($createSql) {
                            gzwrite($gz, "DROP TABLE IF EXISTS `{$tbl}`;\n{$createSql};\n\n");
                        }

                        $rows = DB::table($tbl)->get();
                        foreach ($rows->chunk(100) as $chunk) {
                            $insertValues = [];
                            foreach ($chunk as $row) {
                                $vals = array_map(function ($val) {
                                    if ($val === null) return 'NULL';
                                    return "'" . addslashes((string) $val) . "'";
                                }, (array) $row);
                                $insertValues[] = '(' . implode(',', $vals) . ')';
                            }
                            if (! empty($insertValues)) {
                                gzwrite($gz, "INSERT INTO `{$tbl}` VALUES " . implode(",\n", $insertValues) . ";\n");
                            }
                        }
                        gzwrite($gz, "\n");
                    }

                    gzwrite($gz, "SET FOREIGN_KEY_CHECKS=1;\n");
                    gzclose($gz);
                    $success = true;
                }
            } catch (\Throwable $e) {
                $this->error('Fallback backup failed: ' . $e->getMessage());
                Log::error('DB Backup fallback failed: ' . $e->getMessage());
            }
        }

        if ($success && file_exists($gzPath)) {
            $sizeKb = round(filesize($gzPath) / 1024, 2);
            $this->info("Backup successfully created: {$gzFilename} ({$sizeKb} KB)");
            Log::info("Automated DB Backup created: {$gzFilename} ({$sizeKb} KB)");

            // 3. Auto-Prune: Keep only the latest N backups
            $keep = (int) $this->option('keep') ?: 7;
            $existing = File::files($backupDir);
            $backups = array_filter($existing, fn ($f) => str_starts_with($f->getFilename(), 'mdrrmo_backup_'));

            usort($backups, fn ($a, $b) => $b->getMTime() <=> $a->getMTime());

            if (count($backups) > $keep) {
                $toDelete = array_slice($backups, $keep);
                foreach ($toDelete as $oldFile) {
                    File::delete($oldFile->getRealPath());
                    $this->comment("Pruned old backup: {$oldFile->getFilename()}");
                }
            }
        } else {
            $this->error('Failed to create database backup archive.');
            return 1;
        }

        return 0;
    }

    private function findMysqldump(): ?string
    {
        $candidates = [
            'mysqldump',
            'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysqldump.exe',
            'C:\\laragon\\bin\\mysql\\current\\bin\\mysqldump.exe',
            '/usr/bin/mysqldump',
            '/usr/local/bin/mysqldump',
        ];

        foreach ($candidates as $cand) {
            if (file_exists($cand)) return $cand;
        }

        return null;
    }
}
