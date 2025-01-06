package main

import (
	"bufio"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

func (a *App) GetDSN(dir string) (string, error) {

	projectPath := filepath.Join(a.ProjectsDir, dir, dir+"-star")
	envFilePath := filepath.Join(projectPath, ".env")

	// ✅ Ensure .env file exists
	if _, err := os.Stat(envFilePath); os.IsNotExist(err) {
		return "", fmt.Errorf("⚠️ .env file not found in %s", envFilePath)
	}

	file, err := os.Open(envFilePath)
	if err != nil {
		return "", fmt.Errorf("❌ Failed to open .env file: %v", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if strings.HasPrefix(line, "DSN=") {
			return strings.TrimSpace(strings.TrimPrefix(line, "DSN=")), nil
		}
	}

	return "", fmt.Errorf("⚠️ DSN not found in .env file")
}

func (a *App) ConnectDB(dir string) error {
	if a.db != nil {
		return fmt.Errorf("⚠️ Database connection already exists")
	}

	a.mu.Lock()
	defer a.mu.Unlock()

	// ✅ Read DSN from .env file
	dsn, err := a.GetDSN(dir)
	if err != nil {
		return err
	}

	// ✅ Connect to database
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return fmt.Errorf("❌ Failed to connect to database: %v", err)
	}

	// ✅ Check if the connection is alive
	if err := db.PingContext(context.Background()); err != nil {
		db.Close()
		return fmt.Errorf("❌ Database ping failed: %v", err)
	}

	a.db = db
	log.Println("✅ Database connected successfully!")
	return nil
}

func (a *App) DisconnectDB() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.db == nil {
		fmt.Println("⚠️ No active database connection to disconnect")
		return nil
	}

	err := a.db.Close()
	if err != nil {
		return fmt.Errorf("❌ Error closing database: %v", err)
	}

	a.db = nil
	log.Println("✅ Database disconnected successfully!")
	return nil
}

func (a *App) GetTables(dir string) ([]string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.db == nil {
		fmt.Println("⚠️ No active database connection")
		return []string{}, nil // ✅ Return empty array instead of nil
	}

	query := `
		SELECT tablename 
		FROM pg_catalog.pg_tables 
		WHERE schemaname = 'public';
	`
	fmt.Println("🔍 Running query:", query)

	rows, err := a.db.Query(query)
	if err != nil {
		fmt.Printf("❌ Failed to retrieve tables: %v\n", err)
		return []string{}, nil // ✅ Return empty array on error
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var tableName string
		if err := rows.Scan(&tableName); err != nil {
			fmt.Printf("❌ Failed to scan table name: %v\n", err)
			return []string{}, nil // ✅ Return empty array on scan error
		}
		fmt.Println("✅ Found table:", tableName)
		tables = append(tables, tableName)
	}

	if err := rows.Err(); err != nil {
		fmt.Printf("❌ Error reading table names: %v\n", err)
		return []string{}, nil // ✅ Return empty array if iteration error
	}

	if len(tables) == 0 {
		fmt.Println("⚠️ No tables found in the database")
		return []string{}, nil // ✅ Return empty array if no tables found
	}

	fmt.Println("✅ Final list of tables:", tables)
	return tables, nil // ✅ Always return an array
}

func (a *App) CreateTable(dir string, tableName string, columns map[string]string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	fmt.Println("🔍 Creating table:", tableName, columns)

	if a.db == nil {
		return fmt.Errorf("⚠️ No active database connection")
	}

	// Validate input
	if tableName == "" {
		return fmt.Errorf("❌ Table name cannot be empty")
	}
	if len(columns) == 0 {
		return fmt.Errorf("❌ At least one column is required")
	}

	// ✅ Escape table name with double quotes to handle reserved words
	safeTableName := fmt.Sprintf("\"%s\"", tableName)

	// Construct the CREATE TABLE SQL statement
	query := fmt.Sprintf("CREATE TABLE IF NOT EXISTS %s (", safeTableName)
	columnDefs := []string{}
	for colName, colType := range columns {
		// ✅ Escape column names with double quotes to prevent conflicts
		columnDefs = append(columnDefs, fmt.Sprintf("\"%s\" %s", colName, colType))
	}
	query += strings.Join(columnDefs, ", ") + ");"

	fmt.Println("🚀 Executing query:", query)

	// Execute the query
	_, err := a.db.Exec(query)
	if err != nil {
		fmt.Printf("❌ Failed to create table %s: %v\n", tableName, err)
		return err
	}

	fmt.Printf("✅ Table %s created successfully!\n", tableName)
	return nil
}

func (a *App) GetTableSchema(dir string, tableName string) (map[string]string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	fmt.Println("🔍 Fetching schema for table:", tableName)

	if a.db == nil {
		return nil, fmt.Errorf("⚠️ No active database connection")
	}

	// ✅ Ensure table name is lowercase for PostgreSQL queries
	tableName = strings.ToLower(tableName)

	// ✅ Query PostgreSQL information schema to get column details
	query := `
		SELECT column_name, data_type 
		FROM information_schema.columns 
		WHERE table_name = $1 AND table_schema = 'public';
	`

	rows, err := a.db.Query(query, tableName)
	if err != nil {
		fmt.Printf("❌ Failed to fetch schema for table %s: %v\n", tableName, err)
		return nil, err
	}
	defer rows.Close()

	// ✅ Store column names and types in a map
	columns := make(map[string]string)
	for rows.Next() {
		var colName, colType string
		if err := rows.Scan(&colName, &colType); err != nil {
			fmt.Printf("❌ Error scanning row: %v\n", err)
			return nil, err
		}
		columns[colName] = colType
	}

	// ✅ Check if the table has no columns (possibly does not exist)
	if len(columns) == 0 {
		fmt.Printf("⚠️ No columns found for table %s\n", tableName)
		return nil, fmt.Errorf("⚠️ Table %s does not exist or has no columns", tableName)
	}

	fmt.Println("✅ Retrieved schema:", columns)
	return columns, nil
}

func (a *App) DropTable(dir string, tableName string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	fmt.Println("🗑️ Dropping table:", tableName)

	if a.db == nil {
		return fmt.Errorf("⚠️ No active database connection")
	}

	// ✅ Escape table name with double quotes to handle reserved words
	safeTableName := fmt.Sprintf(`"%s"`, tableName)

	// ✅ Construct DROP TABLE SQL statement
	query := fmt.Sprintf("DROP TABLE IF EXISTS %s CASCADE;", safeTableName)

	fmt.Println("🚀 Executing query:", query)

	// ✅ Execute the DROP TABLE query
	_, err := a.db.Exec(query)
	if err != nil {
		fmt.Printf("❌ Failed to drop table %s: %v\n", tableName, err)
		return err
	}

	fmt.Printf("✅ Table %s dropped successfully!\n", tableName)
	return nil
}

func (a *App) ExecuteSQLQuery(dir string, query string) ([]map[string]interface{}, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	fmt.Println("📝 Executing SQL Query:", query)

	if a.db == nil {
		return nil, fmt.Errorf("⚠️ No active database connection")
	}

	// ✅ Prepare statement (for security)
	rows, err := a.db.Query(query)
	if err != nil {
		fmt.Printf("❌ Query execution failed: %v\n", err)
		return nil, err
	}
	defer rows.Close()

	// ✅ Get column names
	columns, err := rows.Columns()
	if err != nil {
		fmt.Printf("❌ Failed to retrieve column names: %v\n", err)
		return nil, err
	}

	// ✅ Read the results into a slice of maps
	var results []map[string]interface{}
	for rows.Next() {
		// Create a slice to hold column values
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}

		// Scan row into value pointers
		if err := rows.Scan(valuePtrs...); err != nil {
			fmt.Printf("❌ Failed to scan row: %v\n", err)
			return nil, err
		}

		// Convert row into a map
		rowMap := make(map[string]interface{})
		for i, colName := range columns {
			rowMap[colName] = values[i]
		}

		results = append(results, rowMap)
	}

	fmt.Println("✅ Query executed successfully:", results)
	return results, nil
}

// SQLQuery represents a single query in the history
type SQLQuery struct {
	ID        string `json:"id"`
	Timestamp string `json:"timestamp"`
	Query     string `json:"query"`
}

// SQLQueryHistory is a list of queries stored in sql-editor.json
type SQLQueryHistory struct {
	Queries []SQLQuery `json:"queries"`
}

// GetSQLHistory loads the sql-editor.json file and returns the stored queries
func (a *App) GetSQLHistory(dir string) (*SQLQueryHistory, error) {
	filePath := a.getSQLHistoryFilePath(dir)

	// Check if the file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		fmt.Println("⚠️ No SQL history found, returning empty history.")
		return &SQLQueryHistory{}, nil // Return an empty history if the file doesn't exist
	}

	// Read the file
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("❌ Failed to read SQL history: %v", err)
	}

	// Parse JSON
	var history SQLQueryHistory
	if err := json.Unmarshal(data, &history); err != nil {
		return nil, fmt.Errorf("❌ Failed to parse SQL history: %v", err)
	}
	fmt.Println("✅ SQL history loaded successfully!", history)
	return &history, nil
}

// SaveSQLQuery appends a new query to sql-editor.json
func (a *App) SaveSQLQuery(dir, query string) error {
	filePath := a.getSQLHistoryFilePath(dir)

	// ✅ Load existing history
	history, err := a.GetSQLHistory(dir)
	if err != nil {
		return err
	}

	// ✅ Create a new query entry
	newQuery := SQLQuery{
		ID:        uuid.New().String(), // Generate a unique ID
		Timestamp: time.Now().Format(time.RFC3339),
		Query:     query,
	}

	// ✅ Append to history and save
	history.Queries = append(history.Queries, newQuery)
	data, err := json.MarshalIndent(history, "", "  ")
	if err != nil {
		return fmt.Errorf("❌ Failed to serialize SQL history: %v", err)
	}

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("❌ Failed to write SQL history: %v", err)
	}

	fmt.Println("✅ SQL query saved successfully!")
	return nil
}

// DeleteSQLQuery removes a query from sql-editor.json by ID
func (a *App) DeleteSQLQuery(dir, queryID string) error {
	filePath := a.getSQLHistoryFilePath(dir)

	// ✅ Load existing history
	history, err := a.GetSQLHistory(dir)
	if err != nil {
		return err
	}

	// ✅ Filter out the query with the given ID
	newQueries := []SQLQuery{}
	found := false
	for _, q := range history.Queries {
		if q.ID == queryID {
			found = true
			continue
		}
		newQueries = append(newQueries, q)
	}

	if !found {
		return fmt.Errorf("⚠️ Query with ID %s not found", queryID)
	}

	// ✅ Update and save the modified history
	history.Queries = newQueries
	data, err := json.MarshalIndent(history, "", "  ")
	if err != nil {
		return fmt.Errorf("❌ Failed to serialize updated SQL history: %v", err)
	}

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("❌ Failed to update SQL history: %v", err)
	}

	fmt.Printf("✅ Deleted query with ID: %s\n", queryID)
	return nil
}
