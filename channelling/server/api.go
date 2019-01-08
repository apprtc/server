package server

import ()

type ApiError struct {
	Id      string `json:"code"`
	Message string `json:"message"`
	Success bool   `json:"success"`
}

func NewApiError(id, message string) *ApiError {
	return &ApiError{id, message, false}
}
