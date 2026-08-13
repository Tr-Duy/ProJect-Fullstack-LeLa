package com.lela.domain;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

@MappedSuperclass
@Setter
@Getter
public class BaseEnity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) //Để database tự động tăng giá trị id (AUTO_INCREMENT trong MySQL)
    private Long id;
}
