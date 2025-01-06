package main

import (
	"bufio"
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
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
		return fmt.Errorf("⚠️ No active database connection to disconnect")
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
