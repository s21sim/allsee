<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'status' => 'error',
        'message' => 'শুধুমাত্র POST মেথড গ্রহণযোগ্য।'
    ]);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    echo json_encode([
        'status' => 'error',
        'message' => 'অবৈধ JSON ডেটা।'
    ]);
    exit;
}

$action     = isset($data['action']) ? trim($data['action']) : '';
$localNode  = isset($data['localNode']) ? preg_replace('/[^0-9]/', '', $data['localNode']) : '';
$targetNode = isset($data['targetNode']) ? preg_replace('/[^0-9]/', '', $data['targetNode']) : '';

if (empty($localNode)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'লোকাল নোড নম্বর প্রয়োজন।'
    ]);
    exit;
}

$command = '';

switch ($action) {
    case 'connect':
        if (empty($targetNode)) {
            echo json_encode(['status' => 'error', 'message' => 'টার্গেট নোড নম্বর দিন।']);
            exit;
        }
        // Connect command: *3 <Node>
        $command = "sudo /usr/sbin/asterisk -rx \"rpt fun {$localNode} *3{$targetNode}\"";
        break;

    case 'disconnect':
        if (empty($targetNode)) {
            echo json_encode(['status' => 'error', 'message' => 'টার্গেট নোড নম্বর দিন।']);
            exit;
        }
        // Disconnect command: *1 <Node>
        $command = "sudo /usr/sbin/asterisk -rx \"rpt fun {$localNode} *1{$targetNode}\"";
        break;

    case 'disconnect_all':
        // Disconnect All command: *76
        $command = "sudo /usr/sbin/asterisk -rx \"rpt fun {$localNode} *76\"";
        break;

    case 'status':
        // Check linked nodes
        $command = "sudo /usr/sbin/asterisk -rx \"rpt lnodes {$localNode}\"";
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'অজানা অ্যাকশন।']);
        exit;
}

$output = shell_exec($command . " 2>&1");

echo json_encode([
    'status'  => 'success',
    'action'  => $action,
    'output'  => !empty($output) ? trim($output) : "Command executed with no output."
]);
?>
