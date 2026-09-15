<?php
/**
 * AllSee - AllStarLink Backend Gateway Bridge
 * Connects the AllSee Modern Dark UI with Asterisk / ASL rpt engine.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';
$node = isset($_GET['node']) ? preg_replace('/[^0-9]/', '', $_GET['node']) : '';

// Helper to run safe asterisk commands
function run_asterisk($cmd) {
    // Sanitize input
    $safe_cmd = escapeshellcmd($cmd);
    $output = [];
    $ret = 0;
    // Try sudo asterisk if www-data, or direct asterisk
    exec("sudo asterisk -rx " . escapeshellarg($safe_cmd) . " 2>&1", $output, $ret);
    if ($ret !== 0 || empty($output)) {
        exec("asterisk -rx " . escapeshellarg($safe_cmd) . " 2>&1", $output, $ret);
    }
    return implode("\n", $output);
}

// Find primary local node number from /etc/asterisk/rpt.conf if not provided
function get_primary_node() {
    $conf = @file_get_contents('/etc/asterisk/rpt.conf');
    if ($conf && preg_match('/\[([0-9]{4,6})\]/', $conf, $matches)) {
        return $matches[1];
    }
    return '58841'; // fallback
}

if (empty($node)) {
    $node = get_primary_node();
}

switch ($action) {
    case 'ping':
        echo json_encode([
            'status' => 'online',
            'server' => 'AllStarLink / AllSee Native Host',
            'timestamp' => time(),
            'node' => $node
        ]);
        break;

    case 'status':
        // System telemetry
        $load = sys_getloadavg();
        $uptime_raw = @file_get_contents('/proc/uptime');
        $uptime_sec = $uptime_raw ? intval(explode(' ', $uptime_raw)[0]) : 0;

        // CPU temperature
        $temp = 42.0;
        if (file_exists('/sys/class/thermal/thermal_zone0/temp')) {
            $temp_raw = intval(trim(@file_get_contents('/sys/class/thermal/thermal_zone0/temp')));
            if ($temp_raw > 0) $temp = round($temp_raw / 1000, 1);
        }

        // Memory
        $mem_info = @file_get_contents('/proc/meminfo');
        $mem_total = 1024;
        $mem_free = 512;
        if ($mem_info) {
            if (preg_match('/MemTotal:\s+(\d+)/', $mem_info, $m)) $mem_total = round($m[1] / 1024);
            if (preg_match('/MemAvailable:\s+(\d+)/', $mem_info, $m)) $mem_free = round($m[1] / 1024);
        }
        $mem_used_pct = $mem_total > 0 ? round((($mem_total - $mem_free) / $mem_total) * 100) : 40;

        // Asterisk connected nodes
        $ast_nodes_raw = run_asterisk("rpt nodes " . $node);
        $ast_version = run_asterisk("core show version");

        echo json_encode([
            'node' => $node,
            'uptimeSec' => $uptime_sec,
            'cpuTempC' => $temp,
            'cpuLoad' => $load[0] ?? 0.25,
            'memoryUsedPct' => $mem_used_pct,
            'asteriskVersion' => trim(explode("\n", $ast_version)[0] ?? 'Asterisk ASL'),
            'rptNodesOutput' => $ast_nodes_raw,
        ]);
        break;

    case 'cmd':
        // Execute DTMF or rpt function, e.g. *32560 or *12560 or *76
        $function = isset($_GET['cmd']) ? trim($_GET['cmd']) : '';
        if (!preg_match('/^[*#0-9A-D]+$/i', $function)) {
            echo json_encode(['error' => 'Invalid command string']);
            exit;
        }

        $res = run_asterisk("rpt fun " . $node . " " . $function);
        echo json_encode([
            'node' => $node,
            'command' => $function,
            'output' => $res,
            'success' => true
        ]);
        break;

    case 'links':
        // Get list of currently connected links from Asterisk
        $out = run_asterisk("rpt nodes " . $node);
        $lines = explode("\n", $out);
        $links = [];
        foreach ($lines as $line) {
            $line = trim($line);
            if (preg_match('/^([0-9]{4,6})\s+([<TRXMC\s]+)/i', $line, $m)) {
                $rem_node = $m[1];
                if ($rem_node !== $node) {
                    $links[] = [
                        'node' => $rem_node,
                        'mode' => stripos($line, 'M') !== false ? 'monitor' : 'transceive',
                        'raw' => $line
                    ];
                }
            }
        }
        echo json_encode([
            'node' => $node,
            'links' => $links,
            'raw' => $out
        ]);
        break;

    default:
        echo json_encode([
            'app' => 'AllSee',
            'version' => '1.0.0',
            'author' => 's21sim',
            'endpoints' => [
                '?action=ping',
                '?action=status&node=<node>',
                '?action=links&node=<node>',
                '?action=cmd&node=<node>&cmd=*3<remote>',
            ]
        ]);
        break;
}
