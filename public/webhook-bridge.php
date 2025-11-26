<?php
/**
 * Webhook Bridge para Elementor → Google Apps Script
 * - Retorna 200 OK imediatamente para o Elementor (evita "Webhook error")
 * - Encaminha o payload para o Google Apps Script em background
 *
 * Como usar:
 * 1) Defina a URL do seu Web App do Apps Script em $WEB_APP_URL
 * 2) No Elementor, em Ações após o envio: Webhook + Redirect
 * 3) Em Webhook URL, coloque a URL pública deste arquivo (ex.: https://seusite.com/automation/webhook-bridge.php)
 * 4) Em Redirect, configure a página final (ex.: https://agenciaand.com.br/proximos-passos/)
 */

// ====== CONFIG ======
// Cole aqui a URL do seu Web App (do Google Apps Script)
$WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby66oCrq7Fj-wDQx3YyycNWUJ_XnzXQtToR0k5qIq_676UA0iujTxymI4WU9j7F8Ulh/exec';
// ====================

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

// Captura o corpo da requisição do Elementor
$rawBody = file_get_contents('php://input');
$contentType = isset($_SERVER['CONTENT_TYPE']) ? strtolower($_SERVER['CONTENT_TYPE']) : '';
$forwardBody = '';
$forwardHeaders = [
    'User-Agent: WebhookBridge/1.0',
    'Content-Type: application/json'
];

// Converte para JSON independente do formato recebido
if ($rawBody !== '') {
    // Se vier como form-urlencoded, converte para JSON
    if (strpos($contentType, 'application/x-www-form-urlencoded') !== false || 
        (strpos($rawBody, '=') !== false && strpos($rawBody, '&') !== false && substr(trim($rawBody), 0, 1) !== '{')) {
        // Decodifica URL encoding e converte para array
        parse_str(urldecode($rawBody), $parsed);
        $forwardBody = json_encode($parsed, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } else {
        // Tenta decodificar como JSON
        $json = json_decode($rawBody, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $forwardBody = $rawBody; // Já é JSON válido
        } else {
            // Se não for JSON válido, tenta como form-urlencoded mesmo assim
            parse_str(urldecode($rawBody), $parsed);
            $forwardBody = json_encode($parsed, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }
} else {
    // Fallback para $_POST
    $forwardBody = json_encode($_POST, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

// Log para debug (opcional)
error_log('[webhook-bridge] Forward body: ' . substr($forwardBody, 0, 500));

// Sempre responde 200 imediatemente ao Elementor
echo json_encode(['success' => true, 'message' => 'OK']);
// Importante: flush para encerrar a resposta rapidamente
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
} else {
    @ob_end_flush();
    @flush();
}

// Se a URL do Web App não estiver configurada, não tenta encaminhar
if (!$WEB_APP_URL) {
    error_log('[webhook-bridge] WEB_APP_URL não configurada.');
    exit;
}

// Dispara o encaminhamento em background (sem travar o Elementor)
try {
    $ch = curl_init($WEB_APP_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $forwardBody);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $forwardHeaders);
    // Timeout curto para não travar a execução do PHP
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3);
    // Executa e ignora o resultado (log opcional)
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($resp === false) {
        error_log('[webhook-bridge] cURL error: ' . curl_error($ch));
    } else {
        error_log('[webhook-bridge] encaminhado para GAS - HTTP ' . $code);
    }
    curl_close($ch);
} catch (Throwable $e) {
    error_log('[webhook-bridge] exceção: ' . $e->getMessage());
}
?>


