<?php
/**
 * Webhook para Elementor → Google Apps Script
 * Retorna OK imediatamente e encaminha dados em background
 */

// URL do Google Apps Script
$WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby66oCrq7Fj-wDQx3YyycNWUJ_XnzXQtToR0k5qIq_676UA0iujTxymI4WU9j7F8Ulh/exec';

// 1. Retorna OK imediatamente para o Elementor
http_response_code(200);
header('Content-Type: text/plain');
echo 'OK';

// Força o envio da resposta
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
} else {
    ob_end_flush();
    flush();
}

// 2. Encaminha dados para Google Apps Script em background
try {
    // Pega todos os dados recebidos (POST ou GET)
    $data = array_merge($_GET, $_POST);
    
    // Se vier JSON no body
    $rawBody = file_get_contents('php://input');
    if (!empty($rawBody)) {
        $jsonData = json_decode($rawBody, true);
        if ($jsonData) {
            $data = array_merge($data, $jsonData);
        }
    }
    
    // Envia para Google Apps Script
    $ch = curl_init($WEB_APP_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json'
    ));
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Log para debug (opcional)
    error_log('[elementor-webhook] Dados encaminhados para GAS - HTTP ' . $httpCode);
    
} catch (Exception $e) {
    error_log('[elementor-webhook] Erro: ' . $e->getMessage());
}
?>
