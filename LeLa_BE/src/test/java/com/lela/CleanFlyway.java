package com.lela;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CleanFlyway {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/flashcard_platfom";
        String user = "root";
        String password = "123456";
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            conn.setAutoCommit(true);
            int rows = stmt.executeUpdate("DELETE FROM flyway_schema_history WHERE version = '28'");
            System.out.println("Cleaned up failed migration 28. Rows affected: " + rows);
            
            ResultSet rs = stmt.executeQuery("SELECT version, success FROM flyway_schema_history");
            while (rs.next()) {
                System.out.println(rs.getString("version") + " - " + rs.getBoolean("success"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
