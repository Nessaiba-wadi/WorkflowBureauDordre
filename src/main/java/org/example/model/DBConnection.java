package org.example.model;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnection {
    public static void main(String[] args) {
        // Paramètres de connexion mis à jour
        String url = "jdbc:sqlserver://localhost:1433;databaseName=BureauDordreWorkflow;encrypt=true;trustServerCertificate=true;";
        String user = "monUtilisateur";  // Utilisateur SQL Server
        String password = "password123@@";  // Mot de passe

        try {
            // Charger le driver JDBC
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");

            // Établir la connexion
            Connection conn = DriverManager.getConnection(url, user, password);
            System.out.println("Connexion réussie à la base de données !");

            // Fermer la connexion
            conn.close();
        } catch (ClassNotFoundException e) {
            System.out.println("Pilote JDBC introuvable !");
            e.printStackTrace();
        } catch (SQLException e) {
            System.out.println("Erreur de connexion !");
            e.printStackTrace();
        }
    }
}
