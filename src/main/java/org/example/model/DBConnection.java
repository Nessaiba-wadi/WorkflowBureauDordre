package org.example.model;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnection {
    private static final String URL = "jdbc:sqlserver://localhost:1433;databaseName=BureauDordreWorkflow;encrypt=true;trustServerCertificate=true;";
    private static final String USER = "monUtilisateur";
    private static final String PASSWORD = "password123@@";

    public static Connection getConnection() throws SQLException, ClassNotFoundException {
        Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }
}
