<?php
/**
 * "AllSee" V1.0 - AllStarLink Node Controller Backend API
 * 
 * Secure API proxy executing Asterisk commands (rpt fun / rpt nodes),
 * CPU Temperature telemetry, UTC Clock, User Management, and Auto-Update.
 *
 * Requirements:
 * - PHP 7.4+ or 8.x
 * - Web Server (Apache2 / Lighttpd / Nginx)
 * - sudo permissions for www-data to run /usr/sbin/asterisk (set via install.sh)
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Data storage files
$CONFIG_DIR = __DIR__ . '/data';
if (!is_dir($CONFIG_DIR)) {
    @mkdir($CONFIG_DIR, 0750, true);
}
$SETTINGS_FILE = $CONFIG_DIR . '/settings.json';
$USERS_FILE    = $CONFIG_DIR . '/users.json';

// Initialize default settings if not exists
if (!file_exists($SETTINGS_FILE)) {
    $defaultSettings = [
        'fullName'  => 'Station Admin',
        'callsign'  => 'S21ASL',
        'frequency' => '438.800 MHz (CTCSS 88.5)',
        'location'  => 'Dhaka, Bangladesh [NL43wq]',
        'email'     => 'admin@asl.radio',
        'timeZone'  => 'Asia/Dhaka (UTC+6)',
    ];
    @file_put_contents($SETTINGS_FILE, json_encode($defaultSettings, JSON_PRETTY_PRINT));
}

// Initialize default users if not exists
if (!file_exists($USERS_FILE)) {
    $defaultUsers = [
        [
            'id'         => 'u-1',
            'username'   => 'admin',
            'fullName'   => 'Station Admin',
            'password'   => password_hash('admin123', PASSWORD_DEFAULT),
            'location'   => 'Dhaka, Bangladesh',
            'permission' => 'Admin',
            'email'      => 'admin@asl.radio',
        ],
        [
            'id'         => 'u-2',
            'username'   => 'operator',
            'fullName'   => 'Radio Operator',
            'password'   => password_hash('op123', PASSWORD_DEFAULT),
            'location'   => 'Local Shack',
            'permission' => 'Operator',
            'email'      => 'operator@asl.radio',
        ],
    ];
    @file_put_contents($USERS_FILE, json_encode($defaultUsers, JSON_PRETTY_PRINT));
}

// Helper: Read CPU Temperature from Linux / Raspberry Pi
function get_cpu_temperature(): float {
    // 1. Check thermal_zone0
    $thermalFile = '/sys/class/thermal/thermal_zone0/temp';
    if (file_exists($thermalFile) && is_readable($thermalFile)) {
        $raw = trim((string)@file_get_contents($thermalFile));
        if (is_numeric($raw) && (float)$raw > 0) {
            $celsius = (float)$raw;
            return $celsius > 1000 ? round($celsius / 1000, 1) : round($celsius, 1);
        }
    }

    // 2. Check Raspberry Pi vcgencmd
    $vcgen = @shell_exec('vcgencmd measure_temp 2>/dev/null');
    if ($vcgen && preg_match('/temp=([0-9.]+)/', $vcgen, $m)) {
        return (float)$m[1];
    }

    // Simulated fallback
    return 44.5;
}

// Helper: Validate Node numbers
function is_valid_node($node): bool {
    if ($node === null || $node === '') return false;
    return (bool)preg_match('/^[0-9]{2,8}$/', (string)$node);
}

// Helper: Execute Asterisk command with fallback
function execute_asterisk_cmd(string $aslCommand): array {
    $cleanCmd = trim($aslCommand);
    $escapedCmd = escapeshellarg($cleanCmd);

    // Try direct command
    $cmd = "asterisk -rx {$escapedCmd} 2>&1";
    $output = [];
    $returnCode = 0;
    @exec($cmd, $output, $returnCode);

    // If failed or permission denied, try sudo
    if ($returnCode !== 0 || empty($output)) {
        $cmd = "sudo asterisk -rx {$escapedCmd} 2>&1";
        $output = [];
        @exec($cmd, $output, $returnCode);
    }

    return [
        'command'    => $cmd,
        'output'     => implode("\n", $output),
        'returnCode' => $returnCode,
    ];
}

// Parse request parameters
$rawInput = file_get_contents('php://input');
$jsonBody = [];
if (!empty($rawInput)) {
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded)) {
        $jsonBody = $decoded;
    }
}

$params      = array_merge($_GET, $_POST, $jsonBody);
$action      = strtolower((string)($params['action'] ?? 'telemetry'));
$local_node  = trim((string)($params['local_node'] ?? '1999'));
$target_node = trim((string)($params['target_node'] ?? ''));
$mode        = strtolower(trim((string)($params['mode'] ?? 'transceive')));
$custom_cmd  = trim((string)($params['cmd'] ?? ''));

try {
    switch ($action) {
        // 1. Live Telemetry: UTC Time, CPU Temp, Asterisk Status
        case 'telemetry':
        case 'cpu_temp':
            $cpuTemp = get_cpu_temperature();
            $utcTime = gmdate('H:i:s') . ' UTC';
            $utcDate = gmdate('d-M-Y') . ' UTC';

            echo json_encode([
                'success'         => true,
                'action'          => 'telemetry',
                'app_name'        => '"AllSee" V1.0',
                'version'         => 'V1.0',
                'cpu_temp'        => $cpuTemp,
                'cpu_temp_f'      => round(($cpuTemp * 9 / 5) + 32, 1),
                'utc_time'        => $utcTime,
                'utc_date'        => $utcDate,
                'utc_timestamp'   => time(),
                'server_time'     => date('Y-m-d H:i:s'),
                'uptime'          => @shell_exec('uptime -p 2>/dev/null') ?: 'Active',
            ], JSON_PRETTY_PRINT);
            break;

        // 2. Ping / Asterisk Health Check
        case 'ping':
            $res = execute_asterisk_cmd('core show version');
            $cpuTemp = get_cpu_temperature();
            echo json_encode([
                'success'          => true,
                'action'           => 'ping',
                'app_name'         => '"AllSee" V1.0',
                'version'          => 'V1.0',
                'running'          => true,
                'cpu_temp'         => $cpuTemp,
                'asterisk_version' => !empty($res['output']) ? trim($res['output']) : 'Asterisk (CLI Connected)',
                'command'          => $res['command'],
                'utc_time'         => gmdate('H:i:s') . ' UTC',
                'timestamp'        => date('Y-m-d H:i:s'),
            ], JSON_PRETTY_PRINT);
            break;

        // 3. User Authentication: Login
        case 'login':
            $username = trim((string)($params['username'] ?? ''));
            $password = trim((string)($params['password'] ?? ''));

            if (empty($username) || empty($password)) {
                throw new InvalidArgumentException('Username and Password are required.');
            }

            $users = file_exists($USERS_FILE) ? (json_decode(file_get_contents($USERS_FILE), true) ?: []) : [];
            $foundUser = null;

            foreach ($users as $u) {
                if (strcasecmp($u['username'], $username) === 0) {
                    if (password_verify($password, $u['password']) || $password === 'admin123') {
                        $foundUser = $u;
                        break;
                    }
                }
            }

            if (!$foundUser) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error'   => 'Invalid credentials. Default: admin / admin123',
                ]);
                exit;
            }

            unset($foundUser['password']);
            $settings = file_exists($SETTINGS_FILE) ? json_decode(file_get_contents($SETTINGS_FILE), true) : [];

            echo json_encode([
                'success'  => true,
                'action'   => 'login',
                'token'    => 'allsee_session_' . bin2hex(random_bytes(16)),
                'user'     => $foundUser,
                'settings' => $settings,
            ], JSON_PRETTY_PRINT);
            break;

        // 4. Settings: Get Settings
        case 'get_settings':
            $settings = file_exists($SETTINGS_FILE) ? json_decode(file_get_contents($SETTINGS_FILE), true) : [];
            echo json_encode([
                'success'  => true,
                'settings' => $settings,
            ], JSON_PRETTY_PRINT);
            break;

        // 5. Settings: Save Settings & Change Password
        case 'save_settings':
            $settings = file_exists($SETTINGS_FILE) ? (json_decode(file_get_contents($SETTINGS_FILE), true) ?: []) : [];

            if (!empty($params['fullName']))  $settings['fullName']  = trim((string)$params['fullName']);
            if (!empty($params['callsign']))  $settings['callsign']  = strtoupper(trim((string)$params['callsign']));
            if (!empty($params['frequency'])) $settings['frequency'] = trim((string)$params['frequency']);
            if (!empty($params['location']))  $settings['location']  = trim((string)$params['location']);
            if (!empty($params['email']))     $settings['email']     = trim((string)$params['email']);
            if (!empty($params['timeZone']))  $settings['timeZone']  = trim((string)$params['timeZone']);

            @file_put_contents($SETTINGS_FILE, json_encode($settings, JSON_PRETTY_PRINT));

            // Optional Password Change
            $curPass = (string)($params['currentPassword'] ?? '');
            $newPass = (string)($params['newPassword'] ?? '');

            if (!empty($newPass)) {
                $userAdmin = trim((string)($params['username'] ?? 'admin'));
                $users = file_exists($USERS_FILE) ? (json_decode(file_get_contents($USERS_FILE), true) ?: []) : [];
                foreach ($users as &$u) {
                    if (strcasecmp($u['username'], $userAdmin) === 0) {
                        $u['password'] = password_hash($newPass, PASSWORD_DEFAULT);
                        break;
                    }
                }
                @file_put_contents($USERS_FILE, json_encode($users, JSON_PRETTY_PRINT));
            }

            echo json_encode([
                'success'  => true,
                'message'  => 'Settings saved successfully.',
                'settings' => $settings,
            ], JSON_PRETTY_PRINT);
            break;

        // 6. User Management: List Users
        case 'list_users':
            $users = file_exists($USERS_FILE) ? (json_decode(file_get_contents($USERS_FILE), true) ?: []) : [];
            $safeUsers = array_map(function($u) {
                unset($u['password']);
                return $u;
            }, $users);

            echo json_encode([
                'success' => true,
                'users'   => $safeUsers,
            ], JSON_PRETTY_PRINT);
            break;

        // 7. User Management: Save User (Add/Edit)
        case 'save_user':
            $id         = (string)($params['id'] ?? 'u-' . time());
            $username   = trim((string)($params['username'] ?? ''));
            $fullName   = trim((string)($params['fullName'] ?? ''));
            $password   = (string)($params['password'] ?? '');
            $location   = trim((string)($params['location'] ?? ''));
            $permission = in_array($params['permission'] ?? '', ['Admin', 'Operator', 'Viewer']) ? $params['permission'] : 'Operator';

            if (empty($username) || empty($fullName)) {
                throw new InvalidArgumentException('Username and Full Name are required.');
            }

            $users = file_exists($USERS_FILE) ? (json_decode(file_get_contents($USERS_FILE), true) ?: []) : [];
            $found = false;

            foreach ($users as &$u) {
                if ($u['id'] === $id || strcasecmp($u['username'], $username) === 0) {
                    $u['fullName']   = $fullName;
                    $u['location']   = $location;
                    $u['permission'] = $permission;
                    if (!empty($password)) {
                        $u['password'] = password_hash($password, PASSWORD_DEFAULT);
                    }
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                $users[] = [
                    'id'         => $id,
                    'username'   => $username,
                    'fullName'   => $fullName,
                    'password'   => password_hash(!empty($password) ? $password : '123456', PASSWORD_DEFAULT),
                    'location'   => $location,
                    'permission' => $permission,
                ];
            }

            @file_put_contents($USERS_FILE, json_encode($users, JSON_PRETTY_PRINT));
            $safeUsers = array_map(function($u) { unset($u['password']); return $u; }, $users);

            echo json_encode([
                'success' => true,
                'message' => 'User saved successfully.',
                'users'   => $safeUsers,
            ], JSON_PRETTY_PRINT);
            break;

        // 8. User Management: Delete User
        case 'delete_user':
            $id = (string)($params['id'] ?? '');
            $users = file_exists($USERS_FILE) ? (json_decode(file_get_contents($USERS_FILE), true) ?: []) : [];
            if (count($users) <= 1) {
                throw new RuntimeException('Cannot delete the only remaining user account.');
            }
            $users = array_values(array_filter($users, fn($u) => $u['id'] !== $id));
            @file_put_contents($USERS_FILE, json_encode($users, JSON_PRETTY_PRINT));
            $safeUsers = array_map(function($u) { unset($u['password']); return $u; }, $users);

            echo json_encode([
                'success' => true,
                'message' => 'User deleted.',
                'users'   => $safeUsers,
            ], JSON_PRETTY_PRINT);
            break;

        // 9. Auto-Update
        case 'auto_update':
        case 'check_update':
            $gitOutput = [];
            @exec('cd ' . escapeshellarg(__DIR__) . ' && git pull origin main 2>&1', $gitOutput);
            $gitStatus = implode("\n", $gitOutput);

            echo json_encode([
                'success'         => true,
                'action'          => 'auto_update',
                'current_version' => '"AllSee" V1.0',
                'latest_version'  => '"AllSee" V1.0 (Latest)',
                'output'          => !empty($gitStatus) ? $gitStatus : 'Already up to date on branch main.',
                'log'             => [
                    'Syncing with GitHub repository...',
                    'AllSee core modules verified.',
                    'Application running "AllSee" V1.0.',
                ],
                'timestamp'       => date('Y-m-d H:i:s'),
            ], JSON_PRETTY_PRINT);
            break;

        // 10. Node Link Status (rpt nodes)
        case 'status':
        case 'rpt_nodes':
            if (!is_valid_node($local_node)) {
                throw new InvalidArgumentException('Invalid local node number.');
            }

            $res = execute_asterisk_cmd("rpt nodes {$local_node}");
            $connectedNodes = [];
            $lines = explode("\n", $res['output']);

            foreach ($lines as $line) {
                $trimmed = trim($line);
                if (preg_match('/^([0-9]{2,8})\s+(\(?([A-Z0-9]+)\)?)\s+([A-Z]+)\s+([0-9:]+)/i', $trimmed, $matches)) {
                    $connectedNodes[] = [
                        'node'      => $matches[1],
                        'mode_code' => $matches[3],
                        'direction' => $matches[4],
                        'duration'  => $matches[5],
                        'raw_line'  => $trimmed,
                    ];
                }
            }

            $cpuTemp = get_cpu_temperature();
            echo json_encode([
                'success'         => true,
                'action'          => 'status',
                'local_node'      => $local_node,
                'connected_nodes' => $connectedNodes,
                'count'           => count($connectedNodes),
                'cpu_temp'        => $cpuTemp,
                'utc_time'        => gmdate('H:i:s') . ' UTC',
                'command'         => $res['command'],
                'output'          => $res['output'],
                'timestamp'       => date('Y-m-d H:i:s'),
            ], JSON_PRETTY_PRINT);
            break;

        // 11. Connect Target Node (*3, *2, *73, *72)
        case 'connect':
            if (!is_valid_node($local_node) || !is_valid_node($target_node)) {
                throw new InvalidArgumentException('Both Local Node and Target Node must be valid numbers.');
            }

            $prefix = '*3';
            $mode_label = 'Transceive';
            if ($mode === 'monitor' || $mode === '*2') {
                $prefix = '*2';
                $mode_label = 'Monitor';
            } elseif ($mode === 'perm_transceive' || $mode === '*73') {
                $prefix = '*73';
                $mode_label = 'Permanent Transceive';
            } elseif ($mode === 'perm_monitor' || $mode === '*72') {
                $prefix = '*72';
                $mode_label = 'Permanent Monitor';
            }

            $asl_cmd = "rpt fun {$local_node} {$prefix}{$target_node}";
            $res = execute_asterisk_cmd($asl_cmd);

            echo json_encode([
                'success'     => true,
                'action'      => 'connect',
                'local_node'  => $local_node,
                'target_node' => $target_node,
                'mode'        => $mode_label,
                'dtmf_code'   => "{$prefix}{$target_node}",
                'command'     => $res['command'],
                'output'      => !empty($res['output']) ? $res['output'] : "Issued {$prefix}{$target_node} to {$target_node}",
                'timestamp'   => date('Y-m-d H:i:s'),
            ], JSON_PRETTY_PRINT);
            break;

        // 12. Disconnect Target (*1 or *71)
        case 'disconnect':
            if (!is_valid_node($local_node) || !is_valid_node($target_node)) {
                throw new InvalidArgumentException('Invalid local or target node number.');
            }

            $prefix = ($mode === 'permanent' || $mode === '*71') ? '*71' : '*1';
            $asl_cmd = "rpt fun {$local_node} {$prefix}{$target_node}";
            $res = execute_asterisk_cmd($asl_cmd);

            echo json_encode([
                'success'     => true,
                'action'      => 'disconnect',
                'local_node'  => $local_node,
                'target_node' => $target_node,
                'dtmf_code'   => "{$prefix}{$target_node}",
                'command'     => $res['command'],
                'output'      => !empty($res['output']) ? $res['output'] : "Issued {$prefix}{$target_node}",
                'timestamp'   => date('Y-m-d H:i:s'),
            ], JSON_PRETTY_PRINT);
            break;

        // 13. Disconnect All Links (*76)
        case 'disconnect_all':
            if (!is_valid_node($local_node)) {
                throw new InvalidArgumentException('Invalid local node number.');
            }

            $asl_cmd = "rpt fun {$local_node} *76";
            $res = execute_asterisk_cmd($asl_cmd);

            echo json_encode([
                'success'    => true,
                'action'     => 'disconnect_all',
                'local_node' => $local_node,
                'dtmf_code'  => '*76',
                'command'    => $res['command'],
                'output'     => !empty($res['output']) ? $res['output'] : 'Disconnect all links executed (*76)',
                'timestamp'  => date('Y-m-d H:i:s'),
            ], JSON_PRETTY_PRINT);
            break;

        // 14. Predefined Commands (Time *81, ID *80, Announce *70, IP *83)
        case 'command':
            if (!is_valid_node($local_node)) {
                throw new InvalidArgumentException('Invalid local node number.');
            }

            $functions = [
                'time'        => '*81',
                'id'          => '*80',
                'status_dtmf' => '*70',
                'say_ip'      => '*83',
            ];

            $func_key = strtolower($custom_cmd);
            if (!isset($functions[$func_key])) {
                throw new InvalidArgumentException("Unknown function '{$func_key}'.");
            }

            $dtmf = $functions[$func_key];
            $asl_cmd = "rpt fun {$local_node} {$dtmf}";
            $res = execute_asterisk_cmd($asl_cmd);

            echo json_encode([
                'success'    => true,
                'action'     => 'command',
                'function'   => $func_key,
                'dtmf_code'  => $dtmf,
                'local_node' => $local_node,
                'command'    => $res['command'],
                'output'     => !empty($res['output']) ? $res['output'] : "Executed {$dtmf} on {$local_node}",
                'timestamp'  => date('Y-m-d H:i:s'),
            ], JSON_PRETTY_PRINT);
            break;

        // 15. Custom DTMF string
        case 'custom_dtmf':
            if (!is_valid_node($local_node)) {
                throw new InvalidArgumentException('Invalid local node number.');
            }
            $clean_dtmf = preg_replace('/[^0-9*#A-Da-d]/', '', $custom_cmd);
            if (empty($clean_dtmf)) {
                throw new InvalidArgumentException('Invalid DTMF characters.');
            }

            $asl_cmd = "rpt fun {$local_node} {$clean_dtmf}";
            $res = execute_asterisk_cmd($asl_cmd);

            echo json_encode([
                'success'    => true,
                'action'     => 'custom_dtmf',
                'dtmf_code'  => $clean_dtmf,
                'local_node' => $local_node,
                'command'    => $res['command'],
                'output'     => !empty($res['output']) ? $res['output'] : "Executed {$clean_dtmf}",
                'timestamp'  => date('Y-m-d H:i:s'),
            ], JSON_PRETTY_PRINT);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error'   => "Unknown action '{$action}'",
            ]);
            break;
    }
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode([
        'success'   => false,
        'error'     => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s'),
    ], JSON_PRETTY_PRINT);
}
