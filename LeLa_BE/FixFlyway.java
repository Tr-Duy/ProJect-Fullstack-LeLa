import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class FixFlyway {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/flashcard_platfom";
        String user = "root";
        String password = "123456";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            int rows = stmt.executeUpdate("DELETE FROM flyway_schema_history WHERE success = 0");
            System.out.println("Deleted " + rows + " failed migrations.");
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
