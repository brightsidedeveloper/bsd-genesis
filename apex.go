package main

import (
	"encoding/json"
	"path/filepath"
)

// ApexData represents the entire apex.json file structure
type ApexData struct {
	Endpoints  []Endpoint  `json:"endpoints"`
	Schemas    []Schema    `json:"schemas"`
	Operations []Operation `json:"operations"`
}

// Endpoint represents an API route with methods and security settings
type Endpoint struct {
	Path    string   `json:"path"`
	Methods []string `json:"methods"`
	Secure  bool     `json:"secure"`
}

// Schema represents an object with fields, supporting nested objects and arrays
type Schema struct {
	Name   string          `json:"name"`
	Fields json.RawMessage `json:"fields"` // Raw JSON to support nested structures
}

// Operation links an endpoint with schemas for queries, bodies, and responses
type Operation struct {
	Endpoint       string `json:"endpoint"`
	Method         string `json:"method"`
	QuerySchema    string `json:"querySchema,omitempty"`
	BodySchema     string `json:"bodySchema,omitempty"`
	ResponseSchema string `json:"responseSchema,omitempty"`
}

func (a *App) GetApex(dir string) (*ApexData, error) {
	// Load apex.json file
	data, err := getApexData(filepath.Join(a.ProjectsDir, dir))
	if err != nil {
		return nil, err
	}

	return data, nil
}
