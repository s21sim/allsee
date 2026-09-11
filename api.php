<?php
/**
 * AllSee - AllStarLink (ASL) Web Controller API Backend
 * 
 * Safely executes Asterisk CLI commands via app_rpt (rpt fun / rpt nodes).
 * Designed for lightweight, secure execution on AllStarLink / Debian / Raspberry Pi servers.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$config = [
    'asterisk_paths' => ['/usr/sbin/asterisk', '/usr/bin/asterisk', 'asterisk'],
    'use_sudo'       => true,
];

function sendResponse(bool $success, string $message, array $data = [], int $httpCode = 200): void {
    http_response_code($httpCode);
    echo json_encode([
        'success'   => $success,
        'message'   => $message,
        'timestamp' => date('Y-m-d H:i:s'),
        'data'      => $data
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

function findAsteriskBinary(array $paths): ?string {
    foreach ($paths as $path) {
        if ($path === 'asterisk') {
            $check = trim((string) shell_exec('which asterisk 2>/dev/null'));
            if (!empty($check) && is_executable($check)) return $check;
        } elseif (file_exists($path) && is_executable($path)) {
            return $path;
        }
    }
    return null;
}

$inputRaw = file_get_contents('php://input');
$requestData = [];
if (!empty($inputRaw)) {
    $decoded = json_decode($inputRaw, true);
    if (is_array($decoded)) $requestData = $decoded;
}
$params = array_merge($_GET, $_POST, $requestData);

if (isset($params['action']) && $params['action'] === 'ping') {
    $astBin = findAsteriskBinary($config['asterisk_paths']);
    sendResponse(true, 'AllSee API is online', [
        'php_version'     => PHP_VERSION,
        'asterisk_binary' => $astBin ?? 'Not found',
        'server_time'     => date('r'),
        'user'            => trim((string) shell_exec('whoami 2>/dev/null'))
    ]);
}

$action = isset($params['action']) ? strtolower(trim((string) $params['action'])) : '';
if (empty($action)) {
    sendResponse(false, 'Missing required "action" parameter.', [], 400);
}

$localNode = isset($params['local_node']) ? trim((string) $params['local_node']) : '';
if (!preg_match('/^[0-9]{3,8}$/', $localNode)) {
    sendResponse(false, 'Invalid Local Node number. Must be 3 to 8 digits (e.g. 1999, 45678).', [], 422);
}

$targetNode = isset($params['target_node']) ? trim((string) $params['target_node']) : '';
$asteriskSubCommand = '';

switch ($action) {
    case 'connect':
        if (!preg_match('/^[0-9]{3,8}$/', $targetNode)) {
            sendResponse(false, 'Invalid Target Node for connection.', [], 422);
        }
        $asteriskSubCommand = "rpt fun {$localNode} *3{$targetNode}";
        break;

    case 'monitor':
        if (!preg_match('/^[0-9]{3,8}$/', $targetNode)) {
            sendResponse(false, 'Invalid Target Node for monitor mode.', [], 422);
        }
        $asteriskSubCommand = "rpt fun {$localNode} *2{$targetNode}";
        break;

    case 'disconnect':
        if (!preg_match('/^[0-9]{3,8}$/', $targetNode)) {
            sendResponse(false, 'Invalid Target Node for disconnect.', [], 422);
        }
        $asteriskSubCommand = "rpt fun {$localNode} *1{$targetNode}";
        break;

    case 'disconnect_all':
        $asteriskSubCommand = "rpt fun {$localNode} *76";
        break;

    case 'status':
        $asteriskSubCommand = "rpt fun {$localNode} *70";
        break;

    case 'nodes':
    case 'show_nodes':
        $asteriskSubCommand = "rpt nodes {$localNode}";
        break;

    case 'custom_dtmf':
        $customDtmf = isset($params['custom_dtmf']) ? trim((string) $params['custom_dtmf']) : '';
        if (!preg_match('/^[\*#][0-9A-Da-d\*#]{1,15}$/', $customDtmf)) {
            sendResponse(false, 'Invalid custom DTMF sequence (e.g. *81).', [], 422);
        }
        $asteriskSubCommand = "rpt fun {$localNode} " . strtoupper($customDtmf);
        break;

    default:
        sendResponse(false, "Unknown action: '{$action}'", [], 400);
}

$asteriskBinary = findAsteriskBinary($config['asterisk_paths']);
if (!$asteriskBinary) {
    sendResponse(false, 'Asterisk binary not found on this system.', [], 500);
}

$fullCmd = $config['use_sudo']
    ? 'sudo ' . escapeshellarg($asteriskBinary) . ' -rx ' . escapeshellarg($asteriskSubCommand) . ' 2>&1'
    : escapeshellarg($asteriskBinary) . ' -rx ' . escapeshellarg($asteriskSubCommand) . ' 2>&1';

$outputLines = [];
$returnCode = 0;
exec($fullCmd, $outputLines, $returnCode);

$rawOutput = implode("\n", $outputLines);
$isSuccess = ($returnCode === 0);

if (stripos($rawOutput, 'permission denied') !== false || stripos($rawOutput, 'password is required') !== false) {
    sendResponse(false, 'Permission Error: www-data does not have sudo permission to run Asterisk.', [
        'cli_output' => $rawOutput
    ], 403);
}

$displayOutput = !empty(trim($rawOutput)) ? $rawOutput : "[CLI OK] Command sent to Asterisk successfully.";

sendResponse($isSuccess, $isSuccess ? 'Success' : 'Execution Warning', [
    'action'      => $action,
    'local_node'  => $localNode,
    'asl_command' => $asteriskSubCommand,
    'cli_output'  => $displayOutput,
    'exit_code'   => $returnCode
]);