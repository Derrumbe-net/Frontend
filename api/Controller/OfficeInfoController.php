<?php

namespace DerrumbeNet\Controller;

use DerrumbeNet\Model\OfficeInfo;

class OfficeInfoController
{
    private OfficeInfo $model;

    public function __construct(OfficeInfo $model)
    {
        $this->model = $model;
    }

    private function jsonResponse($response, $data, $status = 200)
    {
        $payload = json_encode($data, JSON_UNESCAPED_UNICODE);
        $response->getBody()->write($payload);
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    // GET /office-info  — public
    public function get($request, $response)
    {
        $info = $this->model->get();
        if ($info) return $this->jsonResponse($response, $info);
        return $this->jsonResponse($response, ['error' => 'Office info not found'], 404);
    }

    // PUT /office-info  — JWT-protected
    public function update($request, $response)
    {
        $data = $request->getParsedBody();
        if (empty($data) || !is_array($data)) {
            return $this->jsonResponse($response, ['error' => 'No data provided'], 400);
        }
        $updated = $this->model->update($data);
        if ($updated) return $this->jsonResponse($response, ['message' => 'Office info updated']);
        return $this->jsonResponse($response, ['error' => 'Failed to update'], 500);
    }
}
