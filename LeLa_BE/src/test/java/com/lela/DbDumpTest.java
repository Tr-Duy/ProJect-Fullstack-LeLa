package com.lela;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

@SpringBootTest
public class DbDumpTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void dumpData() {
        System.out.println("====== DUMPING SUBSCRIPTION PLANS ======");
        List<Map<String, Object>> plans = jdbcTemplate.queryForList("SELECT id, name, billing_interval_count, price FROM subscription_plans");
        for (Map<String, Object> plan : plans) {
            System.out.println(plan);
        }
        
        System.out.println("====== DUMPING PAYMENTS ======");
        List<Map<String, Object>> payments = jdbcTemplate.queryForList("SELECT id, payment_code, amount, status, provider_transaction_id FROM payments ORDER BY id DESC LIMIT 5");
        for (Map<String, Object> p : payments) {
            System.out.println(p);
        }
    }
}
