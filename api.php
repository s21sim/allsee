<?php
session_start();
header('Content-Type: application/json');

// ডিফল্ট লগইন ক্রেডেনশিয়াল (প্রয়োজনে পরিবর্তন করে নেবেন)
define('ADMIN_USER', 'admin');
define('ADMIN_PASS', 'allsee123');

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    echo json_encode(['status' => 'error', 'message' => 'অবৈধ ডেটা ফরম্যাট।']);
    exit;
}

$action = isset($data['action']) ? trim($data['action']) : '';

// লগইন হ্যান্ডলার
if ($action === 'login') {
    $username = isset($data['username']) ? trim($data['username']) : '';
    $password = isset($data['password']) ? trim($data['password']) : '';

    if ($username === ADMIN_USER && $password === ADMIN_PASS) {
        $_SESSION['authenticated'] = true;
        echo json_encode(['status' => 'success', 'message' => 'লগইন সফল হয়েছে।']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'ভুল ইউজারনেম অথবা পাসওয়ার্ড!']);
    }
    exit;
}

// লগআউট হ্যান্ডলার
if ($action === 'logout') {
    session_destroy();
    echo json_encode(['status' => 'success', 'message' => 'লগআউট সফল হয়েছে।']);
    exit;
}

// সেশন চেক হ্যান্ডলার
if ($action === 'check_session') {
    echo json_encode([
        'status' => 'success',
        'authenticated' => !empty($_SESSION['authenticated'])
    ]);
    exit;
}

// অথেনটিকেশন যাচাই: লগইন ছাড়া পরবর্তী কোনো কমান্ড রান হবে না
if (empty($_SESSION['authenticated'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'অননুমোদিত অ্যাক্সেস! দয়া করে লগইন করুন।']);
    exit;
}

// Asterisk CLI কমান্ড এক্সিকিউশন
$localNode  = isset($data['localNode']) ? preg_replace('/[^0-9]/', '', $data['localNode']) : '';
$targetNode = isset($data['targetNode']) ? preg_replace('/[^0-9]/', '', $data['targetNode']) : '';

if (empty($localNode)) {
    echo json_encode(['status' => 'error', 'message' => 'লোকাল নোড নম্বর প্রদান আবশ্যক।']);
    exit;
}

$command = '';

switch ($action) {
    case 'connect':
        if (empty($targetNode)) {
            echo json_encode(['status' => 'error', 'message' => 'টার্গেট নোড নম্বর প্রয়োজন।']);
            exit;
        }
        $command = "sudo /usr/sbin/asterisk -rx \"rpt fun {$localNode} *3{$targetNode}\"";
        break;

    case 'disconnect':
        if (empty($targetNode)) {
            echo json_encode(['status' => 'error', 'message' => 'টার্গেট নোড নম্বর প্রয়োজন।']);
            exit;
        }
        $command = "sudo /usr/sbin/asterisk -rx \"rpt fun {$localNode} *1{$targetNode}\"";
        break;

    case 'disconnect_all':
        $command = "sudo /usr/sbin/asterisk -rx \"rpt fun {$localNode} *76\"";
        break;

    case 'status':
        $command = "sudo /usr/sbin/asterisk -rx \"rpt lnodes {$localNode}\"";
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'অজানা অ্যাকশন অনুরোধ।']);
        exit;
}

$output = shell_exec($command . " 2>&1");

echo json_encode([
    'status' => 'success',
    'action' => $action,
    'output' => !empty($output) ? trim($output) : 'Command executed successfully with no return text.'
]);
