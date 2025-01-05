package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

func getApexData(projectDir string) (*ApexData, error) {
	apexFilePath := filepath.Join(projectDir, "apex.json")

	fmt.Println("📖 Checking for apex.json in:", apexFilePath)

	// Read apex.json file
	data, err := os.ReadFile(apexFilePath)
	if err != nil {
		fmt.Println("❌ Error reading apex.json:", err)
		return nil, err
	}

	// Parse JSON into ApexData struct
	var apexData ApexData
	if err := json.Unmarshal(data, &apexData); err != nil {
		fmt.Println("❌ Error parsing apex.json:", err)
		return nil, err
	}

	fmt.Println("✅ Successfully loaded APEX data for project:", projectDir)
	return &apexData, nil
}
